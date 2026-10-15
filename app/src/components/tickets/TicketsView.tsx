'use client'

import Link from 'next/link'
import { useEffect } from 'react'
import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import { formatDateRange } from '@/lib/dates'
import { buyTicketsPath, TICKETS_PATH } from '@/lib/routes'
import type { OwnedTicket } from '@/server/tickets'
import ButtonLink from '../core/ButtonLink'
import Icon from '../core/Icon'
import PageLoading from '../PageLoading'

type FestivalGroup = {
    id: string
    name: string
    start: string
    end: string
    tickets: OwnedTicket[]
    unattached: OwnedTicket[]
}

function groupByFestival(owned: readonly OwnedTicket[]): FestivalGroup[] {
    const groups = new Map<string, FestivalGroup>()
    for (const purchase of owned) {
        if (groups.has(purchase.festival_id)) continue
        const inFestival = owned.filter((p) => p.festival_id === purchase.festival_id)
        groups.set(purchase.festival_id, {
            id: purchase.festival_id,
            name: purchase.festival_name,
            start: purchase.start_date,
            end: purchase.end_date,
            tickets: inFestival.filter((p) => p.is_attendance_ticket),
            unattached: inFestival.filter((p) => !p.is_attendance_ticket && !p.parent_purchase_id),
        })
    }
    return [...groups.values()].sort((a, b) => b.end.localeCompare(a.end))
}

export default function TicketsView() {
    const store = useStore()
    const owned = store.loggedIn ? store.accountInfo.state.result?.owned_tickets : []
    const catalog = store.catalog.state.result
    const attendance = owned?.filter((p) => p.is_attendance_ticket) ?? []
    const only = attendance.length === 1 ? attendance[0] : null
    const holder = store.accountInfo.state.result?.primary_attendee?.name || null

    useEffect(() => {
        if (!only) return
        // let the list's entrance animation finish first
        const timer = setTimeout(() => {
            import('./ticket-scene')
                .then((m) => m.prepareTicket({ ...only, holder }))
                .catch(() => {})
        }, 500)
        return () => clearTimeout(timer)
    }, [only, holder])

    if (!owned) return <PageLoading error={store.accountInfo.state.kind === 'error'} />

    const groups = groupByFestival(owned)

    const purchasable = catalog?.festival ?? null
    const hasTickets = groups.some((g) => g.tickets.length > 0)

    return (
        <div className='page'>
            {purchasable && (
                <ButtonLink
                    href={buyTicketsPath(purchasable.festival_id)}
                    isPrimary
                    className='block'
                >
                    <Icon name='add_shopping_cart' />
                    {hasTickets ? t('tickets.buyMore') : t('tickets.buyTickets')}
                </ButtonLink>
            )}

            {groups.length === 0 && (
                <p className='empty-state'>
                    {t(purchasable ? 'tickets.noTicketsYet' : 'tickets.checkBackSoon')}
                </p>
            )}

            {groups.map((group) => (
                <section className='festival-section' key={group.id}>
                    <div className='section-heading'>
                        <h2>{group.name}</h2>
                        <span className='festival-dates'>
                            {formatDateRange(group.start, group.end)}
                        </span>
                    </div>
                    {group.tickets.length > 0 && (
                        <div className='list separated'>
                            {group.tickets.map((ticket) => (
                                <Link
                                    className='list-row'
                                    href={`${TICKETS_PATH}/owned/${ticket.purchase_id}`}
                                    prefetch
                                    key={ticket.purchase_id}
                                >
                                    <span className='row-text'>
                                        <span className='title'>{ticket.name}</span>
                                        {ticket.details && (
                                            <span className='subtitle'>{ticket.details}</span>
                                        )}
                                    </span>
                                    <Icon name='chevron_right' />
                                </Link>
                            ))}
                        </div>
                    )}
                    {group.unattached.length > 0 && (
                        <>
                            <h3 className='muted small'>{t('tickets.otherPurchasesHeading')}</h3>
                            <ul className='list separated'>
                                {group.unattached.map((p) => (
                                    <li className='list-row' key={p.purchase_id}>
                                        <span className='row-text'>
                                            <span className='title'>{p.name}</span>
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </section>
            ))}
        </div>
    )
}
