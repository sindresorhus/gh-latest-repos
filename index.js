'use strict';
const graphqlGot = require('graphql-got');
const controlAccess = require('control-access');

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;
const origin = process.env.ACCESS_ALLOW_ORIGIN;
const maxRepos = process.env.MAX_REPOS ? process.env.MAX_REPOS : 6;
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

const query = `
	query {
		user(login: "${username}") {
			repositories(
				last: ${maxRepos},
				isFork: false,
				affiliations: OWNER,
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
				}
			}
		}
	}
`;

let responseText = '[]';

async function fetchRepos() {
	const {body} = await graphqlGot('api.github.com/graphql', {
		query,
		token
	});

	const repos = body.user.repositories.nodes;
	responseText = JSON.stringify(repos);
}

setInterval(fetchRepos, ONE_DAY);
fetchRepos();

module.exports = (request, response) => {
	controlAccess()(request, response);
	response.end(responseText);
};
