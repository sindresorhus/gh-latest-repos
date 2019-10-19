# gh-latest-repos

> Microservice to get the latest public GitHub repos from a user

I currently use this on [my website](https://sindresorhus.com/#projects).

It returns the latest repos along with some metadata. The result is cached for a day.

[Example response](example-response.json)


## Usage

### With [`now`](https://now.sh)

```
$ git clone https://github.com/sindresorhus/gh-latest-repos.git
$ now gh-latest-repos --env GITHUB_TOKEN=xxx --env GITHUB_USERNAME=xxx --env ACCESS_ALLOW_ORIGIN=xxx --env MAX_REPOS=xxx
```

### Manual

To deploy on your own hosting provider, check out [11e01ac](https://github.com/sindresorhus/gh-latest-repos/commit/11e01acb0d0fd40d69c03155e9862b4cdc71b6f2), set the below environment variables, and start it with `npm start`.


## Environment variables

Define the following environment variables:

- `GITHUB_TOKEN` - [Personal access token.](https://github.com/settings/tokens/new?description=gh-latest-repos)
- `GITHUB_USERNAME` - The username you like to get repos from.
- `ACCESS_ALLOW_ORIGIN` - The URL of your website or `*` if you want to allow any origin (not recommended), for the `Access-Control-Allow-Origin` header.
- `MAX_REPOS` - The number of repos returned. Optional. Defaults to 6.
