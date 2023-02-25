import { PermissionLevel } from "https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts";
import { RouteParams, Router, RouterContext, RouterMiddleware, Status } from "../../deps/oak.ts";
import { requirePermissionLevel } from "./auth.ts";

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
    config: {
        method: 'get' | 'post' | 'put' | 'delete',
        endpoint: `/${string}`,
        permissionLevel: PermissionLevel,
        handler: (ctx: AnyRouterContext) => Promise<[TResult, Status]>
    }
) {
    const routerMethod = (...args: any[]) => {
        switch (config.method) {
            // @ts-ignore
            case 'get': router.get(...args); break;
            // @ts-ignore
            case 'post': router.post(...args); break;
            // @ts-ignore
            case 'put': router.put(...args); break;
            // @ts-ignore
            case 'delete': router.delete(...args); break;
        }
    }
    const endpoint = API_BASE + config.endpoint
    const handler: AnyRouterMiddleware = async (ctx, next) => {
        const [res, status] = await config.handler(ctx)

        ctx.response.type = "json"
        ctx.response.body = JSON.stringify(res)
        ctx.response.status = status

        return next()
    }

    if (config.permissionLevel !== 'public') {
        routerMethod(endpoint, requirePermissionLevel(config.permissionLevel), handler)
    } else {
        routerMethod(endpoint, handler)
    }
}