'use client'

import type { FormEvent, ReactNode } from 'react'
import { t } from '@/copy/t'
import { SUPPORT_EMAIL_HREF } from '@/lib/routes'
import { fillNodes } from '@/lib/ui'
import Button from '../core/Button'
import ErrorMessage from '../core/ErrorMessage'
import Stripes from '../core/Stripes'

type Props = {
    onSubmit: (e?: FormEvent<HTMLFormElement>) => void
    submitting: boolean
    submitDisabled?: boolean
    submitLabel: string
    error: string | undefined
    notice?: string
    links?: ReactNode
    children: ReactNode
}

export default function AuthForm({
    onSubmit,
    submitting,
    submitDisabled,
    submitLabel,
    error,
    notice,
    links,
    children,
}: Props) {
    return (
        <div className='page centered'>
            <Stripes position='top-left' />
            <form className='auth-card' onSubmit={onSubmit} noValidate>
                {/* biome-ignore lint/performance/noImgElement: the logo is sized by CSS, no layout shift to optimise */}
                <img src='/vibecamp.png' className='logo' alt={t('login.logoAlt')} />

                <div className='stack'>{children}</div>

                <ErrorMessage error={error} />

                {notice != null && <p className='auth-notice'>{notice}</p>}

                <Button isSubmit isPrimary isLoading={submitting} disabled={submitDisabled}>
                    {submitLabel}
                </Button>

                {links && <div className='auth-links'>{links}</div>}

                <div className='auth-footnote'>
                    {fillNodes(t('login.troubleLoggingIn'), {
                        supportEmailLink: (
                            <a href={SUPPORT_EMAIL_HREF}>{t('login.supportEmailLinkText')}</a>
                        ),
                    })}
                </div>
            </form>
        </div>
    )
}
