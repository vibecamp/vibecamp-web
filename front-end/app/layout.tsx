import '../src/index.scss'

import React from 'react'

export const metadata = {
    title: 'My Vibecamp',
    description: 'Let\'s vibe, y\'all',
    openGraph: {
        type: 'website',
        images: ['/vibecamp-squircle.png'],
    },
    icons: {
        icon: '/vibecamp-squircle.png',
    },
    manifest: '/manifest.json',
}

export const viewport = {
    width: 'device-width',
    initialScale: 1,
    themeColor: '#fffae5',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en">
            <body>
                <div id="root">
                    {children}
                </div>
            </body>
        </html>
    )
}
