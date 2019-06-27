import {createServer} from 'http';
import test from 'ava';
import got from 'got';
import nock from 'nock';
import testListen from 'test-listen';
import etag from 'etag';
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

	const response1 = {
		data: {
			user: {
				repositories: {
					edges: githubFixture.slice(0, 6)
				}
			}
		}
	};

	const response2 = {
		data: {
			user: {
				repositories: {
					edges: githubFixture.slice(6)
				}
			}
		}
	};

	nock('https://api.github.com/graphql')
		.persist()
		.filteringPath(pth => `${pth}/`)
		.matchHeader('authorization', `bearer ${process.env.GITHUB_TOKEN}`)
		.post('/')
		.reply(200, response1)
		.post('/')
		.reply(200, response2);

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
	const {body} = await got(url, {json: true});
	t.deepEqual(body.length, Number(process.env.MAX_REPOS), `Expected ${process.env.MAX_REPOS}, but got ${body.length}`);
});

test('set origin header', async t => {
	const {body, headers} = await got(url, {json: true});
	t.is(headers['access-control-allow-origin'], '*');
	t.is(headers['cache-control'], 's-maxage=86400000, max-age=300');
	t.is(headers.etag, etag(JSON.stringify(body)));
});

test('return cached content', async t => {
	const {headers: {etag}, statusCode} = await got(url, {json: true});
	const {statusCode: cachedStatusCode} = await got(url, {json: true, headers: {'if-none-match': etag}});
	t.is(statusCode, 200);
	t.is(cachedStatusCode, 304);
});
