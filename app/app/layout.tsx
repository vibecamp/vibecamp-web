import '../src/styles/index.scss'

import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import HashRedirect from '@/components/HashRedirect'
import { t } from '@/copy/t'
import { env } from '@/env'
import { StoreProvider } from '@/hooks/useStore'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
    metadataBase: new URL(env.APP_BASE_URL),
    title: t('app.title'),
    description: t('app.description'),
    openGraph: {
        type: 'website',
        images: ['/vibecamp-squircle.png'],
    },
    icons: {
        icon: '/vibecamp-squircle.png',
    },
    manifest: '/manifest.json',
}

export const viewport: Viewport = {
    width: 'device-width',
    initialScale: 1,
    viewportFit: 'cover',
    themeColor: '#fffae5',
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang='en'>
            <body>
                <div id='root'>
                    <StoreProvider>
                        <HashRedirect />
                        {children}
                    </StoreProvider>
                </div>
            </body>
        </html>
    )
}
