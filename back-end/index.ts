import { Application, isHttpError, isErrorStatus, STATUS_TEXT, Response } from 'oak'
import { router } from './routes/index.ts'
import { ResponseWithError } from './routes/v1/_common.ts'
import { pad, indent } from './utils/misc.ts'

const app = new Application()

// --- Middleware ---

// log all requests, including errors as applicable
app.use(async (ctx, next) => {
  await next()

  const baseLog = `[ ${new Date().toISOString()}  ${pad(ctx.request.method, 7)}  ${pad(ctx.request.url.pathname, 34)} ]: ${ctx.response.status} ${STATUS_TEXT[ctx.response.status]}`
  const error = (ctx.response as ResponseWithError).error

  if (error) {
    console.error(baseLog + '\n' + indent(error))
  } else {
    console.info(baseLog)
  }
})

// catch thrown errors and convert them to 500 responses
app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err: unknown) {
    ctx.response.body = 'null'
    ctx.response.type = 'json'

    if (isHttpError(err)) {
      ctx.response.status = err.status
    } else {
      ctx.response.status = 500
    }

    if (err instanceof Error) {
      Error.captureStackTrace(err);
      (ctx.response as ResponseWithError).error = err.stack
    }
  }
})

// set CORS headers
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
  'https://my.vibe.camp',
  'http://localhost:8080',
])

// routes
app.use(router.routes())
app.use(router.allowedMethods())

const port = 10_000
console.log(`Starting server on port ${port}`)
await app.listen({ port })
