'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import { useStore } from '@/hooks/useStore'
import { TICKETS_PATH } from '@/lib/routes'
import type { OwnedTicket } from '@/server/tickets'
import Icon from '../core/Icon'
import { usePageHeader } from '../PageHeader'
import PageLoading from '../PageLoading'
import AdditionalInfo from './AdditionalInfo'
import BadgeInfoForm from './BadgeInfoForm'
import PurchaseFlow from './PurchaseFlow'
import TicketCard, { badgeMissing } from './TicketCard'

export default function OwnedTicketPage({
    view = 'detail',
}: {
    view?: 'detail' | 'badge' | 'addons'
}) {
    const { ticketId } = useParams<{ ticketId: string }>()
    const store = useStore()
    const owned = store.accountInfo.state.result?.owned_tickets
    const ticket = owned?.find((p) => p.purchase_id === ticketId && p.is_attendance_ticket)

    usePageHeader(view === 'detail' && ticket ? { title: ticket.name, back: TICKETS_PATH } : null)

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

    if (view === 'badge') return <BadgeInfoForm key={ticketId} ticket_id={ticketId} />
    if (view === 'addons')
        return <PurchaseFlow festivalId={ticket.festival_id} ticketId={ticketId} />

    const badge = ticket.badge

    return (
        <div className='page'>
            <TicketCard ticket={ticket} large />

            {ticket.details && <p className='preserve-lines muted'>{ticket.details}</p>}

            {badgeMissing(ticket) && (
                <Link href={`${TICKETS_PATH}/owned/${ticketId}/badge`} className='notice warning'>
                    <Icon name='badge' />
                    <span>{t('tickets.badgeMissing')}</span>
                    <Icon name='chevron_right' />
                </Link>
            )}

            {
                <div className='action-list'>
                    <Link href={`${TICKETS_PATH}/owned/${ticketId}/badge`}>
                        <Icon name='badge' />
                        <span className='label'>{t('account.badgeInfoHeading')}</span>
                        <Icon name='chevron_right' />
                    </Link>
                    {canBuyAddons && (
                        <Link href={`${TICKETS_PATH}/owned/${ticketId}/addons`}>
                            <Icon name='add_shopping_cart' />
                            <span className='label'>{t('tickets.purchaseAddons')}</span>
                            <Icon name='chevron_right' />
                        </Link>
                    )}
                </div>
            }

            {badge?.badge_name && (
                <div className='badge-summary'>
                    {badge.badge_picture_url ? (
                        // biome-ignore lint/performance/noImgElement: user-supplied URL on any host
                        <img src={badge.badge_picture_url} alt='' />
                    ) : (
                        <div className='avatar-fallback'>
                            <Icon name='person' />
                        </div>
                    )}
                    <div className='badge-text'>
                        <span className='badge-name'>{badge.badge_name}</span>
                        {(badge.badge_username || badge.badge_location) && (
                            <span className='badge-meta'>
                                {[badge.badge_username, badge.badge_location]
                                    .filter(Boolean)
                                    .join(' · ')}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {addons.length > 0 && (
                <section>
                    <div className='section-heading'>
                        <h2>{t('tickets.addonsHeading')}</h2>
                    </div>
                    <ul className='plain-list'>
                        {groupAddons(addons).map((group) => (
                            <li key={group.purchase_type_id}>
                                <Icon name='shopping_bag' />
                                <span className='label'>
                                    {group.count > 1
                                        ? fill(t('email.receipt.purchaseRow'), {
                                              description: group.name,
                                              count: group.count,
                                          })
                                        : group.name}
                                    <AdditionalInfo
                                        name={group.name}
                                        info={group.additional_info}
                                    />
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
