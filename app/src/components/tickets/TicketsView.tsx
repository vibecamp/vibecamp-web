'use client'

import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import { buyTicketsPath } from '@/lib/routes'
import type { OwnedTicket } from '@/server/tickets'
import ButtonLink from '../core/ButtonLink'
import Icon from '../core/Icon'
import PageLoading from '../PageLoading'
import TicketCard from './TicketCard'

type FestivalGroup = {
    id: string
    name: string
    end: string
    tickets: OwnedTicket[]
    unattached: OwnedTicket[]
}

function groupByFestival(owned: readonly OwnedTicket[]): FestivalGroup[] {
    const groups = new Map<string, FestivalGroup>()
    for (const purchase of owned) {
        let group = groups.get(purchase.festival_id)
        if (!group) {
            const inFestival = owned.filter((p) => p.festival_id === purchase.festival_id)
            group = {
                id: purchase.festival_id,
                name: purchase.festival_name,
                end: purchase.end_date,
                tickets: inFestival.filter((p) => p.is_attendance_ticket),
                unattached: inFestival.filter(
                    (p) => !p.is_attendance_ticket && !p.parent_purchase_id,
                ),
            }
            groups.set(purchase.festival_id, group)
        }
    }
    return [...groups.values()].sort((a, b) => b.end.localeCompare(a.end))
}

export default function TicketsView() {
    const store = useStore()
    const owned = store.accountInfo.state.result?.owned_tickets
    const catalog = store.catalog.state.result

    if (!owned) return <PageLoading error={store.accountInfo.state.kind === 'error'} />

    const groups = groupByFestival(owned)

    const purchasable =
        catalog?.festival &&
        catalog.products.some(
            (p) => p.is_attendance_ticket && p.sale_enabled && !p.hidden_from_ui && p.available > 0,
        )
            ? catalog.festival
            : null
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
                    </div>
                    <div className='ticket-list'>
                        {group.tickets.map((ticket) => (
                            <TicketCard
                                ticket={ticket}
                                href={`/tickets/owned/${ticket.purchase_id}`}
                                key={ticket.purchase_id}
                            />
                        ))}
                    </div>
                    {group.unattached.length > 0 && (
                        <div>
                            <h3 className='muted small'>{t('tickets.otherPurchasesHeading')}</h3>
                            <ul className='plain-list'>
                                {group.unattached.map((p) => (
                                    <li key={p.purchase_id}>
                                        <Icon name='shopping_bag' />
                                        <span className='label'>{p.name}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </section>
            ))}
        </div>
    )
}
