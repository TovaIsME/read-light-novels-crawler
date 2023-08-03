# readlightnovels.net Crawler

A crawler for readlightnovels.net. The crawled data is served through endpoints powered by Hono.

# Stack

Cloudflare Worker, Hono, and HTMLRewriter

# Installation and Local Development

```
git clone https://github.com/tanerijun/read-light-novels-crawler.git
cd read-light-novels-crawler
npm i
npm run dev
```

# Deploy

```
npm run deploy
```

Note that if you've never used wrangler before, you'll be prompted to login.

Or as an alternative:

[![Deploy to Cloudflare Workers](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/tanerijun/read-light-novels-crawler)

# How To Use

- Visit the index route ("/") to view all available endpoints
- Visit individual route for more information and examples on how to use the route

# Examples

- /search?title=overlord

```json
{
	"results": {
		"novels": [
			{
				"id": "overlord-ln",
				"title": "Overlord (LN)",
				"image": "https://readlightnovels.net/wp-content/uploads/2020/01/overlord-ln-isrnbdfhbq.jpg",
				"lastChapter": "Volume 14"
			},
			{
				"id": "overlord-wn",
				"title": "Overlord (WN)",
				"image": "https://readlightnovels.net/wp-content/uploads/2020/01/overlord-wn-nfg33krrcr.jpg",
				"lastChapter": "Volume 2 Chapter 26"
			}
		],
		"page": 1,
		"hasPrevPage": false,
		"hasNextPage": true
	}
}
```

- /novel/overlord-ln

```json
{
	"results": {
		"id": "overlord-ln",
		"novelKey": "1108281",
		"title": "Overlord (LN)",
		"image": "https://readlightnovels.net/wp-content/uploads/2020/01/overlord-ln-isrnbdfhbq.jpg",
		"authors": [
			{
				"id": "maruyama-kugane",
				"name": "Maruyama Kugane"
			}
		],
		"genre": [
			"action",
			"adventure",
			"comedy",
			"drama",
			"fantasy",
			"mature",
			"psychological",
			"seinen"
		],
		"status": "Completed"
	}
}
```
