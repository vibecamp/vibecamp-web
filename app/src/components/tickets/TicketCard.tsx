'use client'

import Link from 'next/link'
import type { ReactNode } from 'react'
import { t } from '@/copy/t'
import { classNames } from '@/lib/ui'
import type { OwnedTicket } from '@/server/tickets'
import Icon from '../core/Icon'

export const badgeMissing = (ticket: OwnedTicket) => !ticket.badge?.badge_name.trim()

function TicketStatus({ ticket }: { ticket: OwnedTicket }) {
    const missing = badgeMissing(ticket)
    return (
        <div className={missing ? 'ticket-status warning' : 'ticket-status'}>
            <Icon name={missing ? 'warning' : 'check_circle'} fill={1} />
            <span>{missing ? t('tickets.actionRequired') : t('tickets.allSet')}</span>
        </div>
    )
}

type Props = {
    ticket: OwnedTicket
    href?: string
    large?: boolean
    children?: ReactNode
}

export default function TicketCard({ ticket, href, large, children }: Props) {
    const className = classNames('ticket-card', large && 'large')

    const body = (
        <>
            <div className='ticket-body'>
                <div className='ticket-name'>
                    <span>{ticket.name}</span>
                </div>
                <TicketStatus ticket={ticket} />
                {children}
            </div>
            <div className='ticket-stub'>
                <Icon name={href ? 'chevron_right' : 'confirmation_number'} fill={href ? 0 : 1} />
            </div>
        </>
    )

    if (href) {
        return (
            <Link href={href} className={className}>
                {body}
            </Link>
        )
    }
    return <div className={className}>{body}</div>
}
