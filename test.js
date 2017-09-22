import test from 'ava';
import got from 'got';
import micro from 'micro';
import nock from 'nock';
import testListen from 'test-listen';
import delay from 'delay';
import fixture from './example-response';

const ORIGIN = process.env.ORIGIN;
const TOKEN = process.env.GITHUB_TOKEN;
const USERNAME = process.env.GITHUB_USERNAME;

let url;

test.before(async () => {
	process.env.ORIGIN = '*';
	process.env.GITHUB_TOKEN = 'unicorn';
	process.env.GITHUB_USERNAME = 'sindresorhus';

	const response = {
		data: {
			user: {
				repositories: {
					nodes: fixture
				}
			}
		}
	};

	nock('https://api.github.com/graphql')
		.filteringPath(pth => `${pth}/`)
		.matchHeader('authorization', `bearer ${process.env.GITHUB_TOKEN}`)
		.post('/')
		.reply(200, response);

	url = await testListen(micro(require('.')));

	await delay(1000);
});

test.after(() => {
	process.env.ORIGIN = ORIGIN;
	process.env.GITHUB_TOKEN = TOKEN;
	process.env.GITHUB_USERNAME = USERNAME;
});

test('fetch latest repos for user', async t => {
	const {body} = await got(url, {json: true});
	t.deepEqual(body, fixture);
});
