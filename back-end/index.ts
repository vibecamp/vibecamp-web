import { Application } from './deps/oak.ts'
import { router } from "./routes/index.ts"

const app = new Application()

// middleware
app.use(async (ctx, next) => {
    ctx.response.headers.set('Content-Type', 'application/json')

    // https://stackoverflow.com/a/1850482
    const requesterOrigin = ctx.request.headers.get('origin')
    console.log({ requesterOrigin })
    if (requesterOrigin != null && ALLOWED_ORIGINS.has(requesterOrigin)) {
        ctx.response.headers.append('Access-Control-Allow-Origin', requesterOrigin)
    }

    await next()
})

const ALLOWED_ORIGINS = new Set([
    'https://vibe.camp',
    'https://next.vibe.camp',
    'http://localhost:3000'
])

// routes
app.use(router.routes())
app.use(router.allowedMethods())

console.log('Starting server on port 10000')
await app.listen({ port: 10000 })