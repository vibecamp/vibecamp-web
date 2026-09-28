'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import { vibefetch } from '@/lib/fetch'
import { SUPPORT_EMAIL_HREF } from '@/lib/routes'
import { fillNodes } from '@/lib/ui'
import type { OrderStatus } from '@/server/purchase'
import Button from '../core/Button'
import ButtonLink from '../core/ButtonLink'
import Icon from '../core/Icon'
import LoadingDots from '../core/LoadingDots'

export default function CheckoutState({
    orderId,
    cancelInitially = false,
    onResolved,
}: {
    orderId: string
    cancelInitially?: boolean
    onResolved: (state: OrderStatus) => void
}) {
    const { jwt } = useStore()
    const [state, setState] = useState<OrderStatus | null>(null)
    const [polling, setPolling] = useState(true)
    const [retry, setRetry] = useState(0)
    const callback = useRef(onResolved)
    callback.current = onResolved

    const check = useCallback(
        async (cancel: boolean) => {
            const res = await vibefetch(jwt, '/purchase/checkout-session/status', 'post', {
                order_id: orderId,
                ...(cancel ? { cancel: true as const } : {}),
            })
            if (res.status === 200 && res.body) {
                setState(res.body)
                if (res.body.status !== 'pending') callback.current(res.body)
                return res.body
            }
            return null
        },
        [jwt, orderId],
    )

    // biome-ignore lint/correctness/useExhaustiveDependencies: retry restarts polling
    useEffect(() => {
        let stopped = false
        let timer: ReturnType<typeof setTimeout>
        const start = Date.now()
        setPolling(true)
        async function poll(first: boolean) {
            try {
                const next = await check(first && cancelInitially)
                if (
                    stopped ||
                    (next?.status !== 'pending' && next !== null) ||
                    next?.needs_attention
                ) {
                    setPolling(false)
                    return
                }
            } catch {}
            if (!stopped && Date.now() - start < 60000)
                timer = setTimeout(() => void poll(false), 2000)
            else setPolling(false)
        }
        void poll(true)
        return () => {
            stopped = true
            clearTimeout(timer)
        }
    }, [check, cancelInitially, retry])

    const attention = Boolean(state?.needs_attention)

    return (
        <section className={attention ? 'status-card attention' : 'status-card'}>
            <div className='status-row'>
                {attention ? (
                    <Icon name='error' fill={1} />
                ) : polling ? (
                    <LoadingDots size={28} color='var(--color-accent-1)' />
                ) : (
                    <Icon name='hourglass_top' />
                )}
                <p>
                    {attention
                        ? fillNodes(t('purchase.needsAttention'), {
                              supportEmailLink: (
                                  <a href={SUPPORT_EMAIL_HREF}>{t('login.supportEmailLinkText')}</a>
                              ),
                          })
                        : t('purchase.paymentPending')}
                </p>
            </div>
            {!attention && (
                <div className='status-actions'>
                    {state?.resume_url ? (
                        <ButtonLink href={state.resume_url} isPrimary>
                            {t('purchase.resumeOrder')}
                        </ButtonLink>
                    ) : (
                        <Button isPrimary disabled={polling} onClick={() => setRetry((n) => n + 1)}>
                            {t('purchase.resumeOrder')}
                        </Button>
                    )}
                    {state?.status === 'pending' && (
                        <Button
                            onClick={() => {
                                void check(true).catch(() => setRetry((n) => n + 1))
                            }}
                        >
                            {t('common.cancel')}
                        </Button>
                    )}
                </div>
            )}
        </section>
    )
}
