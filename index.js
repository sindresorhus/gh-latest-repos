'use strict';
const got = require('got');

const token = process.env.GITHUB_TOKEN;
const username = process.env.GITHUB_USERNAME;
const origin = process.env.ORIGIN;
const ONE_DAY = 1000 * 60 * 60 * 24;

if (!token) {
	throw new Error('Please set your GitHub token in the `GITHUB_TOKEN` environment variable');
}

if (!username) {
	throw new Error('Please set your GitHub username in the `GITHUB_USERNAME` environment variable');
}

if (!origin) {
	throw new Error('Please set the `access-control-allow-origin` you want in the `ORIGIN` environment variable');
}

const query = `
	query {
		user(login: "${username}") {
			repositories(
				last: 6,
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
	const {body} = await got.post('https://api.github.com/graphql/', {
		json: true,
		body: {query},
		headers: {
			authorization: `bearer ${token}`
		}
	});

	const repos = body.data.user.repositories.nodes;
	responseText = JSON.stringify(repos);
}

setInterval(fetchRepos, ONE_DAY);
fetchRepos();

module.exports = (request, response) => {
	response.setHeader('access-control-allow-origin', origin);

	if (origin !== '*') {
		response.setHeader('vary', 'origin');
	}

	response.end(responseText);
};
