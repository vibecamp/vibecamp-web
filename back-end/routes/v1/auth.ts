import { PermissionLevel } from "https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts";
import { Router, Status } from "../../deps/oak.ts";
import { AnyRouterContext, AnyRouterMiddleware, defineRoute } from "./_common.ts";
import { create, getNumericDate, verify } from '../../deps/djwt.ts'
import { authenticateByEmail } from "../../db-access/users.ts";

const encoder = new TextEncoder()
const JWT_SECRET_KEY = await crypto.subtle.importKey(
    'raw',
    encoder.encode("JWT_SECRET_KEY"),
    { name: 'HMAC', hash: 'SHA-256' },
    true,
    ['sign', 'verify']
)

const header = {
    alg: "HS256",
    typ: "JWT",
} as const

export default function register(router: Router) {

    defineRoute<{ success: boolean, jwt: string | null }>(router, {
        endpoint: '/login',
        method: 'post',
        handler: async ctx => {
            const { email, password } = await ctx.request.body({ type: 'json' }).value as { email?: unknown, password?: unknown }

            if (typeof email === 'string' && typeof password === 'string') {
                const user = await authenticateByEmail({ email, password })

                if (user != null) {
                    const payload = {
                        iss: "vibecamp",
                        exp: getNumericDate(Date.now() + 30 * 60 * 60 * 1_000),
                        permission_level: user.permission_level
                    }
                    const jwt = await create(header, payload, JWT_SECRET_KEY)
                    return [{ success: true, jwt }, Status.OK]
                }
            }

            return [{ success: false, jwt: null }, Status.Unauthorized]
        }
    })
}

export async function getPermissionLevel(ctx: AnyRouterContext): Promise<PermissionLevel> {
    const header = ctx.request.headers.get('Authorization');
    const bearerPrefix = 'Bearer '
    if (header != null && header.startsWith(bearerPrefix)) {
        const token = header.substring(bearerPrefix.length)

        try {
            const result = await verify(token, JWT_SECRET_KEY);
            const foundPermissionLevel = result?.permission_level as PermissionLevel | undefined
            return foundPermissionLevel ?? 'public'
        } catch {
        }
    }

    return 'public'
}

export const requirePermissionLevel = (required: PermissionLevel): AnyRouterMiddleware => async (ctx: AnyRouterContext, next) => {
    const permissionLevel = await getPermissionLevel(ctx)

    // TODO: allow even higher permissions
    ctx.assert(permissionLevel === required, Status.Unauthorized)

    await next()
}

// export const validate = async ({request, cookies}, next) => {
//     const token = await cookies.get("token");
//     const result = await validateJwt(token, key, { isThrowing: false });
//     if(result) {
//         request.auth = true;
//         request.username = result.payload.username;
//     }
//     await next();
// }

// import { setExpiration } from "https://deno.land/x/djwt/create.ts"

// export const key = "your-secret"

// export const payload = {
//   exp: setExpiration(new Date().getTime() + 60000*60),
// }

// export const header = {
//   alg: "HS256",
//   typ: "JWT",
// }


// import { Application, Router } from "https://deno.land/x/oak/mod.ts";
// import { validateJwt } from "https://deno.land/x/djwt/validate.ts";
// import { makeJwt, setExpiration } from "https://deno.land/x/djwt/create.ts";

// const key = "some-secret-jey";

// const header = {
//   alg: "HS256",
//   typ: "JWT",
// };

// const payload = {
//   iss: "ted",
//   exp: setExpiration(new Date().getTime() + 60000),
// };

// const router = new Router();
// router
//   .get("/newJwt", (context) => {
//     let jwt = makeJwt({key, header, payload});
//     context.response.body = jwt;
//     context.cookies.set("token", jwt)
//   })
//   .get("/validate", async (context) => {
//     let token = context.cookies.get("token");
//     if (token) {
//       const result = await validateJwt(token, key, { isThrowing: false });
//       result ? context.response.body = "Valid Jwt" : context.response.body = "Invalid Jwt";
//       return;
//     }
//     context.response.body = "No token in cookies";
//   })

// const app = new Application();
// app.use(router.routes());
// app.use(router.allowedMethods());

// await app.listen({ port: 8000 });