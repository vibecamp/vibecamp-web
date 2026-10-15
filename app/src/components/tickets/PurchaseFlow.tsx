'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { type ReactNode, useEffect, useRef, useState } from 'react'
import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import { type Cart, contributionCents, type Product, type Quote } from '@/lib/cart'
import { vibefetch } from '@/lib/fetch'
import { buyTicketsPath, SUPPORT_EMAIL_HREF, TERMS_URL, TICKETS_PATH } from '@/lib/routes'
import { classNames, fillNodes } from '@/lib/ui'
import type { OrderStatus } from '@/server/purchase'
import Button from '../core/Button'
import Icon from '../core/Icon'
import InfoBlurb from '../core/InfoBlurb'
import InfoButton from '../core/InfoButton'
import Input from '../core/Input'
import { useMembersOnly } from '../LoginPrompt'
import PageLoading from '../PageLoading'
import CheckoutState from './CheckoutState'
import Stepper from './Stepper'

const money = (cents: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(cents / 100)

const price = (cents: number) => (cents === 0 ? t('purchase.free') : money(cents))

type SummaryRow = { key: string; label: string; cents: number; discount?: boolean }

type SavedCart = { cart: Cart; contribution: string; accepted: boolean }

const savedCartKey = (festivalId: string) => `vibecamp:cart:${festivalId}`

function readSavedCart(festivalId: string): SavedCart | null {
    try {
        const raw = sessionStorage.getItem(savedCartKey(festivalId))
        return raw ? (JSON.parse(raw) as SavedCart) : null
    } catch {
        return null
    }
}

function summaryRows(quote: Quote): SummaryRow[] {
    const lines = new Map<string, { description: string; count: number; cents: number }>()
    for (const unit of quote.units) {
        const key = `${unit.purchase_type_id}:${unit.gross_cents}`
        const line = lines.get(key) ?? { description: unit.name, count: 0, cents: 0 }
        line.count++
        line.cents += unit.gross_cents
        lines.set(key, line)
    }
    return [
        ...[...lines].map(([key, line]) => ({
            key,
            label: fill(t('purchase.priceLineItem').replaceAll(' ', '\u00a0'), {
                description: line.description,
                count: line.count,
            }),
            cents: line.cents,
        })),
        ...(quote.discount_cents > 0
            ? [
                  {
                      key: 'discount',
                      label: t('purchase.discountRow'),
                      cents: -quote.discount_cents,
                      discount: true,
                  },
              ]
            : []),
        ...(quote.contribution_cents > 0
            ? [
                  {
                      key: 'contribution',
                      label: t('purchase.donationRow'),
                      cents: quote.contribution_cents,
                  },
              ]
            : []),
    ]
}

export default function PurchaseFlow({
    festivalId,
    ticketId,
}: {
    festivalId: string
    ticketId?: string
}) {
    const store = useStore()
    const router = useRouter()
    const search = useSearchParams()
    const membersOnly = useMembersOnly()
    const catalog = store.catalog.state.result
    const owned = store.accountInfo.state.result?.owned_tickets ?? []
    const target = owned.find((p) => p.purchase_id === ticketId)
    const [saved] = useState(() => (ticketId ? null : readSavedCart(festivalId)))
    const [cart, setCart] = useState<Cart>(() =>
        saved
            ? saved.cart
            : ticketId
              ? {
                    kind: 'addons',
                    festival_id: festivalId,
                    ticket_id: ticketId,
                    addons: [],
                    contribution_cents: 0,
                }
              : {
                    kind: 'tickets',
                    festival_id: festivalId,
                    tickets: [],
                    discount_code: null,
                    contribution_cents: 0,
                },
    )
    const [contribution, setContribution] = useState(saved?.contribution ?? '')
    const [accepted, setAccepted] = useState(saved?.accepted ?? false)
    const [quote, setQuote] = useState<{ cart: Cart; value: Quote } | null>(null)
    const [quoting, setQuoting] = useState(false)
    const [error, setError] = useState<ReactNode>('')
    const [busy, setBusy] = useState(false)
    const [pending, setPending] = useState<OrderStatus | null>(null)
    const requestId = useRef(saved ? crypto.randomUUID() : '')
    const version = useRef(0)

    useEffect(() => {
        try {
            sessionStorage.removeItem(savedCartKey(festivalId))
        } catch {}
    }, [festivalId])

    const isEmpty =
        (cart.kind === 'tickets' ? cart.tickets.length === 0 : cart.addons.length === 0) &&
        cart.contribution_cents === 0

    useEffect(() => {
        const current = ++version.current
        if (isEmpty) {
            setQuote(null)
            setQuoting(false)
            setError('')
            return
        }
        setQuoting(true)
        const timer = setTimeout(async () => {
            try {
                const res = await vibefetch(store.jwt, '/purchase/quote', 'post', cart)
                if (version.current !== current) return
                if (res.status === 200 && res.body) {
                    setQuote({ cart, value: res.body })
                    setError('')
                } else setError(t('purchase.invalidSelection'))
            } catch {
                if (version.current === current) setError(t('common.failedToLoad'))
            } finally {
                if (version.current === current) setQuoting(false)
            }
        }, 200)
        return () => {
            clearTimeout(timer)
            version.current++
        }
    }, [cart, isEmpty, store.jwt])

    useEffect(() => {
        const id = search.get('order_id')
        if (id)
            setPending({
                order_id: id,
                status: 'pending',
                needs_attention: false,
                resume_url: null,
            })
    }, [search])

    const closed =
        !ticketId &&
        !search.get('order_id') &&
        catalog != null &&
        catalog.festival?.festival_id !== festivalId
    useEffect(() => {
        if (closed) router.replace(TICKETS_PATH)
    }, [closed, router])

    const change = (next: Cart) => {
        requestId.current = crypto.randomUUID()
        setCart(next)
    }
    const changeCount = (id: string, count: number) => {
        if (cart.kind !== 'tickets' || !Number.isInteger(count) || count < 0 || count > 100) return
        const tickets = [...cart.tickets]
        while (tickets.filter((t) => t.purchase_type_id === id).length > count)
            tickets.splice(
                tickets.findLastIndex((t) => t.purchase_type_id === id),
                1,
            )
        while (tickets.filter((t) => t.purchase_type_id === id).length < count)
            tickets.push({ key: crypto.randomUUID(), purchase_type_id: id, addons: [] })
        change({ ...cart, tickets })
    }
    const changeAddon = (key: string, id: string, quantity: number) => {
        if (!Number.isInteger(quantity) || quantity < 0 || quantity > 1000) return
        const update = (addons: { purchase_type_id: string; quantity: number }[]) => [
            ...addons.filter((a) => a.purchase_type_id !== id),
            ...(quantity ? [{ purchase_type_id: id, quantity }] : []),
        ]
        change(
            cart.kind === 'addons'
                ? { ...cart, addons: update(cart.addons) }
                : {
                      ...cart,
                      tickets: cart.tickets.map((ticket) =>
                          ticket.key === key
                              ? { ...ticket, addons: update(ticket.addons) }
                              : ticket,
                      ),
                  },
        )
    }

    const fresh = quote?.cart === cart ? quote.value : null
    const shown = isEmpty ? null : (quote?.value ?? null)
    const total = useTweenedNumber(shown?.total_cents ?? 0)

    async function checkout() {
        if (!fresh || !accepted || busy) return
        if (!store.loggedIn) {
            try {
                sessionStorage.setItem(
                    savedCartKey(festivalId),
                    JSON.stringify({ cart, contribution, accepted } satisfies SavedCart),
                )
            } catch {}
            membersOnly()
            return
        }
        setBusy(true)
        setError('')
        try {
            const res = await vibefetch(store.jwt, '/purchase/checkout-session', 'post', {
                cart,
                quote_hash: fresh.hash,
                request_id: requestId.current,
                accepted_terms: true,
            })
            if (res.status === 200 && res.body) {
                window.location.assign(res.body.url)
                return
            }
            const failure = res.body as unknown as { error?: string; detail?: unknown }
            if (failure?.error === 'quote_changed') {
                setQuote({ cart, value: failure.detail as Quote })
                setError(t('purchase.quoteChanged'))
            } else if (failure?.error === 'checkout_pending') {
                setPending(failure.detail as OrderStatus)
                setError(t('purchase.paymentPending'))
            } else
                setError(
                    failure?.error === 'needs_attention'
                        ? fillNodes(t('purchase.needsAttention'), {
                              supportEmailLink: (
                                  <a href={SUPPORT_EMAIL_HREF}>{t('login.supportEmailLinkText')}</a>
                              ),
                          })
                        : t('purchase.invalidSelection'),
                )
        } catch {
            setError(t('common.failedToLoad'))
        } finally {
            setBusy(false)
        }
    }

    if (!catalog || closed) return <PageLoading />
    if (catalog.festival?.festival_id !== festivalId || (ticketId && !target))
        return (
            <div className='page centered'>
                <p className='empty-state'>{t('purchase.noTickets')}</p>
            </div>
        )

    const products = catalog.products
        .filter((p) => p.available > 0 || p.sold_out)
        .sort(
            (a, b) =>
                a.sort_order - b.sort_order || a.purchase_type_id.localeCompare(b.purchase_type_id),
        )
    const productById = (id: string) => catalog.products.find((p) => p.purchase_type_id === id)
    const existing = ticketId ? owned.filter((a) => a.parent_purchase_id === ticketId) : []
    const bundles =
        cart.kind === 'tickets'
            ? cart.tickets
            : [
                  {
                      key: ticketId ?? '',
                      purchase_type_id: target?.purchase_type_id ?? '',
                      addons: cart.addons,
                  },
              ]
    const compatibleAddons = (ticketTypeId: string) =>
        products.filter(
            (p) =>
                !p.is_attendance_ticket &&
                catalog.compatibility.some(
                    (r) =>
                        r.ticket_type_id === ticketTypeId && r.addon_type_id === p.purchase_type_id,
                ),
        )
    if (cart.kind === 'addons' && target && compatibleAddons(target.purchase_type_id).length === 0)
        return (
            <div className='page centered'>
                <p className='empty-state'>{t('purchase.noTickets')}</p>
            </div>
        )
    const contributionInvalid = contributionCents(contribution) === null
    const locked = busy || pending !== null
    const canCheckout = fresh !== null && accepted && !locked && !contributionInvalid && !quoting

    return (
        <form
            className='page'
            onSubmit={(e) => {
                e.preventDefault()
                void checkout()
            }}
        >
            {pending && (
                <CheckoutState
                    orderId={pending.order_id}
                    cancelInitially={search.get('canceled') === '1'}
                    onResolved={(state) => {
                        if (state.status === 'fulfilled') {
                            router.replace(
                                `${TICKETS_PATH}/checkout/return?order_id=${state.order_id}`,
                            )
                        } else if (state.status === 'closed') {
                            setPending(null)
                            requestId.current = crypto.randomUUID()
                            setCart((current) => ({ ...current }))
                            router.replace(
                                ticketId
                                    ? `${TICKETS_PATH}/owned/${ticketId}/addons`
                                    : buyTicketsPath(festivalId),
                            )
                        }
                    }}
                />
            )}

            <div className='purchase-layout'>
                <fieldset className='purchase-main' disabled={locked}>
                    {target && (
                        <div className='list'>
                            <div className='list-row'>
                                <span className='row-text'>
                                    <span className='title'>{target.name}</span>
                                    {target.details && (
                                        <span className='subtitle'>{target.details}</span>
                                    )}
                                </span>
                            </div>
                        </div>
                    )}

                    {cart.kind === 'tickets' && (
                        <section>
                            <div className='section-heading'>
                                <h2>{catalog.festival.festival_name}</h2>
                            </div>
                            <div className='product-list'>
                                {products
                                    .filter((p) => p.is_attendance_ticket)
                                    .map((p) => (
                                        <ProductRow
                                            product={p}
                                            soldOut={p.sold_out}
                                            key={p.purchase_type_id}
                                        >
                                            <Stepper
                                                value={
                                                    cart.tickets.filter(
                                                        (ticket) =>
                                                            ticket.purchase_type_id ===
                                                            p.purchase_type_id,
                                                    ).length
                                                }
                                                max={Math.min(100, p.available)}
                                                onChange={(n) => changeCount(p.purchase_type_id, n)}
                                            />
                                        </ProductRow>
                                    ))}
                            </div>
                        </section>
                    )}

                    {bundles.map((ticket) => {
                        const addons = compatibleAddons(ticket.purchase_type_id)
                        const ticketProduct = productById(ticket.purchase_type_id)
                        const combined = new Set([
                            ...ticket.addons.map((a) => a.purchase_type_id),
                            ...existing.map((a) => a.purchase_type_id),
                        ])
                        return (
                            <section className='bundle' key={ticket.key}>
                                <header className='bundle-header'>
                                    <h3>
                                        {cart.kind === 'addons'
                                            ? t('tickets.addonsHeading')
                                            : ticketProduct?.description}
                                    </h3>
                                </header>
                                <div className='product-list nested'>
                                    {cart.kind === 'tickets' && ticketProduct && (
                                        <ProductRow product={ticketProduct} />
                                    )}
                                    {addons.map((p) => {
                                        const selected =
                                            ticket.addons.find(
                                                (a) => a.purchase_type_id === p.purchase_type_id,
                                            )?.quantity ?? 0
                                        const existingCount = existing.filter(
                                            (a) => a.purchase_type_id === p.purchase_type_id,
                                        ).length
                                        const conflict = catalog.exclusions.some(
                                            (r) =>
                                                (r.addon_a === p.purchase_type_id &&
                                                    combined.has(r.addon_b)) ||
                                                (r.addon_b === p.purchase_type_id &&
                                                    combined.has(r.addon_a)),
                                        )
                                        const cap = Math.min(
                                            p.available,
                                            p.max_per_ticket === null
                                                ? 1000
                                                : p.max_per_ticket - existingCount,
                                        )
                                        const disabled = conflict || cap <= 0
                                        return (
                                            <ProductRow
                                                product={p}
                                                soldOut={p.sold_out}
                                                key={p.purchase_type_id}
                                            >
                                                {p.max_per_ticket === 1 ? (
                                                    <input
                                                        className='toggle'
                                                        type='checkbox'
                                                        checked={selected > 0}
                                                        disabled={disabled}
                                                        onChange={(e) =>
                                                            changeAddon(
                                                                ticket.key,
                                                                p.purchase_type_id,
                                                                Number(e.target.checked),
                                                            )
                                                        }
                                                    />
                                                ) : (
                                                    <Stepper
                                                        value={selected}
                                                        max={Math.max(0, cap)}
                                                        disabled={disabled}
                                                        onChange={(n) =>
                                                            changeAddon(
                                                                ticket.key,
                                                                p.purchase_type_id,
                                                                n,
                                                            )
                                                        }
                                                    />
                                                )}
                                            </ProductRow>
                                        )
                                    })}
                                </div>
                            </section>
                        )
                    })}

                    <div className='stack'>
                        {cart.kind === 'tickets' && (
                            <Input
                                label={t('purchase.discountCodeLabel')}
                                value={cart.discount_code ?? ''}
                                autoComplete='off'
                                onChange={(value) =>
                                    change({ ...cart, discount_code: value || null })
                                }
                            />
                        )}
                        <div className='contribution-field'>
                            <Input
                                label={t('purchase.contributionLabel')}
                                value={contribution}
                                inputMode='decimal'
                                placeholder='0.00'
                                error={contributionInvalid && t('purchase.invalidSelection')}
                                onChange={(value) => {
                                    setContribution(value)
                                    const cents = contributionCents(value)
                                    if (cents !== null && cents !== cart.contribution_cents)
                                        change({ ...cart, contribution_cents: cents })
                                }}
                            />
                            <InfoBlurb>{t('purchase.contributionBlurb')}</InfoBlurb>
                        </div>
                    </div>
                </fieldset>

                <aside className='purchase-aside'>
                    <div
                        className={classNames(
                            'checkout-summary',
                            shown !== null && shown !== fresh && 'stale',
                        )}
                    >
                        <div className='summary-lines'>
                            {shown &&
                                summaryRows(shown).map((row) => (
                                    <div className='summary-row' key={row.key}>
                                        <div
                                            className={classNames(
                                                'price-line',
                                                row.discount && 'discount',
                                            )}
                                        >
                                            <span className='label'>{row.label}</span>
                                            <span className='amount'>{price(row.cents)}</span>
                                        </div>
                                    </div>
                                ))}
                        </div>
                        <div className='summary-total'>
                            <span>{t('purchase.totalRow')}</span>
                            <span className='amount'>{money(Math.round(total))}</span>
                        </div>
                        <label className='terms'>
                            <input
                                className='toggle'
                                type='checkbox'
                                checked={accepted}
                                disabled={locked}
                                onChange={(e) => setAccepted(e.target.checked)}
                            />
                            <span>
                                {fillNodes(t('purchase.acceptTerms'), {
                                    termsLink: (
                                        <a href={TERMS_URL} target='_blank' rel='noreferrer'>
                                            {t('purchase.termsLinkText')}
                                        </a>
                                    ),
                                })}
                            </span>
                        </label>
                        {error && (
                            <div className='notice danger'>
                                <Icon name='error' />
                                <span>{error}</span>
                            </div>
                        )}
                        <Button
                            isSubmit
                            isPrimary
                            isLoading={busy}
                            disabled={!canCheckout}
                            className='block'
                        >
                            {t('purchase.proceedToCheckout')}
                        </Button>
                        <p className='reassurance'>{t('purchase.noChargeYet')}</p>
                    </div>
                </aside>
            </div>
        </form>
    )
}

function ProductRow({
    product,
    soldOut = false,
    children,
}: {
    product: Product
    soldOut?: boolean
    children?: React.ReactNode
}) {
    const words = product.description.split(' ')
    const last = words.pop()
    return (
        <div className={classNames('product-row', soldOut && 'sold-out')}>
            <div className='product-info'>
                <div className='product-name'>
                    {words.length > 0 && `${words.join(' ')} `}
                    <span>
                        {last}
                        <InfoButton
                            name={product.description}
                            info={product.additional_info}
                            disabled={soldOut}
                        />
                    </span>
                </div>
                <div className='product-price'>
                    {price(product.price_in_cents)}
                    {product.remaining !== null && !soldOut && !product.is_attendance_ticket && (
                        <span className='remaining'>
                            {fill(t('purchase.remaining'), { count: product.remaining })}
                        </span>
                    )}
                </div>
                {product.details && (
                    <div className='product-details preserve-lines'>{product.details}</div>
                )}
            </div>
            {children && <div className='product-control'>{children}</div>}
            {soldOut && <div className='sold-out-label'>{t('purchase.soldOut')}</div>}
        </div>
    )
}

function useTweenedNumber(target: number, ms = 350) {
    const [value, setValue] = useState(target)
    const current = useRef(target)
    useEffect(() => {
        const from = current.current
        if (from === target || matchMedia('(prefers-reduced-motion: reduce)').matches) {
            current.current = target
            setValue(target)
            return
        }
        const start = performance.now()
        let frame = requestAnimationFrame(function step(now) {
            const progress = Math.min(1, (now - start) / ms)
            current.current = from + (target - from) * (1 - (1 - progress) ** 3)
            setValue(current.current)
            if (progress < 1) frame = requestAnimationFrame(step)
        })
        return () => cancelAnimationFrame(frame)
    }, [target, ms])
    return value
}
