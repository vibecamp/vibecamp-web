import React from 'react'

import { TABLE_ROWS } from '../../../../back-end/types/db-types'
import { AttendeeInfo } from '../../../../back-end/types/misc'
import { observer, setter } from '../../mobx/misc'
import Store from '../../stores/Store'
import { prettyDate } from '../../utils'
import Checkbox from '../core/Checkbox'
import InfoBlurb from '../core/InfoBlurb'
import Input from '../core/Input'
import NumberInput from '../core/NumberInput'
import RadioGroup from '../core/RadioGroup'
import Spacer from '../core/Spacer'

type Props = {
    attendeeInfo: AttendeeInfo,
    attendeeErrors: Partial<Record<keyof AttendeeInfo, string>>,
    isAccountHolder: boolean,
    isChild: boolean,
    showingErrors: boolean
}

const INFO_BLURB_SPACE = 12
const FIELD_SPACE = 24

export default observer((props: Props) => {

    return (
        <>
            {props.attendeeInfo.name &&
                <div className='attendee-info-form-sticky-header'>
                    {`${props.attendeeInfo.name}'s info`}
                </div>}

            <Input
                label='Attendee name'
                placeholder='Brooke'
                value={props.attendeeInfo.name}
                onChange={setter(props.attendeeInfo, 'name')}
                error={props.showingErrors && props.attendeeErrors.name}
            />

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {`Whatever name ${props.isAccountHolder ? 'you\'d' : 'this person would'} like to go by (in comms, etc). Can be
                real or twitter display name or whatever. Does not need to be
                ${props.isAccountHolder ? 'your' : 'their'} legal name!`}
            </InfoBlurb>

            <Spacer size={FIELD_SPACE} />

            <Input
                label='Discord handle (optional)'
                placeholder='gptbrooke'
                value={props.attendeeInfo.discord_handle ?? ''}
                onChange={setter(props.attendeeInfo, 'discord_handle')}
                error={props.showingErrors && props.attendeeErrors.discord_handle}
            />

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {`If ${props.isAccountHolder ? 'you' : 'they'} provide ${props.isAccountHolder ? 'your' : 'their'} Discord handle, we can give ${props.isAccountHolder ? 'you' : 'them'} attendee 
                status on the Vibecamp server and add ${props.isAccountHolder ? 'you' : 'them'} to attendee-specific
                channels`}
            </InfoBlurb>

            <Spacer size={FIELD_SPACE} />

            <Input
                label='Twitter handle (optional)'
                placeholder='@gptbrooke'
                value={props.attendeeInfo.twitter_handle ?? ''}
                onChange={setter(props.attendeeInfo, 'twitter_handle')}
                error={props.showingErrors && props.attendeeErrors.twitter_handle}
            />

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {'Username, not display name!'}
            </InfoBlurb>

            <Spacer size={FIELD_SPACE} />

            <NumberInput
                label={props.isAccountHolder ? 'I am...' : 'This person is...'}
                placeholder='(years old)'
                value={props.attendeeInfo.age}
                onChange={setter(props.attendeeInfo, 'age')}
                error={props.showingErrors && props.attendeeErrors.age}
            />

            {props.attendeeInfo.age != null && props.attendeeInfo.age < 2 &&
                <>
                    <Spacer size={INFO_BLURB_SPACE} />

                    <InfoBlurb>
                        {'Children under two don\'t need a ticket!'}
                    </InfoBlurb>
                </>}

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {Store.festival.state.result != null
                    ? `This age should be at the time of ${Store.festival.state.result.festival_name} (${prettyDate(Store.festival.state.result.start_date)} - ${prettyDate(Store.festival.state.result.end_date)})`
                    : 'This age should be at the time of the festival'}
            </InfoBlurb>

            {!props.isChild &&
                <>
                    <Spacer size={FIELD_SPACE} />

                    <RadioGroup
                        label={`${props.isAccountHolder ? 'I\'m' : 'They\'re'} interested in volunteering as a...`}
                        options={VOLUNTEER_OPTIONS}
                        value={props.attendeeInfo.interested_in_volunteering_as}
                        onChange={setter(props.attendeeInfo, 'interested_in_volunteering_as')}
                        error={props.showingErrors && props.attendeeErrors.interested_in_volunteering_as}
                    />

                    <Spacer size={INFO_BLURB_SPACE} />

                    <InfoBlurb>
                        Volunteers for vibeclipse fall into two major categories. Fae, and general volunteers.
                        <Spacer size={6} />
                        Fae are part of our safety team, which is responsible for psychological, social, and physical safety during the event.
                        <Spacer size={6} />
                        General volunteers are our muscle. They will be tasked with setup, breakdown, and general physical tasks.
                        <Spacer size={6} />
                        {props.isAccountHolder
                            ? 'If you indicate you are willing to volunteer we will reach out to you with more details via email.'
                            : 'If this person indicates they are willing to volunteer we will reach out to you with more details via email.'}

                    </InfoBlurb>

                    <Spacer size={FIELD_SPACE} />

                    <Checkbox
                        value={props.attendeeInfo.interested_in_pre_call}
                        onChange={setter(props.attendeeInfo, 'interested_in_pre_call')}
                        error={props.showingErrors && props.attendeeErrors.interested_in_pre_call}
                    >
                        {`${props.isAccountHolder ? 'I\'m' : 'They\'re'} interested in being introduced to other attendees on a
                        video call before the event`}
                    </Checkbox>

                    <Spacer size={INFO_BLURB_SPACE} />

                    <InfoBlurb>
                        {`We'd like to introduce people to some of their fellow
                        attendees so they can lay the foundations of
                        connection before arriving at ${Store.festival.state.result?.festival_name}.
                        If ${props.isAccountHolder ? 'you' : 'this person'} would like
                        to be invited to online hangouts please check the box
                        below.`}&nbsp;
                        <b>If you check this box, your email address
                        ({Store.accountInfo.state.result?.email_address}) may be
                        viewable by a limited number of attendees who also
                        choose to participate.</b>
                    </InfoBlurb>
                </>}
        </>
    )
})

const VOLUNTEER_OPTIONS = [
    { value: null, label: 'Not interested in volunteering' },
    ...TABLE_ROWS.volunteer_type
        .slice()
        .sort((a, b) => a.volunteer_type_id === 'FAE' ? 1 : b.volunteer_type_id === 'FAE' ? -1 : 0)
        .map(({ volunteer_type_id, description }) => ({
            value: volunteer_type_id,
            label: description
        }))
] as const
