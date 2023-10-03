import { Application, isHttpError } from 'oak'
import { router } from "./routes/index.ts"

const app = new Application()

// middleware
app.use(async (ctx, next) => {
    try {
        await next()
    } catch (err) {
        console.log({ err })
        if (isHttpError(err)) {
            ctx.response.status = err.status
        } else {
            ctx.response.status = 500
        }
        ctx.response.body = { error: err.message }
        ctx.response.type = "json"
    }
})

app.use(async (ctx, next) => {
    ctx.response.headers.set('Access-Control-Allow-Credentials', 'true')
    ctx.response.headers.set('Access-Control-Allow-Headers', 'Authorization')

    // https://stackoverflow.com/a/1850482
    const requesterOrigin = ctx.request.headers.get('origin')

    if (requesterOrigin != null && ALLOWED_ORIGINS.has(requesterOrigin)) {
        ctx.response.headers.append('Access-Control-Allow-Origin', requesterOrigin)
    }

    await next()
})

const ALLOWED_ORIGINS = new Set([
    'https://vibe.camp',
    'https://next.vibe.camp',
    'http://localhost:8080'
])

// routes
app.use(router.routes())
app.use(router.allowedMethods())

const port = 10_000
console.log(`Starting server on port ${port}`)
await app.listen({ port })