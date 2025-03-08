import { Maybe, VibeJWTPayload } from '../../types/misc.ts'
import {
  Response,
  RouteParams,
  Router,
  RouterContext,
  RouterMiddleware,
  Status,
} from 'oak'
import { getJwtPayload } from './auth.ts'
import { wait } from '../../utils/misc.ts'
import { getNumericDate } from 'djwts'
import { Routes } from '../../types/route-types.ts'
import { ONE_DAY_MS, ONE_SECOND_MS } from '../../utils/constants.ts'

export type AnyRouterContext = RouterContext<
  string,
  RouteParams<string>,
  Record<string, unknown>
>

export type AnyRouterMiddleware = RouterMiddleware<string>

export const API_BASE = '/api/v1'

type RouteResponse<TResult> = Promise<Readonly<[(TResult) | null, Status]>>

type UnauthenticatedRouteContext<TEndpoint extends keyof Routes> = {
  ctx: AnyRouterContext & { response: ResponseWithError }
  body: Routes[TEndpoint]['body']
}

type AuthenticatedRouteContext<TEndpoint extends keyof Routes> =
  & UnauthenticatedRouteContext<TEndpoint>
  & {
    jwt: VibeJWTPayload
  }

type AnyRouteContext =
  & UnauthenticatedRouteContext<keyof Routes>
  & Partial<AuthenticatedRouteContext<keyof Routes>>

export type ResponseWithError = Response & { error?: string }

/**
 * Formalized way to define a route on a router:
 * - Requires the caller to specify a JSON return-type for the endpoint,
 *   to make sure there's a firm API contract
 * - Gives a clear way of invoking permissions-checking
 */
export function defineRoute<TEndpoint extends keyof Routes>(
  router: Router,
  config:
    | {
      method: Routes[TEndpoint]['method']
      endpoint: TEndpoint
      requireAuth?: false
      handler: (
        context: UnauthenticatedRouteContext<TEndpoint>,
      ) => RouteResponse<Routes[TEndpoint]['response']>
    }
    | {
      method: Routes[TEndpoint]['method']
      endpoint: TEndpoint
      requireAuth: true
      handler: (
        context: AuthenticatedRouteContext<TEndpoint>,
      ) => RouteResponse<Routes[TEndpoint]['response']>
    },
) {
  const endpoint = API_BASE + config.endpoint
  const handler: AnyRouterMiddleware = async (ctx, next) => {
    let parsedBody = {} as Routes[TEndpoint]['body']

    if (config.method !== 'get') {
      parsedBody = await ctx.request.body({ type: 'json' }).value
    }

    // if this route requires auth, decode the JWT payload and assert that
    // it exists
    if (config.requireAuth) {
      const jwt: Maybe<VibeJWTPayload> = await getJwtPayload(ctx)

      if (
        jwt == null || jwt.exp == null || getNumericDate(new Date()) > jwt.exp
      ) {
        constructResponse(ctx, [null, Status.Unauthorized])
      } else {
        const response = await Promise.race([
          config.handler({ ctx, body: parsedBody, jwt }),
          timeout(),
        ])

        constructResponse(ctx, response)
      }

      return next()
    } else {
      const response = await Promise.race([
        config.handler({ ctx, body: parsedBody }),
        timeout(),
      ])

      constructResponse(ctx, response)

      return next()
    }
  }
  const args = [endpoint, handler] as const

  router[config.method](...args)
}

function constructResponse<TEndpoint extends keyof Routes>(
  ctx: AnyRouterContext,
  [res, status]: readonly [Routes[TEndpoint]['response'], Status],
) {
  ctx.response.body = JSON.stringify(res)
  ctx.response.status = status
  ctx.response.type = 'json'
}

async function timeout() {
  await wait(20 * ONE_SECOND_MS)
  return [null, Status.RequestTimeout] as const
}

export const rateLimited = <
  TContext extends AnyRouteContext,
  TReturn extends [unknown, Status],
>(
  ms: number,
  fn: (context: TContext) => Promise<TReturn>,
): (context: TContext) => Promise<[TReturn[0] | null, Status]> => {
  const lastRequestFor = new Map<string, number>()

  setInterval(() => {
    lastRequestFor.clear()
  }, ONE_DAY_MS)

  return async (context: TContext): Promise<[TReturn[0] | null, Status]> => {
    const rateLimitKey = context.ctx.request.ip

    const lastRequestForThis = lastRequestFor.get(rateLimitKey)
    if (lastRequestForThis != null && Date.now() - lastRequestForThis < ms) {
      return [null, Status.TooManyRequests]
    }

    lastRequestFor.set(rateLimitKey, Date.now())
    return fn(context)
  }
}

export const cached = <TReturn>(
  ms: number,
  fn: (context: AnyRouteContext) => Promise<TReturn>,
): (context: AnyRouteContext) => Promise<TReturn> => {
  let cache: { timestamp: number; value: TReturn } | undefined

  return async (context: AnyRouteContext): Promise<TReturn> => {
    if (cache != null && Date.now() - cache.timestamp < ms) {
      return cache.value
    }

    const value = await fn(context)

    cache = { timestamp: Date.now(), value }

    return value
  }
}
