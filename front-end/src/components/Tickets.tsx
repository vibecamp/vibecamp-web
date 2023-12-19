import React from 'react'

import { observer } from '../mobx/misc'
import WindowObservables from '../mobx/WindowObservables'
import { needsAdultTicket } from '../stores/PurchaseForm'
import Store from '../stores/Store'
import Application from './Application'
import Button from './core/Button'
import Col from './core/Col'
import LoadingDots from './core/LoadingDots'
import Modal from './core/Modal'
import Spacer from './core/Spacer'
import InviteCodeEntryForm from './tickets/InviteCodeEntryForm'
import InviteCodes from './tickets/InviteCodes'
import PurchaseTicketsModal from './tickets/PurchaseTicketsModal'
import Ticket from './tickets/Ticket'

export default observer(() => {
    const loading = Store.accountInfo.state.kind === 'loading'
    const loadingOrError = loading || Store.accountInfo.state.kind === 'error'

    const { application_status } = Store.accountInfo.state.result ?? {}

    return (
        <Col padding={20} pageLevel justify={loadingOrError ? 'center' : undefined} align={loadingOrError ? 'center' : undefined}>
            {Store.accountInfo.state.kind === 'result' &&
                <h1 style={{ fontSize: 24, alignSelf: 'flex-start' }}>
                    My tickets
                </h1>}

            <Spacer size={loadingOrError ? 300 : 24} />

            {loading ?
                <LoadingDots size={100} color='var(--color-accent-1)' />
                : Store.accountInfo.state.kind === 'error' || Store.accountInfo.state.result == null ?
                    'Failed to load'
                    : Store.accountInfo.state.kind === 'result' ?
                        <>
                            {Store.accountInfo.state.result.allowed_to_purchase
                                ? <>
                                    {Store.purchasedTickets.length === 0 &&
                                        <>
                                            <div style={{ textAlign: 'center' }}>
                                                {'(after you purchase tickets they\'ll show up here)'}
                                            </div>
                                            <Spacer size={32} />
                                        </>}

                                    {Store.purchasedTickets.map(t => {
                                        return (
                                            <React.Fragment key={t.purchase_id}>
                                                <Ticket name={t.attendeeInfo?.name} ticketType={t.attendeeInfo == null ? undefined : needsAdultTicket(t.attendeeInfo?.age) ? 'adult' : 'child'} />
                                                <Spacer size={24} />
                                            </React.Fragment>
                                        )
                                    })}

                                    <Button isPrimary onClick={openTicketPurchaseModal}>
                                        {Store.purchasedTickets.length === 0
                                            ? 'Buy tickets'
                                            : 'Buy more tickets or bus/bedding'}
                                    </Button>

                                    <Spacer size={32} />

                                    <InviteCodes />
                                </>
                                : <>
                                    <InviteCodeEntryForm />

                                    <Spacer size={48} />

                                    <div>
                                        {`Alternately, you can apply for
                                        admission to the event. The team will
                                        review your submission and may invite
                                        you directly.`}
                                    </div>

                                    <Spacer size={24} />

                                    <Button isPrimary disabled={application_status !== 'unsubmitted'} onClick={openApplicationModal}>
                                        {application_status === 'pending'
                                            ? 'Your application is under review!'
                                            : application_status === 'rejected'
                                                ? 'Your application has been denied :('
                                                : `Apply to ${Store.festival.state.result?.festival_name}`}
                                    </Button>

                                </>}

                            {Store.festival.state.result?.info_url &&
                                <>

                                    <Spacer size={32} />
                                    <hr />
                                    <Spacer size={32} />

                                    <a
                                        className='button primary'
                                        href={Store.festival.state.result.info_url}
                                        target='_blank'
                                        rel="noreferrer"
                                    >
                                        Info about {Store.festival.state.result.festival_name} &nbsp; <span className='material-symbols-outlined' style={{ fontSize: 18 }}>open_in_new</span>
                                    </a>
                                </>}
                        </>
                        : null}

            <Modal
                title='Ticket purchase'
                isOpen={WindowObservables.hashState?.ticketPurchaseModalState === 'selection' || WindowObservables.hashState?.ticketPurchaseModalState === 'payment'}
                onClose={closeTicketPurchaseModal}
            >
                {() => Store.accountInfo.state.result && <PurchaseTicketsModal />}
            </Modal>

            <Modal
                title={`Apply to ${Store.festival.state.result?.festival_name}`}
                isOpen={WindowObservables.hashState?.applicationModalOpen === true}
                onClose={closeApplicationModal}
            >
                {() => <Application onSuccess={handleApplicationSubmissionSuccess} />}
            </Modal>
        </Col>
    )
})

const closeTicketPurchaseModal = () => {
    WindowObservables.assignHashState({ ticketPurchaseModalState: 'none' })
}

const openTicketPurchaseModal = () => {
    WindowObservables.assignHashState({ ticketPurchaseModalState: 'selection' })
}

const closeApplicationModal = () => {
    WindowObservables.assignHashState({ applicationModalOpen: false })
}

const handleApplicationSubmissionSuccess = () => {
    closeApplicationModal()
    void Store.accountInfo.load()
}

const openApplicationModal = () => {
    WindowObservables.assignHashState({ applicationModalOpen: true })
}
