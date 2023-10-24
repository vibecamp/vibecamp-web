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
import { Maybe } from '../../../back-end/common/types'
import MultiView from './core/MultiView'
import { vibefetch } from '../vibefetch'

import StripePaymentForm from './core/StripePaymentForm'
import { useObservableState, useRequest } from '../mobx/hooks'
import { DEFAULT_FORM_ERROR } from '../utils'
import LoadingDots from './core/LoadingDots'
import InfoBlurb from './core/InfoBlurb'
import Checkbox from './core/Checkbox'
import AttendeeInfoForm, { AttendeeInfo } from './AttendeeInfoForm'

export default observer(() => {
    const state = useObservableState({
        code: '',
        purchaseState: 'none' as 'none' | 'selection' | 'payment'
    })

    const purchaseState = useObservableState(INITIAL_PURCHASE_STATE)

    const submitInviteCode = useRequest(async () => {
        const success = await vibefetch(Store.jwt, '/account/submit-invite-code', 'post', { invite_code: state.code })

        if (!success) {
            throw Error()
        }
    }, { lazy: true })

    const stripeOptions = useRequest(async () => {
        const purchases = {
            ATTENDANCE_VIBECLIPSE_2024: purchaseState.secondaryAdultAttendee == null ? 1 : 2,
            ATTENDANCE_CHILD_VIBECLIPSE_2024: purchaseState.childAttendees.length
        }

        if (Object.values(purchases).some(count => count > 0)) {
            const stripe_client_secret = (await vibefetch(
                Store.jwt,
                '/purchase/create-intent',
                'post',
                purchases
            ))?.stripe_client_secret

            if (stripe_client_secret == null) {
                return undefined
            }

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

            <Spacer size={Store.accountInfo.state.kind !== 'result' ? 300 : 24} />

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
                                            <Spacer size={24} />
                                        </React.Fragment>)}

                                    {/* isDisabled={Store.purchasedTickets.length >= MAX_TICKETS_PER_ACCOUNT.adult} */}
                                    <Button isPrimary onClick={() => state.purchaseState = 'selection'}>
                                        Buy tickets
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
                                                {index > 0 && <Spacer size={8} />}

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

                                        <Spacer size={24} />

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
                        { name: 'selection', content: <SelectionView purchaseState={purchaseState} goToNext={() => state.purchaseState = 'payment'} /> },
                        { name: 'payment', content: <StripePaymentForm stripeOptions={stripeOptions.state.result} redirectUrl={location.origin + '#Tickets'} /> }
                    ]}
                    currentView={state.purchaseState}
                />
            </Modal>
        </Col>
    )
})

const SelectionView: FC<{ purchaseState: typeof INITIAL_PURCHASE_STATE, goToNext: () => void }> = observer(({ purchaseState, goToNext }) => {

    return (
        <form onSubmit={goToNext}>
            <Col padding={20}>
                {/* You currently have:
                <div>
                    {Store.purchasedTickets.length} adult tickets, and
                </div>
                <div>
                    {0} child tickets
                </div> */}

                <AttendeeInfoForm attendeeInfo={purchaseState.primaryAdultAttendee} isChild={false} isAccountHolder={true} />

                <Spacer size={24} />

                <hr/>

                <Spacer size={24} />

                <Checkbox value={purchaseState.secondaryAdultAttendee != null} onChange={bringing => {
                    if (bringing) {
                        purchaseState.secondaryAdultAttendee = {...BLANK_ATTENDEE}
                    } else {
                        purchaseState.secondaryAdultAttendee = null
                    }
                }}>
                    {'I\'m bringing another adult with me'}
                </Checkbox>

                <Spacer size={8} />

                <InfoBlurb>
                    {`You can purchase a ticket for up to one other adult attendee
                    if you'd like. Their ticket and info will have to be managed
                    through your account here, but they'll otherwise be a full
                    attendee (with a badge and everything)`}
                </InfoBlurb>

                {purchaseState.secondaryAdultAttendee != null &&
                    <>
                        <Spacer size={24} />

                        <AttendeeInfoForm attendeeInfo={purchaseState.secondaryAdultAttendee} isChild={false} isAccountHolder={false} />
                    </>}

                <Spacer size={24} />

                <hr/>

                <Spacer size={24} />

                {purchaseState.childAttendees.map((attendee, index) =>
                    <React.Fragment key={index}>
                        <Spacer size={24} />

                        <AttendeeInfoForm attendeeInfo={attendee} isChild={true} isAccountHolder={false} />
                    </React.Fragment>)}

                <Spacer size={24} />

                <Button onClick={() => purchaseState.childAttendees.push({...BLANK_ATTENDEE})} disabled={purchaseState.childAttendees.length >= 5}>
                    + Add a minor
                </Button>

                {purchaseState.childAttendees.length === 5 &&
                    <>
                        <Spacer size={8} />
        
                        <InfoBlurb>
                            {'Can\'t buy tickets for more than five children on one account, sorry!'}
                        </InfoBlurb>
                    </>}

                <Spacer size={8} />

                <InfoBlurb>
                    {`Minors between age 2-18 will need their own tickets, but
                    those will live under your account. Children under 2 years
                    old do not need a ticket.`}
                </InfoBlurb>

                <Spacer size={24} />

                {/* TODO: Pricing/purchase summary */}

                <Button isSubmit isPrimary>
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

const BLANK_ATTENDEE: Readonly<AttendeeInfo> = {
    dietary_restrictions: '',
    name: null,
    discord_handle: null,
    twitter_handle: null,
    interested_in_volunteering_as: null,
    interested_in_pre_call: false,
    planning_to_camp: false,
    associated_account_id: 1,
    age_group: null,
    medical_training: null
}

const INITIAL_PURCHASE_STATE = {
    primaryAdultAttendee: {...BLANK_ATTENDEE},
    secondaryAdultAttendee: null as AttendeeInfo | null,
    childAttendees: [] as AttendeeInfo[],
}