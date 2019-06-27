# gh-latest-repos

> Microservice to get the latest public GitHub repos from a user

I currently use this on [my website](https://sindresorhus.com/#projects).

It returns the latest repos along with some metadata. The result is cached for a day.

[Example response](example-response.json)


## Usage

```
$ git clone https://github.com/sindresorhus/gh-latest-repos.git
$ now gh-latest-repos --env GITHUB_TOKEN=xxx --env GITHUB_USERNAME=xxx --env ACCESS_ALLOW_ORIGIN=xxx --env MAX_REPOS=xxx --env CACHE_MAX_AGE=xxx
```


## Environment variables

Define the following environment variables:

- `GITHUB_TOKEN` - [Personal access token.](https://github.com/settings/tokens/new?description=gh-latest-repos)
- `GITHUB_USERNAME` - The username you like to get repos from.
- `ACCESS_ALLOW_ORIGIN` - The URL of your website or `*` if you want to allow any origin (not recommended), for the `Access-Control-Allow-Origin` header.
- `MAX_REPOS` - The number of repos returned. Optional. Defaults to 6.
- `CACHE_MAX_AGE` - The maximum age for client cache-control in seconds. Optional. Defaults to 300 (5 minutes).


## License

MIT © [Sindre Sorhus](https://sindresorhus.com)
