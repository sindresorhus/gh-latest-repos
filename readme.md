# gh-latest-repos

> Microservice to get the latest public GitHub repos from a user

I currently use this on [my website](https://sindresorhus.com/#projects).

It returns the 6 latest repos, unless specified otherwise and the results are cached for a day.

[Example response](example-response.json)


## Usage

### With [`now`](https://now.sh)

[![Deploy to now](https://deploy.now.sh/static/button.svg)](https://deploy.now.sh/?repo=https://github.com/sindresorhus/gh-latest-repos&env=GITHUB_TOKEN&env=GITHUB_USERNAME&env=ACCESS_ALLOW_ORIGIN&env=MAX_REPOS)

or

```
$ now sindresorhus/gh-latest-repos -e NODE_ENV=production -e GITHUB_TOKEN=xxx -e GITHUB_USERNAME=xxx -e ACCESS_ALLOW_ORIGIN=xxx -e MAX_REPOS=xxx
```

### Manual

Deploy to your hosting provider, set the below environment variables, and start it with `npm start`.


## Environment variables

Define the following environment variables:

- `GITHUB_TOKEN` - [Personal access token.](https://github.com/settings/tokens/new?description=gh-latest-repos)
- `GITHUB_USERNAME` - The username you like to get repos from.
- `ACCESS_ALLOW_ORIGIN` - The URL of your website or `*` if you want to allow any origin (not recommended), for the `Access-Control-Allow-Origin` header.
- `MAX_REPOS` - The number of repos returned. Optional. Defaults to 6.


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
