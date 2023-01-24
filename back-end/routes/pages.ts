import { API_V1 } from "../constants.ts";
import { getAllPages } from "../db-access/pages.ts";
import { Router } from "../deps/oak.ts";

export default function register(router: Router) {

    router.get(API_V1 + '/pages', async (ctx) => {
        const pages = await getAllPages()
        ctx.response.body = JSON.stringify(pages)
    })
}