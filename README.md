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
