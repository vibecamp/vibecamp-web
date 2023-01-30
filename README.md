
# Vibecamp web systems, 2.0

This repository contains both the front-end and the back-end for Vibecamp's new web stack.

We are moving to a unified stack for:
- The public-facing site
- Administration
- User self-service/account management (not built yet at time of writing)
- A vibecamp API that others can use to build their own apps! (TBD)

## Architecture

The front- and back-end here both run on render.com, alongside our Postgres DB. Pushes to either subdirectory on the main branch will automatically deploy to production. The `common/` directory is for code that's shared between the front-end and back-end. Due to some subtleties in the TypeScript ecosystem, there are some limits around the kind of code that can be shared (most prominently: right now, modules under `common/` can't import other modules under `common/`). There are some changes coming in TypeScript 5.0 that may solve this problem at let us share more code.

The back-end is built on [Deno](https://deno.land), a modern TypeScript-native JavaScript runtime (analogous to Node). It uses the Oak web framework (analogous to Express). It exposes a fairly standard HTTP API, used by the front-end here (and hopefully one day by other front-ends!). The API is organized into a `v1` subset, to future-proof for a scenario where we need to make breaking changes but maintain compatibility.

The front-end is a static site generated using Next.js. It does not have a running server in production; at build time, HTML + CSS + client-side JS files are built and then pushed to render.com's CDN. Public-facing static pages have their HTML generated at build time for quick loading, while anything dynamic in the UI will take the form of client-side React (making calls to the back-end).

## Running locally

To run a local back-end, you'll first need Deno installed. It can be found on the web, or in some package managers.

Next you'll need to grab all the back-end environment secrets from render.com and set them in your local environment, and then run:
```
deno run --allow-all --check index.ts
```
(from `back-end/`; you could also run `back-end/index.ts` from the root directory)

> Note: The `DB_CONNECTION_STRING` set in production is local to render.com's internal servers. For local development, you'll need to get the "External Database URL" from the db on render.com and use that instead

To run the front-end locally you'll need Node installed, and you'll need to do an `npm install` from within the `front-end/` directory.

Then you can either run it in dev mode:
```
npm run dev
```
or run it in production-ish mode:
```
npm run build && npm run start
```
Dev mode will be a little slower as you navigate the site, but it will be quicker to start up and it will give you hot-reloading if you're editing front-end code (saved files will immediately take effect without a page refresh).

By default the back-end starts on port 10000 and the front-end will make API requests to `http://127.0.0.1:10000`, so if you're running the back-end locally you're good. However you can also point your local front-end at the production back-end, by setting the `BACK_END_ORIGIN` that it's configured to point at on render.com in your local environment.