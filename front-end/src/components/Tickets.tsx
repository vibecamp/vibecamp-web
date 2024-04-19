import React from 'react'

import { observer } from '../mobx/misc'
import WindowObservables from '../mobx/WindowObservables'
import Store from '../stores/Store'
import Button from './core/Button'
import Col from './core/Col'
import LoadingDots from './core/LoadingDots'
import Modal from './core/Modal'
import Spacer from './core/Spacer'
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

                            {/* {Store.accountInfo.state.result.allowed_to_purchase
                                ? <> */}
                            {Store.festivals.state.result?.map(festival => {
                                const tickets = Store.purchasedTicketsByFestival[festival.festival_id] ?? []
                                const otherPurchases = Store.nonTicketPurchasesByFestival[festival.festival_id] ?? []

                                return (
                                    <div key={festival.festival_id} style={festival.end_date.valueOf() < Date.now() ? { opacity: 0.5 } : undefined}>
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

                                        {Store.purchaseTypes.state.result && otherPurchases.length > 0 &&
                                            <div>
                                                Other purchases:

                                                <Spacer size={4} />

                                                <div style={{ border: 'var(--controls-border)', borderRadius: 4, background: 'white' }}>
                                                    {otherPurchases.map((p, i) =>
                                                        <div style={{ padding: '4px 8px', borderTop: i > 0 ? 'var(--controls-border)' : undefined }} key={p.purchase_id}>
                                                            1x {Store.purchaseTypes.state.result?.find(t => t.purchase_type_id === p.purchase_type_id)?.description}
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

                                        <Spacer size={16} />

                                        <a
                                            className='button primary'
                                            href='https://docs.google.com/forms/d/17-VvG7Go4KMwh2vc9hzDxyMZWMjtvI-E_tMZXh1Cff8/edit?ts=661f0a84'
                                            target='_blank'
                                            rel="noreferrer"
                                        >
                                            Need financial aid? Apply here
                                            <Spacer size={5} />
                                            <span className='material-symbols-outlined' style={{ fontSize: 18 }}>open_in_new</span>
                                        </a>

                                        <Spacer size={32} />
                                        <hr />
                                        <Spacer size={32} />
                                    </div>
                                )
                            })}

                            {/* <InviteCodes /> */}
                            {/* </> */}
                            {/*
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
                                </>*/}

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
