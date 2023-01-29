import { NavLink, Page } from '../../common/data/pages'
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

export async function updateNavLink(navLink: NavLink): Promise<void> {
    await vibeFetch(BACK_END_ORIGIN + '/api/v1/nav-link', {
        method: 'POST',
        body: JSON.stringify(navLink)
    })
}

export async function deployStaticSite(): Promise<void> {
    await vibeFetch(BACK_END_ORIGIN + '/api/v1/deploy-static-site', {
        method: 'POST'
    })
}

export type LinkInfo = {
    label: string,
    href: string,
    // nav_order: number | null
}

export async function getPublicLinks(): Promise<readonly LinkInfo[]> {
    return [
        {
            label: 'Home',
            href: '/'
        },
        {
            label: 'Community Values',
            href: '/communityvalues'
        },
        {
            label: 'FAQ',
            href: '/faq'
        },
        {
            label: 'Team',
            href: '/team'
        },
        {
            label: 'Shop',
            href: 'https://shop.vibecamp.xyz/collections/all'
        },
        {
            label: 'Donate',
            href: '/donate'
        },
        {
            label: 'Vibefund',
            href: '/vibefund'
        },
        {
            label: 'Login',
            href: '/login'
        }
    ]
}