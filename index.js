'use strict';
const graphqlGot = require('graphql-got');
const controlAccess = require('control-access');

const ONE_DAY = 60 * 60 * 24;

const {
	GITHUB_TOKEN,
	GITHUB_USERNAME,
	ACCESS_ALLOW_ORIGIN,
	MAX_REPOS = 6
} = process.env;

if (!GITHUB_TOKEN) {
	throw new Error('Please set your GitHub token in the `GITHUB_TOKEN` environment variable');
}

if (!GITHUB_USERNAME) {
	throw new Error('Please set your GitHub username in the `GITHUB_USERNAME` environment variable');
}

if (!ACCESS_ALLOW_ORIGIN) {
	throw new Error('Please set the `access-control-allow-origin` you want in the `ACCESS_ALLOW_ORIGIN` environment variable');
}

const query = `
	query ($cursor: String) {
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
				before: $cursor
			) {
				edges {
					node {
						createdAt
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

const fetchRepos = async (repos = [], cursor = null) => {
	const {body} = await graphqlGot('api.github.com/graphql', {
		query,
		token: GITHUB_TOKEN,
		variables: {cursor}
	});

	const currentRepos = body.user.repositories.edges
		.filter(({node: repo}) => repo.description && repo.name !== '.github')
		.map(({node: repo}) => ({
			...repo,
			stargazers: repo.stargazers.totalCount,
			forks: repo.forks.totalCount
		}));

	if ((repos.length + currentRepos.length) < MAX_REPOS) {
		return fetchRepos(repos.concat(currentRepos), body.user.repositories.edges[0].cursor);
	}

	return repos.concat(currentRepos.slice(repos.length - MAX_REPOS));
};

module.exports = async (request, response) => {
	controlAccess()(request, response);

	try {
		const repos = await fetchRepos();

		repos.sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));

		response.setHeader('content-type', 'application/json');
		response.setHeader('cache-control', `s-maxage=${ONE_DAY}, max-age=0`);
		response.end(JSON.stringify(repos));
	} catch (error) {
		console.error(error);

		response.statusCode = 500;
		response.setHeader('content-type', 'text/plain');
		response.end('Internal server error');
	}
};
