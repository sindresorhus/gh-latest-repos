'use strict';
const graphqlGot = require('graphql-got');
const controlAccess = require('control-access');
const etag = require('etag');

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;
const origin = process.env.ACCESS_ALLOW_ORIGIN;
const cache = `max-age=${Number(process.env.CACHE_MAX_AGE) || 300}`;
const maxRepos = Number(process.env.MAX_REPOS) || 6;
const ONE_DAY = 1000 * 60 * 60 * 24;
let cursor = null;

if (!token) {
	throw new Error('Please set your GitHub token in the `GITHUB_TOKEN` environment variable');
}

if (!username) {
	throw new Error('Please set your GitHub username in the `GITHUB_USERNAME` environment variable');
}

if (!origin) {
	throw new Error('Please set the `access-control-allow-origin` you want in the `ACCESS_ALLOW_ORIGIN` environment variable');
}

const query = `
	query {
		user(login: "${username}") {
			repositories(
				last: ${maxRepos},
				isFork: false,
				isLocked: false,
				ownerAffiliations: OWNER,
				privacy: PUBLIC,
				orderBy: {
					field: CREATED_AT,
					direction: ASC
				}
				before: ${cursor}
			) {
				edges {
					node {
						name
						description
						url
						primaryLanguage {
							name
							color
						}
						stargazers {
							totalCount
						}
						forks {
							totalCount
						}
					}
					cursor
				}
			}
		}
	}
`;

let responseText = '[]';
let responseETag = '';

async function fetchRepos() {
	let repos = [];

	while (repos.length < maxRepos) {
		/* eslint-disable no-await-in-loop */
		const {body} = await graphqlGot('api.github.com/graphql', {
			query,
			token
		});

		const currentRepos = body.user.repositories.edges
			.filter(edge => edge.node.description)
			.map(({node: repo}) => ({
				...repo,
				stargazers: repo.stargazers.totalCount,
				forks: repo.forks.totalCount
			}));

		if (repos.length + currentRepos.length < maxRepos) {
			repos = repos.concat(currentRepos);
		} else {
			repos = repos.concat(currentRepos.slice(repos.length - maxRepos));
			break;
		}
		cursor = body.user.repositories.edges[0].cursor;
	}

	responseText = JSON.stringify(repos);
	responseETag = etag(responseText);
}

setInterval(fetchRepos, ONE_DAY);
fetchRepos();

module.exports = (request, response) => {
	controlAccess()(request, response);
	response.setHeader('cache-control', cache);
	response.setHeader('etag', responseETag);

	if (request.headers.etag === responseETag) {
		response.statusCode = 304;
		response.end();
		return;
	}

	response.end(responseText);
};
