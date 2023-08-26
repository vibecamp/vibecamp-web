import { VibeJWTPayload } from "https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts";
import { RouteParams, Router, RouterContext, RouterMiddleware, Status } from "oak";
import { getJwtPayload } from "./auth.ts";

export type AnyRouterContext = RouterContext<string, RouteParams<string>, Record<string, unknown>>

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
            method: 'get' | 'post' | 'put' | 'delete',
            endpoint: string,
            requireAuth?: false,
            handler: (ctx: AnyRouterContext) => Promise<[TResult | null, Status]>
        }
        | {
            method: 'get' | 'post' | 'put' | 'delete',
            endpoint: string,
            requireAuth: true,
            handler: (ctx: AnyRouterContext, jwt: VibeJWTPayload) => Promise<[TResult | null, Status]>
        }
) {
    const endpoint = API_BASE + config.endpoint
    const handler: AnyRouterMiddleware = async (ctx, next) => {
        let jwt: VibeJWTPayload | undefined

        // if this route requires auth, decode the JWT payload and assert that
        // it exists
        if (config.requireAuth) {
            jwt = await getJwtPayload(ctx)

            if (jwt == null) {
                return [null, Status.Unauthorized]
            }
        }

        const [res, status] = await config.handler(ctx, jwt)

        ctx.response.type = "json"
        ctx.response.body = JSON.stringify(res)
        ctx.response.status = status

        return next()
    }
    const args = [endpoint, handler] as const

    switch (config.method) {
        case 'get': router.get(...args); break;
        case 'post': router.post(...args); break;
        case 'put': router.put(...args); break;
        case 'delete': router.delete(...args); break;
    }
}