import { Application, isHttpError, isErrorStatus, STATUS_TEXT } from 'oak'
import { router } from './routes/index.ts'

const app = new Application()

// Overengineering this a little to reduce allocations...
const spacesStrCache = new Map<number, string>()
const spaces = (length: number): string => {
  const cached = spacesStrCache.get(length)

  if (cached != null) {
    return cached
  } else {
    const str = new Array(length).fill(' ').join('')
    spacesStrCache.set(length, str)
    return str
  }
}

const pad = (str: string, length: number) => {
  const spacesToAdd = Math.max(length - str.length, 0)
  return str + spaces(spacesToAdd)
}

// middleware
app.use(async (ctx, next) => {
  await next()

  const baseLog = `[ ${new Date().toISOString()}  ${pad(ctx.request.method, 7)}  ${pad(ctx.request.url.pathname, 34)} ]: ${ctx.response.status} ${STATUS_TEXT[ctx.response.status]}`

  if (isErrorStatus(ctx.response.status)) {
    console.error(baseLog + '\t' + '<TODO error>')
  } else {
    console.info(baseLog)
  }
})


app.use(async (ctx, next) => {
  try {
    await next()
  } catch (err) {
    if (isHttpError(err)) {
      ctx.response.status = err.status
    } else {
      ctx.response.status = 500
    }
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
  'https://my.vibe.camp',
  'http://localhost:8080',
])

// routes
app.use(router.routes())
app.use(router.allowedMethods())

const port = 10_000
console.log(`Starting server on port ${port}`)
await app.listen({ port })
