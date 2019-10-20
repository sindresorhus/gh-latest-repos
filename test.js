import {createServer} from 'http';
import test from 'ava';
import got from 'got';
import nock from 'nock';
import testListen from 'test-listen';
import fixture from './example-response';
import githubFixture from './github-response';

const ORIGIN = process.env.ACCESS_ALLOW_ORIGIN;
const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME;
process.env.CACHE_MAX_AGE = 300;
process.env.MAX_REPOS = 6;

let url;

test.before(async () => {
	process.env.ACCESS_ALLOW_ORIGIN = '*';
	process.env.GITHUB_TOKEN = 'unicorn';
	process.env.GITHUB_USERNAME = 'sindresorhus';

	const response = {
		data: {
			user: {
				repositories: {
					edges: githubFixture.slice(6)
				}
			}
		}
	};

	const maxReposResponse = {
		data: {
			user: {
				repositories: {
					edges: githubFixture.slice(0, 6)
				}
			}
		}
	};

	nock('https://api.github.com/graphql')
		.persist()
		.filteringPath(pth => `${pth}/`)
		.matchHeader('authorization', `bearer ${process.env.GITHUB_TOKEN}`)
		.post('/')
		.reply(200, response)
		.post('/max-repos')
		.reply(200, maxReposResponse);

	url = await testListen(createServer(require('.')));
});

test.after(() => {
	process.env.ACCESS_ALLOW_ORIGIN = ORIGIN;
	process.env.GITHUB_TOKEN = TOKEN;
	process.env.GITHUB_USERNAME = USERNAME;
});

test('fetch latest repos for user', async t => {
	const {body} = await got(url, {json: true});
	t.deepEqual(body, fixture);
	if (body.length > 0) {
		t.is(typeof body[0].stargazers, 'number');
		t.is(typeof body[0].forks, 'number');
	}
});

test('ensure number of repos returned equals `process.env.MAX_REPOS`', async t => {
	const {body} = await got(`${url}/max-repos`, {json: true});
	t.deepEqual(body.length, Number(process.env.MAX_REPOS), `Expected ${process.env.MAX_REPOS}, but got ${body.length}`);
});

test('set origin header', async t => {
	const {headers} = await got(url, {json: true});
	t.is(headers['access-control-allow-origin'], '*');
	t.is(headers['cache-control'], 's-maxage=86400, max-age=0');
});
