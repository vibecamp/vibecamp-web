import React from 'react'

import { FESTIVALS_WITH_SALES_OPEN } from '../../../back-end/utils/constants'
import { observer } from '../mobx/misc'
import WindowObservables from '../mobx/WindowObservables'
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
            {loading ?
                <LoadingDots size={100} color='var(--color-accent-1)' />
                : Store.accountInfo.state.kind === 'error' || Store.accountInfo.state.result == null ?
                    'Failed to load'
                    : Store.accountInfo.state.kind === 'result' ?
                        <>
                            <h1 style={{ fontSize: 24, alignSelf: 'flex-start' }}>
                                My tickets
                            </h1>

                            <Spacer size={24} />

                            {Store.accountInfo.state.result.allowed_to_purchase
                                ? <>
                                    {FESTIVALS_WITH_SALES_OPEN.map(festival => {
                                        const tickets = Store.purchasedTickets[festival.festival_id]

                                        return (
                                            <React.Fragment key={festival.festival_id}>
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

                                                {tickets.map(t =>
                                                    <React.Fragment key={t.purchase_id}>
                                                        <Ticket name={undefined} ticketType='adult' ownedByAccountId={t.owned_by_account_id} />
                                                        <Spacer size={24} />
                                                    </React.Fragment>)}

                                                <Button isPrimary onClick={openTicketPurchaseModal(festival.festival_id)}>
                                                    {tickets.length === 0
                                                        ? 'Buy tickets'
                                                        : 'Buy more tickets or bus/bedding'}
                                                </Button>

                                                {festival.info_url &&
                                                    <>

                                                        <Spacer size={16} />

                                                        <a
                                                            className='button primary'
                                                            href={festival.info_url}
                                                            target='_blank'
                                                            rel="noreferrer"
                                                        >
                                                            Info about {festival.festival_name} &nbsp; <span className='material-symbols-outlined' style={{ fontSize: 18 }}>open_in_new</span>
                                                        </a>
                                                    </>}

                                                <Spacer size={32} />
                                                <hr />
                                                <Spacer size={32} />
                                            </React.Fragment>
                                        )
                                    })}

                                    <InviteCodes />
                                </>
                                : <>
                                    <h2>
                                        Welcome!
                                    </h2>

                                    <Spacer size={8} />

                                    <div>
                                        {`You'll need to apply to Vibecamp before
                                        you can buy tickets. The team will
                                        review your submission and invite you
                                        if approved.`}
                                    </div>

                                    <Spacer size={16} />

                                    <Button isPrimary disabled={application_status !== 'unsubmitted'} onClick={openApplicationModal}>
                                        {application_status === 'pending'
                                            ? 'Your application is under review!'
                                            : application_status === 'rejected'
                                                ? 'Your application has been denied :('
                                                : 'Apply to Vibecamp'}
                                    </Button>

                                    <Modal
                                        title='Apply to Vibecamp'
                                        isOpen={WindowObservables.hashState?.applicationModalOpen === true}
                                        onClose={closeApplicationModal}
                                        side='right'
                                    >
                                        {() => <Application onSuccess={handleApplicationSubmissionSuccess} />}
                                    </Modal>

                                    <Spacer size={48} />

                                    <div>
                                        {`Or, a friend who has invite codes can
                                        give you one, which will allow you to
                                        buy tickets.`}
                                    </div>

                                    <Spacer size={16} />

                                    <InviteCodeEntryForm />
                                </>}

                            <Spacer size={24} />

                            <div style={{ textAlign: 'center' }}>
                                Questions or issues?&nbsp;
                                <a href='mailto:support@vibe.camp'>Email us</a>
                            </div>
                        </>
                        : null}

            <Modal
                title='Ticket purchase'
                isOpen={WindowObservables.hashState?.ticketPurchaseModalState != null}
                onClose={closeTicketPurchaseModal}
                side='right'
            >
                {() => Store.accountInfo.state.result && <PurchaseTicketsModal />}
            </Modal>
        </Col>
    )
})

const closeTicketPurchaseModal = () => {
    WindowObservables.assignHashState({ ticketPurchaseModalState: null })
}

const openTicketPurchaseModal = (festival_id: string) => () => {
    WindowObservables.assignHashState({ ticketPurchaseModalState: festival_id })
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
