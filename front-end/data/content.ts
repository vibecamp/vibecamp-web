import { Page } from '../../common/data/pages'
import { BACK_END_ORIGIN } from '../public-runtime-config'

export async function getPublicPages(): Promise<readonly Page[]> {
    return fetch(BACK_END_ORIGIN + '/api/v1/pages').then(res => res.json()) as any as readonly Page[]
}

export async function savePage(page: Page): Promise<void> {
    await fetch(BACK_END_ORIGIN + '/api/v1/page', {
        method: 'POST',
        body: JSON.stringify(page)
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
    ]
}