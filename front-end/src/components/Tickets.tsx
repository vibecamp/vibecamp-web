import dayjs from 'dayjs'
import React, { useCallback } from 'react'

import useHashState from '../hooks/useHashState'
import { useStore } from '../hooks/useStore'
import Button from './core/Button'
import Col from './core/Col'
import LoadingDots from './core/LoadingDots'
import Modal from './core/Modal'
import Spacer from './core/Spacer'
import PurchaseTicketsModal from './tickets/PurchaseTicketsModal'
import Ticket from './tickets/Ticket'

export default React.memo(() => {
    const store = useStore()
    const { hashState, setHashState } = useHashState()
    const loading = store.accountInfo.state.kind === 'loading'
    const loadingOrError = loading || store.accountInfo.state.kind === 'error'

    // const { application_status } = store.accountInfo.state.result ?? {}

    const closeTicketPurchaseModal = useCallback(() => {
        setHashState({ ticketPurchaseModalState: null })
    }, [setHashState])

    const openTicketPurchaseModal = (festival_id: string) => () => {
        setHashState({ ticketPurchaseModalState: festival_id })
    }

    return (
        <Col padding={20} pageLevel justify={loadingOrError ? 'center' : undefined} align={loadingOrError ? 'center' : undefined}>
            {loading ?
                <LoadingDots size={100} color='var(--color-accent-1)' />
                : store.accountInfo.state.kind === 'error' || store.accountInfo.state.result == null ?
                    'Failed to load'
                    : store.accountInfo.state.kind === 'result' ?
                        <>
                            <h1 style={{ fontSize: 24, alignSelf: 'flex-start' }}>
                                My tickets
                            </h1>

                            <Spacer size={24} />

                            {store.festivals.state.result?.map(festival => {
                                const tickets = store.purchasedTicketsByFestival[festival.festival_id] ?? []
                                const otherPurchases = store.nonTicketPurchasesByFestival[festival.festival_id] ?? []

                                // HACK: Attendees under one account may have separate cabin names, which
                                // is assumed not to be true as this is currently written
                                const cabinName = store.accountInfo.state.result?.cabins.filter(c => c.festival_id === festival.festival_id)?.[0]?.cabin_name

                                return (
                                    <div key={festival.festival_id} style={festival.end_date.isBefore(dayjs.utc()) ? { filter: 'contrast(0.5)' } : undefined}>
                                        <h2>
                                            {festival.festival_name}
                                        </h2>

                                        <Spacer size={16} />

                                        {tickets.length === 0 &&
                                            <>
                                                <div style={{ textAlign: 'center' }}>
                                                    {'(after you purchase tickets they\'ll show up here)'}
                                                </div>
                                                <Spacer size={32} />
                                            </>}

                                        {tickets.map((ticket, index) =>
                                            <React.Fragment key={ticket.purchase_id}>
                                                {index > 0 &&
                                                    <Spacer size={24} />}
                                                <Ticket name={undefined} ticketType='adult' ownedByAccountId={ticket.owned_by_account_id} />
                                            </React.Fragment>)}

                                        {cabinName &&
                                            <div>
                                                Cabin: {cabinName}
                                            </div>}

                                        {store.purchaseTypes.state.result && otherPurchases.length > 0 &&
                                            <div>
                                                Other purchases:

                                                <Spacer size={4} />

                                                <div style={{ border: 'var(--controls-border)', borderRadius: 4, background: 'var(--color-background-1)' }}>
                                                    {otherPurchases.map((p, i) =>
                                                        <div style={{ padding: '4px 8px', borderTop: i > 0 ? 'var(--controls-border)' : undefined }} key={p.purchase_id}>
                                                            1x {store.purchaseTypes.state.result?.find(t => t.purchase_type_id === p.purchase_type_id)?.description}
                                                        </div>)}
                                                </div>
                                            </div>}

                                        {festival.sales_are_open &&
                                            <>
                                                <Spacer size={24} />

                                                <Button isPrimary onClick={openTicketPurchaseModal(festival.festival_id)}>
                                                    {tickets.length === 0
                                                        ? 'Buy tickets'
                                                        : 'Buy more tickets or bus/bedding'}
                                                </Button>
                                            </>}

                                        {festival.info_url &&
                                            <>

                                                <Spacer size={16} />

                                                <a
                                                    className='button primary'
                                                    href={festival.info_url}
                                                    target='_blank'
                                                    rel="noreferrer"
                                                >
                                                    Info about {festival.festival_name}
                                                    <Spacer size={5} />
                                                    <span className='material-symbols-outlined' style={{ fontSize: 18 }}>open_in_new</span>
                                                </a>
                                            </>}

                                        {festival.festival_name.includes('Vibe') &&
                                            (<>
                                                <Spacer size={16} />

                                                <a
                                                    className='button primary'
                                                    href='https://docs.google.com/forms/d/1-H7RljNum3D9VP8qLY8b65sCB-xR62sczVvh2m5LRLQ/edit'
                                                    target='_blank'
                                                    rel="noreferrer"
                                                >
                                                    Need financial aid? Apply here
                                                    <Spacer size={5} />
                                                    <span className='material-symbols-outlined' style={{ fontSize: 18 }}>open_in_new</span>
                                                </a>
                                            </>)
                                        }

                                        <Spacer size={32} />
                                        <hr />
                                        <Spacer size={32} />
                                    </div>
                                )
                            })}

                            <Spacer size={24} />

                            <div style={{ textAlign: 'center' }}>
                                Questions or issues?&nbsp;
                                <a href='mailto:support@vibe.camp'>Email us</a>
                            </div>
                        </>
                        : null}

            <Modal
                title='Ticket purchase'
                isOpen={hashState?.ticketPurchaseModalState != null}
                onClose={closeTicketPurchaseModal}
                side='right'
            >
                {() => store.accountInfo.state.result && <PurchaseTicketsModal />}
            </Modal>
        </Col>
    )
})
