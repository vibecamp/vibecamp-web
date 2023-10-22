/* eslint-disable indent */
import React, { FC, useCallback, useState } from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import Modal from './core/Modal'
import Ticket from './Ticket'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'
import Col from './core/Col'
import { Maybe, PURCHASE_TYPES_BY_TYPE } from '../../../back-end/common/types'
import RowSelect from './core/RowSelect'
import MultiView from './core/MultiView'
import { vibefetch } from '../vibefetch'

import StripePaymentForm from './core/StripePaymentForm'
import { useObservableState, useRequest } from '../mobx/hooks'
import { DEFAULT_FORM_ERROR } from '../utils'
import LoadingDots from './core/LoadingDots'
import InfoBlurb from './core/InfoBlurb'

export default observer(() => {
    const state = useObservableState({
        code: '',
        ATTENDANCE_VIBECLIPSE_2024: 0,
        ATTENDANCE_CHILD_VIBECLIPSE_2024: 0,
        purchaseState: 'none' as 'none' | 'selection' | 'attendee-info' | 'payment'
    })

    const submitInviteCode = useRequest(async () => {
        const success = await vibefetch(Store.jwt, '/account/submit-invite-code', 'post', { invite_code: state.code })

        if (!success) {
            throw Error()
        }
    }, { lazy: true })

    const stripeOptions = useRequest(async () => {
        const { ATTENDANCE_VIBECLIPSE_2024, ATTENDANCE_CHILD_VIBECLIPSE_2024 } = state
        const purchases = { ATTENDANCE_VIBECLIPSE_2024, ATTENDANCE_CHILD_VIBECLIPSE_2024 }

        if (Object.values(purchases).some(count => count > 0)) {
            const stripe_client_secret = (await vibefetch(
                Store.jwt,
                '/purchase/create-intent',
                'post',
                purchases
            ))?.stripe_client_secret

            return {
                clientSecret: stripe_client_secret,
                appearance: {
                    theme: 'stripe' as const
                }
            }
        } else {
            return undefined
        }
    })

    return (
        <Col padding={20} pageLevel justify={Store.accountInfo.state.kind !== 'result' ? 'center' : undefined} align={Store.accountInfo.state.kind !== 'result' ? 'center' : undefined}>
            {Store.accountInfo.state.kind === 'result' &&
                <h1 style={{ fontSize: 24 }}>My tickets</h1>}

            <Spacer size={Store.accountInfo.state.kind !== 'result' ? 300 : undefined} />

            {Store.accountInfo.state.kind === 'loading' ?
                <LoadingDots size={100} color='var(--color-accent-1)' />
                : Store.accountInfo.state.kind === 'error' || Store.accountInfo.state.result == null ?
                    'Failed to load'
                    : Store.accountInfo.state.kind === 'result' ?
                        <>
                            {Store.accountInfo.state.result.allowed_to_purchase
                                ? <>
                                    {Store.purchasedTickets.map(p =>
                                        <React.Fragment key={p.purchase_id}>
                                            <Ticket name='Unknown attendee' ticketType='adult' />
                                            <Spacer size={16} />
                                        </React.Fragment>)}

                                    {/* isDisabled={Store.purchasedTickets.length >= MAX_TICKETS_PER_ACCOUNT.adult} */}
                                    <Button isPrimary onClick={() => state.purchaseState = 'selection'}>
                                        Buy {Store.purchasedTickets.length > 0 && 'more'} tickets
                                    </Button>

                                    {Store.accountInfo.state.result.inviteCodes.length > 0 &&
                                        <>
                                            <Spacer size={32} />

                                            <hr />

                                            <Spacer size={32} />

                                            <h2>
                                                Your invite codes
                                            </h2>

                                            <Spacer size={8} />

                                            <InfoBlurb>
                                                You can give these to other people you know and
                                                trust, to allow them to buy tickets
                                            </InfoBlurb>

                                            <Spacer size={16} />

                                            {Store.accountInfo.state.result.inviteCodes.map(({ code, used_by }, index) => <React.Fragment key={index}>
                                                {index > 0 && <Spacer size={16} />}

                                                <InviteCode code={code} usedBy={used_by} />
                                            </React.Fragment>)}
                                        </>}
                                </>
                                : <form onSubmit={submitInviteCode.load}>
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
                                            value={state.code}
                                            onChange={val => state.code = val}
                                        />

                                        {submitInviteCode.state.kind === 'error' &&
                                            <>
                                                <Spacer size={8} />

                                                <div style={{ color: 'red' }}>
                                                    {DEFAULT_FORM_ERROR}
                                                </div>
                                            </>}

                                        <Spacer size={8} />

                                        <Button isSubmit isPrimary isLoading={submitInviteCode.state.kind === 'loading'}>
                                            Enter invite code
                                        </Button>
                                    </Col>
                                </form>}
                        </>
                        : null}

            <Modal title='Ticket purchase' isOpen={state.purchaseState !== 'none'} onClose={() => state.purchaseState = 'none'}>
                <MultiView
                    views={[
                        { name: 'selection', content: <SelectionView state={state} /> },
                        { name: 'payment', content: <StripePaymentForm stripeOptions={stripeOptions.state.result} redirectUrl={location.origin + '#Tickets'} /> }
                    ]}
                    currentView={state.purchaseState}
                />
            </Modal>
        </Col>
    )
})

const SelectionView: FC<{ state: { ATTENDANCE_VIBECLIPSE_2024: number, ATTENDANCE_CHILD_VIBECLIPSE_2024: number, purchaseState: 'none' | 'selection' | 'attendee-info' | 'payment' } }> = observer(({ state }) => {

    return (
        <form onSubmit={() => state.purchaseState = 'attendee-info'}>
            <Col>
                You currently have:
                <div>
                    {Store.purchasedTickets.length} adult tickets, and
                </div>
                <div>
                    {0} child tickets
                </div>

                {(['ATTENDANCE_VIBECLIPSE_2024', 'ATTENDANCE_CHILD_VIBECLIPSE_2024'] as const).map(purchaseType => {
                    const purchaseTypeInfo = PURCHASE_TYPES_BY_TYPE[purchaseType]

                    return (
                        <React.Fragment key={purchaseType}>
                            <Spacer size={16} />

                            <RowSelect
                                label={`${purchaseTypeInfo.description} to purchase`}
                                value={state[purchaseType]}
                                onChange={val => state[purchaseType] = val}
                                options={new Array((purchaseTypeInfo.max_per_account ?? 4) + 1).fill(null).map((_, index) => index)}
                            />
                        </React.Fragment>
                    )
                })}

                <Spacer size={24} />

                <Button isSubmit isPrimary isDisabled={(['ATTENDANCE_VIBECLIPSE_2024', 'ATTENDANCE_CHILD_VIBECLIPSE_2024'] as const).every(t => state[t] === 0)}>
                    Purchase
                </Button>
            </Col>
        </form>
    )
})

const InviteCode: FC<{ code: string, usedBy: Maybe<string> }> = observer(({ code, usedBy }) => {
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