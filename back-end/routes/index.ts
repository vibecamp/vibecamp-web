
import { Router } from "../deps/oak.ts";

import v1_auth from "./v1/auth.ts";
import v1_content from "./v1/content.ts";

export const router = new Router()

// Every routes file in this directory should have its register function
// imported and then called here!
v1_auth(router)
v1_content(router)

router.get('/', ctx => {
    ctx.response.body = 'OK'
})