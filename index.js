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

if (!token) {
	throw new Error('Please set your GitHub token in the `GITHUB_TOKEN` environment variable');
}

if (!username) {
	throw new Error('Please set your GitHub username in the `GITHUB_USERNAME` environment variable');
}

if (!origin) {
	throw new Error('Please set the `access-control-allow-origin` you want in the `ACCESS_ALLOW_ORIGIN` environment variable');
}

const query = (cursor = null, last) => `
	query {
		user(login: "${username}") {
			repositories(
				${cursor ? `before: "${cursor}",` : ''}
				last: ${last},
				isFork: false,
				isLocked: false,
				ownerAffiliations: OWNER,
				privacy: PUBLIC,
				orderBy: {
					field: CREATED_AT,
					direction: ASC
				}
			) {
				nodes {
					name
					description
					url
					primaryLanguage {
						name
						color
					}
					stargazers() {
						totalCount
					}
					forks() {
						totalCount
					}
				}
				edges {
          cursor
        }
			}
		}
	}
`;

let responseText = '[]';
let responseETag = '';

async function queryRepos(size, cursor) {
	const {body} = await graphqlGot('api.github.com/graphql', {
		query: query(cursor, size),
		token
	});
	const repositories = body.user.repositories.nodes.filter(repo => Boolean(repo.description));
	if (repositories.length < size && body.user.repositories.edges.length > 0) {
		repositories.push(...(await queryRepos(size - repositories.length, body.user.repositories.edges[0].cursor)));
	}

	return repositories;
}

async function fetchRepos() {
	const repositories = await queryRepos(maxRepos);

	const repos = repositories.map(repo => ({
		...repo,
		stargazers: repo.stargazers.totalCount,
		forks: repo.forks.totalCount
	}));
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
