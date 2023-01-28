import { getAllPages } from "../../db-access/pages.ts";
import { Router } from "../../deps/oak.ts";
import { API_BASE } from "./constants.ts";

export default function register(router: Router) {

    router.get(API_BASE + '/pages', async (ctx) => {
        const pages = await getAllPages()
        ctx.response.body = JSON.stringify(pages)
    })
}