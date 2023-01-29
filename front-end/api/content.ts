import { NavLink, Page } from '../../common/data'
import { BACK_END_ORIGIN } from '../public-runtime-config'
import { vibeFetch } from './_common'

export async function getPages(): Promise<readonly Page[]> {
    return vibeFetch<readonly Page[]>(BACK_END_ORIGIN + '/api/v1/pages')
}

export async function updatePage(page: Page): Promise<void> {
    await vibeFetch(BACK_END_ORIGIN + '/api/v1/page', {
        method: 'POST',
        body: JSON.stringify(page)
    })
}

export async function getNavLinks(): Promise<readonly NavLink[]> {
    return vibeFetch<readonly NavLink[]>(BACK_END_ORIGIN + '/api/v1/nav-links')
}

export async function updateNavLinks(navLinks: readonly NavLink[]): Promise<void> {
    await vibeFetch(BACK_END_ORIGIN + '/api/v1/nav-links', {
        method: 'POST',
        body: JSON.stringify(navLinks)
    })
}

export async function deployStaticSite(): Promise<void> {
    await vibeFetch(BACK_END_ORIGIN + '/api/v1/deploy-static-site', {
        method: 'POST'
    })
}
