'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import ButtonLink from '@/components/core/ButtonLink'
import Stripes from '@/components/core/Stripes'
import PageLoading from '@/components/PageLoading'
import { t } from '@/copy/t'
import useNextPath from '@/hooks/useNextPath'
import { useStore } from '@/hooks/useStore'
import { hashToPath } from '@/lib/hash-redirect'
import { DEFAULT_PATH, loginPath } from '@/lib/routes'

export default function RootPage() {
    const store = useStore()
    const router = useRouter()
    const next = useNextPath()
    const [showLanding, setShowLanding] = useState(false)

    useEffect(() => {
        if (!store.ready) {
            return
        }
        const legacy = hashToPath(window.location.hash)
        if (legacy != null) {
            router.replace(legacy)
        } else if (store.loggedIn) {
            router.replace(next)
        } else {
            setShowLanding(true)
        }
    }, [next, router, store.loggedIn, store.ready])

    if (!showLanding) {
        return <PageLoading />
    }

    return (
        <main className='page-scroll'>
            <Stripes position='top-left' />
            <div className='page centered'>
                <div className='auth-card'>
                    {/* biome-ignore lint/performance/noImgElement: the logo is sized by CSS, no layout shift to optimise */}
                    <img src='/vibecamp.png' className='logo' alt={t('login.logoAlt')} />
                    <ButtonLink href={loginPath(next)} isPrimary>
                        {t('login.submit')}
                    </ButtonLink>
                    <ButtonLink href={DEFAULT_PATH}>{t('landing.viewAsGuest')}</ButtonLink>
                </div>
            </div>
        </main>
    )
}
