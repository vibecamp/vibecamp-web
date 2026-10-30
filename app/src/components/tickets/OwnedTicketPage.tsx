'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import { TICKETS_PATH } from '@/lib/routes'
import type { OwnedTicket } from '@/server/tickets'
import Icon from '../core/Icon'
import InfoButton from '../core/InfoButton'
import { usePageHeader } from '../PageHeader'
import PageLoading from '../PageLoading'
import PurchaseFlow from './PurchaseFlow'
import Ticket3D from './Ticket3D'

export default function OwnedTicketPage({ view = 'detail' }: { view?: 'detail' | 'addons' }) {
    const { ticketId } = useParams<{ ticketId: string }>()
    const store = useStore()
    const owned = store.accountInfo.state.result?.owned_tickets
    const ticket = owned?.find((p) => p.purchase_id === ticketId && p.is_attendance_ticket)

    usePageHeader(view === 'detail' ? { title: ticket?.name ?? '' } : null)

    if (!owned && store.accountInfo.state.kind !== 'error') return <PageLoading />
    if (!ticket) return <PageLoading error />

    const addons = owned?.filter((p) => p.parent_purchase_id === ticketId) ?? []
    const catalog = store.catalog.state.result
    const canBuyAddons =
        catalog?.festival?.festival_id === ticket.festival_id &&
        catalog.compatibility.some(
            (r) =>
                r.ticket_type_id === ticket.purchase_type_id &&
                catalog.products.some(
                    (p) =>
                        p.purchase_type_id === r.addon_type_id &&
                        p.sale_enabled &&
                        !p.hidden_from_ui &&
                        p.available > 0,
                ),
        )

    if (view === 'addons')
        return <PurchaseFlow festivalId={ticket.festival_id} ticketId={ticketId} />

    return (
        <div className='page'>
            <Ticket3D key={ticket.purchase_id} ticket={ticket} />

            {ticket.details && <p className='preserve-lines muted'>{ticket.details}</p>}

            {canBuyAddons && (
                <div className='list'>
                    <Link className='list-row' href={`${TICKETS_PATH}/owned/${ticketId}/addons`}>
                        <Icon name='add_shopping_cart' />
                        <span className='row-text'>
                            <span className='title'>{t('tickets.purchaseAddons')}</span>
                        </span>
                        <Icon name='chevron_right' />
                    </Link>
                </div>
            )}

            {addons.length > 0 && (
                <section>
                    <div className='section-heading'>
                        <h2>{t('tickets.addonsHeading')}</h2>
                    </div>
                    <ul className='list'>
                        {groupAddons(addons).map((group) => (
                            <li className='list-row' key={group.purchase_type_id}>
                                <Icon name='shopping_bag' />
                                <span className='row-text'>
                                    <span className='title'>
                                        {group.count > 1
                                            ? fill(t('email.receipt.purchaseRow'), {
                                                  description: group.name,
                                                  count: group.count,
                                              })
                                            : group.name}
                                        <InfoButton
                                            name={group.name}
                                            info={group.additional_info}
                                        />
                                    </span>
                                </span>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
        </div>
    )
}

function groupAddons(addons: readonly OwnedTicket[]) {
    const groups = new Map<
        string,
        { purchase_type_id: string; name: string; additional_info: string | null; count: number }
    >()
    for (const addon of addons) {
        const group = groups.get(addon.purchase_type_id)
        if (group) group.count++
        else
            groups.set(addon.purchase_type_id, {
                purchase_type_id: addon.purchase_type_id,
                name: addon.name,
                additional_info: addon.additional_info,
                count: 1,
            })
    }
    return [...groups.values()]
}
