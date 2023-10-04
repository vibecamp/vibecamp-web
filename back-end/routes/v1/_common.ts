import { VibeJWTPayload } from '../../common/data.ts'
import {
  RouteParams,
  Router,
  RouterContext,
  RouterMiddleware,
  Status,
} from 'oak'
import { getJwtPayload } from './auth.ts'
import { wait } from '../../utils.ts'
import { getNumericDate } from "djwts"

export type AnyRouterContext = RouterContext<
  string,
  RouteParams<string>,
  Record<string, unknown>
>

export type AnyRouterMiddleware = RouterMiddleware<string>

export const API_BASE = '/api/v1'

/**
 * Formalized way to define a route on a router:
 * - Requires the caller to specify a JSON return-type for the endpoint,
 *   to make sure there's a firm API contract
 * - Gives a clear way of invoking permissions-checking
 */
export function defineRoute<TResult>(
  router: Router,
  config:
    | {
      method: 'get' | 'post' | 'put' | 'delete'
      endpoint: string
      requireAuth?: false
      handler: (
        context: { ctx: AnyRouterContext; body: Record<string, unknown> },
      ) => Promise<[TResult | null, Status]>
    }
    | {
      method: 'get' | 'post' | 'put' | 'delete'
      endpoint: string
      requireAuth: true
      handler: (
        context: {
          ctx: AnyRouterContext
          body: Record<string, unknown>
          jwt: VibeJWTPayload
        },
      ) => Promise<[TResult | null, Status]>
    },
) {
  const endpoint = API_BASE + config.endpoint
  const handler: AnyRouterMiddleware = async (ctx, next) => {
    let parsedBody: Record<string, unknown> = {}

    try {
      if (config.method !== 'get') {
        parsedBody = await ctx.request.body({ type: 'json' }).value
      }
    } catch {
    }

    // if this route requires auth, decode the JWT payload and assert that
    // it exists
    if (config.requireAuth) {
      const jwt: VibeJWTPayload | null | undefined = await getJwtPayload(ctx)

      if (jwt == null || jwt.exp == null || getNumericDate(new Date()) > jwt.exp) {
        return [null, Status.Unauthorized]
      }

      const [res, status] = await Promise.race([
        config.handler({ ctx, body: parsedBody, jwt }),
        wait(HANDLER_TIMEOUT_MS).then(() =>
          [null, Status.RequestTimeout] as const
        ),
      ])

      ctx.response.body = JSON.stringify(res)
      ctx.response.status = status
      ctx.response.type = 'json'
      return next()
    } else {
      const [res, status] = await Promise.race([
        config.handler({ ctx, body: parsedBody }),
        wait(HANDLER_TIMEOUT_MS).then(() =>
          [null, Status.RequestTimeout] as const
        ),
      ])

      ctx.response.body = JSON.stringify(res)
      ctx.response.status = status
      ctx.response.type = 'json'
      return next()
    }
  }
  const args = [endpoint, handler] as const

  switch (config.method) {
    case 'get':
      router.get(...args)
      break
    case 'post':
      router.post(...args)
      break
    case 'put':
      router.put(...args)
      break
    case 'delete':
      router.delete(...args)
      break
  }
}

const HANDLER_TIMEOUT_MS = 10_000
