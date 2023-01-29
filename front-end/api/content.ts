import { Page } from '../../common/data/pages'
import { BACK_END_ORIGIN } from '../public-runtime-config'
import { vibeFetch } from './_common'

export async function getPublicPages(): Promise<readonly Page[]> {
    return vibeFetch<readonly Page[]>(BACK_END_ORIGIN + '/api/v1/pages')
}

export async function savePage(page: Page): Promise<void> {
    await vibeFetch(BACK_END_ORIGIN + '/api/v1/page', {
        method: 'POST',
        body: JSON.stringify(page)
    })
}

export async function publishChanges(): Promise<void> {
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