import type { NextRequest } from 'next/server'
import type { Maybe, VibeJWTPayload } from '@/contract/misc'
import type { Routes } from '@/contract/route-types'
import { CartError } from '@/lib/cart'
import { getJwtPayload } from '@/server/auth'

export type Status = 200 | 409 | 400 | 401 | 404 | 429 | 500

export type RouteResult<TResponse> = readonly [TResponse | null, Status]

type BaseContext<E extends keyof Routes> = {
    req: NextRequest
    body: Routes[E]['body']
}

type AuthedContext<E extends keyof Routes> = BaseContext<E> & { jwt: VibeJWTPayload }

type Handler<E extends keyof Routes, Ctx> = (
    ctx: Ctx,
) => Promise<RouteResult<Routes[E]['response']>>

type RouteConfig<E extends keyof Routes> =
    | {
          endpoint: E
          method: Routes[E]['method']
          requireAuth?: false
          handler: Handler<E, BaseContext<E>>
      }
    | {
          endpoint: E
          method: Routes[E]['method']
          requireAuth: true
          handler: Handler<E, AuthedContext<E>>
      }

type NextHandler = (req: NextRequest) => Promise<Response>

export function defineRoute<E extends keyof Routes>(
    config: RouteConfig<E>,
): { [M in Uppercase<Routes[E]['method']>]: NextHandler } {
    const handler: NextHandler = async (req) => {
        let body = undefined as Routes[E]['body']

        if (req.method !== 'GET') {
            try {
                body = (await req.json()) as Routes[E]['body']
            } catch {
                return respond([null, 400])
            }
        }

        try {
            if (config.requireAuth) {
                const jwt: Maybe<VibeJWTPayload> = await getJwtPayload(req)
                if (jwt == null) {
                    return respond([null, 401])
                }
                return respond(await config.handler({ req, body, jwt }))
            }
            return respond(await config.handler({ req, body }))
        } catch (err) {
            if (err instanceof CartError)
                return Response.json(
                    { error: err.code, detail: err.detail },
                    {
                        status:
                            err.status ??
                            (err.code === 'invalid_request'
                                ? 400
                                : err.code === 'needs_attention'
                                  ? 500
                                  : 409),
                    },
                )
            console.error(`[${req.method} ${req.nextUrl.pathname}]`, err)
            return respond([null, 500])
        }
    }

    return { [config.method.toUpperCase()]: handler } as {
        [M in Uppercase<Routes[E]['method']>]: NextHandler
    }
}

function respond([result, status]: RouteResult<unknown>): Response {
    return Response.json(result ?? null, { status })
}

export function rateLimited<E extends keyof Routes, Ctx extends BaseContext<E>>(
    ms: number,
    fn: Handler<E, Ctx>,
): Handler<E, Ctx> {
    const lastRequestFor = new Map<string, number>()
    setInterval(() => lastRequestFor.clear(), 24 * 60 * 60 * 1000).unref()

    return async (ctx) => {
        const key = ctx.req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'local'
        const last = lastRequestFor.get(key)
        if (last != null && Date.now() - last < ms) {
            return [null, 429]
        }
        lastRequestFor.set(key, Date.now())
        return fn(ctx)
    }
}
