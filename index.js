'use strict';
const graphqlGot = require('graphql-got');
const controlAccess = require('control-access');
const etag = require('etag');

const ONE_DAY = 1000 * 60 * 60 * 24;
const {
	GITHUB_TOKEN,
	GITHUB_USERNAME,
	ACCESS_ALLOW_ORIGIN,
	CACHE_MAX_AGE = 300,
	MAX_REPOS = 6
} = process.env;

if (!GITHUB_TOKEN) {
	throw new Error(
		'Please set your GitHub token in the `GITHUB_TOKEN` environment variable'
	);
}

if (!GITHUB_USERNAME) {
	throw new Error(
		'Please set your GitHub username in the `GITHUB_USERNAME` environment variable'
	);
}

if (!ACCESS_ALLOW_ORIGIN) {
	throw new Error(
		'Please set the `access-control-allow-origin` you want in the `ACCESS_ALLOW_ORIGIN` environment variable'
	);
}

const query = `
	query {
		user(login: "${GITHUB_USERNAME}") {
			repositories(
				last: ${MAX_REPOS},
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
			}
		}
	}
`;

let responseETag = '';

module.exports = async (request, response) => {
	controlAccess()(request, response);

	if (request.headers.etag === responseETag) {
		response.statusCode = 304;
		response.end();
		return;
	}

	try {
		const {body} = await graphqlGot('api.github.com/graphql', {
			query,
			token: GITHUB_TOKEN
		});

		const repos = JSON.stringify(
			body.user.repositories.nodes.map(repo => ({
				...repo,
				stargazers: repo.stargazers.totalCount,
				forks: repo.forks.totalCount
			}))
		);

		responseETag = etag(repos);

		response.setHeader('cache-control', `s-maxage=${ONE_DAY}, max-age=${CACHE_MAX_AGE}`);
		response.setHeader('etag', responseETag);
		response.end(repos);
	} catch (error) {
		console.error(error);

		response.statusCode = 500;
		response.setHeader('content-type', 'text/plain');
		response.end('Internal server error');
	}
};
