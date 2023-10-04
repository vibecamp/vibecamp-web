/* eslint-disable indent */
import React, { FC, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import Modal from './core/Modal'
import Ticket from './Ticket'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import { DEFAULT_FORM_ERROR, form, useObservableState } from '../mobx-utils'
import Col from './core/Col'
import { submitInviteCode } from '../api/account'
import { Maybe } from '../../../back-end/common/data'

export default observer(() => {
    const state = useObservableState(() => ({
        inviteCodeForm: form({
            initialValues: {
                code: ''
            },
            validators: {},
            submit: async ({ code }) => {
                const success = await submitInviteCode(Store.jwt, code)

                if (!success) {
                    return DEFAULT_FORM_ERROR
                }
            }
        }),
        purchaseForm: form({
            initialValues: {
                adultTickets: 0,
                childTickets: 0
            },
            validators: {},
            submit: async ({ adultTickets, childTickets }) => {

            }
        })
    }))


    return (
        <Col>
            <h1>My tickets</h1>

            <Spacer size={16} />

            {Store.accountInfo.state.kind === 'loading' ? 
                'Loading...'
            : Store.accountInfo.state.kind === 'error' || Store.accountInfo.state.result == null ?
                'Failed to load'
            : Store.accountInfo.state.kind === 'result' ?
                <>
                    {Store.accountInfo.state.result.allowed_to_purchase_tickets > 0
                        ? <>
                            {Store.accountInfo.state.result?.tickets.map(ticket =>
                                <Ticket name='Unknown attendee' ticketType='adult' key={ticket.ticket_id} />)}
        
                            <Button isPrimary isDisabled={Store.accountInfo.state.result.tickets.length >= Store.accountInfo.state.result.allowed_to_purchase_tickets} onClick={() => Store.buyTicketsModalOpen = true}>
                                Buy tickets
                            </Button>

                            <Spacer size={32} />

                            <hr />

                            <Spacer size={32} />

                            <h2>
                                Your invite codes
                            </h2>
                            
                            <Spacer size={8} />

                            <div>
                                You can give these to other people you know and
                                trust, to allow them to buy tickets
                            </div>

                            <Spacer size={16} />

                            {[
                                { code: '11111111-1111-1111-1111-111111111111', usedBy: 'My friend' },
                                { code: '22222222-2222-2222-2222-222222222222', usedBy: null },
                                { code: '33333333-3333-3333-3333-333333333333', usedBy: null },
                                { code: '44444444-4444-4444-4444-444444444444', usedBy: null }
                            ].map(({ code, usedBy}, index) => <React.Fragment key={index}>
                                {index > 0 && <Spacer size={16} />}

                                <InviteCode code={code} usedBy={usedBy} />
                            </React.Fragment>)}
                          </>
                        : <form onSubmit={state.inviteCodeForm.handleSubmit}>
                            <Col>
                                <h2>
                                    Welcome!
                                </h2>

                                <Spacer size={8} />

                                <div>
                                    Someone else will need to refer you by giving
                                    you an invite code before you can buy tickets
                                    for the current event.
                                </div>

                                <Spacer size={16} />
                                
                                    <Input
                                        label='Invite code'
                                        value={state.inviteCodeForm.fields.code.value}
                                        onChange={state.inviteCodeForm.fields.code.set}
                                        error={state.inviteCodeForm.fields.code.error}
                                        onBlur={state.inviteCodeForm.fields.code.activateValidation} 
                                    />

                                    {state.inviteCodeForm.error &&
                                        <>
                                            <Spacer size={8} />
                                        
                                            <div style={{ color: 'red' }}>
                                                {state.inviteCodeForm.error}
                                            </div>
                                        </>}

                                    <Spacer size={8} />
                                    
                                    <Button isSubmit isPrimary isLoading={state.inviteCodeForm.submitting}>
                                        Enter invite code
                                    </Button>
                            </Col>
                          </form>}
                </>
            : null}

            <Modal title='Ticket purchase' isOpen={Store.buyTicketsModalOpen} onClose={() => Store.buyTicketsModalOpen = false}>
                <form>
                    <Col>
                        You currently have:
                        <div>
                            {Store.accountInfo.state.result?.tickets.length} adult tickets, and
                        </div>
                        <div>
                            {0} child tickets
                        </div>

                        <Spacer size={20} />

                        <Input 
                            label='Adult tickets to purchase' 
                            type='number'
                            value={String(state.purchaseForm.fields.adultTickets.value)}
                            onChange={val => state.purchaseForm.fields.adultTickets.set(Number(val))}
                            error={state.purchaseForm.fields.adultTickets.error}
                            onBlur={state.purchaseForm.fields.adultTickets.activateValidation} 
                        />

                        <Spacer size={10} />

                        <Input
                            label='Child tickets to purchase'
                            type='number'
                            value={String(state.purchaseForm.fields.childTickets.value)}
                            onChange={val => state.purchaseForm.fields.childTickets.set(Number(val))}
                            error={state.purchaseForm.fields.childTickets.error}
                            onBlur={state.purchaseForm.fields.childTickets.activateValidation} 
                        />

                        <Spacer size={10} />

                        <Button isPrimary isDisabled={state.purchaseForm.fields.adultTickets.value === 0 && state.purchaseForm.fields.childTickets.value === 0}>
                            Purchase
                        </Button>
                    </Col>
                </form>
            </Modal>
        </Col>
    )
})

const InviteCode: FC<{ code: string, usedBy: Maybe<string> }> = React.memo(({ code, usedBy }) => {
    const [copied, setCopied] = useState(false)

    const copy = useCallback(async () => {
        await navigator.clipboard.writeText(code)
        setCopied(true)
    }, [code])

    return (
        <div className={'invite-code' + ' ' + (usedBy != null ? 'used' : '')}>
            <div className='code-widget'>
                <div className='code'>
                    {code}
                </div>

                <button onClick={copy}>
                    {copied
                        ? '✓'
                        : '⎘'}
                </button>
            </div>

            
            <div className='used-by'>
                {usedBy != null && `Used by ${usedBy}`}
            </div>
        </div>
    )
})