import { Application } from './deps/oak.ts'
import { router } from "./routes/index.ts"

const app = new Application()

// middleware
app.use(async (ctx, next) => {
    ctx.response.headers.set('Content-Type', 'application/json')
    ctx.response.headers.append('Access-Control-Allow-Origin', 'https://vibe.camp/')
    ctx.response.headers.append('Access-Control-Allow-Origin', 'http://localhost/')

    await next()
})

// routes
app.use(router.routes())
app.use(router.allowedMethods())

console.log('Starting server on port 10000')
await app.listen({ port: 10000 })