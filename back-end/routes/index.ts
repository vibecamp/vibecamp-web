
import { Router } from "../deps/oak.ts";
import v1_pages from "./v1/pages.ts";

export const router = new Router()

// Every routes file in this directory should have its register function
// imported and then called here!
v1_pages(router)

router.get('/', ctx => {
    ctx.response.body = 'OK'
})