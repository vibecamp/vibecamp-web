import { Page, NavLink } from "https://raw.githubusercontent.com/vibecamp/vibecamp-web/main/common/data.ts";
import { getNavLinks, updateNavLink } from "../../db-access/nav-links.ts";
import { getPages, updatePage } from "../../db-access/pages.ts";
import { Router, Status } from "../../deps/oak.ts";
import { PUBLIC_PERMISSIONS } from "./auth.ts";
import { defineRoute } from "./_common.ts";

export default function register(router: Router) {

    defineRoute<readonly Page[]>(router, {
        endpoint: '/pages',
        method: 'get',
        requiredPermissions: PUBLIC_PERMISSIONS,
        handler: async () => {
            const pages = await getPages()
            return [pages, Status.OK]
        }
    })

    defineRoute<readonly NavLink[]>(router, {
        endpoint: '/nav-links',
        method: 'get',
        requiredPermissions: PUBLIC_PERMISSIONS,
        handler: async () => {
            const navLinks = await getNavLinks()
            return [navLinks, Status.OK]
        }
    })

    defineRoute<{ success: boolean }>(router, {
        endpoint: '/page',
        method: 'post',
        requiredPermissions: { is_content_admin: true, is_account_admin: false },
        handler: async (ctx) => {
            const newPage = await ctx.request.body({ type: 'json' }).value as Page
            await updatePage(newPage)
            return [{ success: true }, Status.OK]
        }
    })

    defineRoute<{ success: boolean }>(router, {
        endpoint: '/nav-links',
        method: 'post',
        requiredPermissions: { is_content_admin: true, is_account_admin: false },
        handler: async (ctx) => {
            const newNavLink = await ctx.request.body({ type: 'json' }).value as NavLink[]
            await updateNavLink(newNavLink)
            return [{ success: true }, Status.OK]
        }
    })

    defineRoute<{ success: boolean }>(router, {
        endpoint: '/deploy-static-site',
        method: 'post',
        requiredPermissions: { is_content_admin: true, is_account_admin: false },
        handler: async () => {
            if (FRONT_END_DEPLOY_HOOK == null) {
                throw Error('FRONT_END_DEPLOY_HOOK not defined')
            } else {
                await fetch(FRONT_END_DEPLOY_HOOK)
                return [{ success: true }, Status.OK]
            }
        }
    })
}

const FRONT_END_DEPLOY_HOOK = Deno.env.get('FRONT_END_DEPLOY_HOOK')