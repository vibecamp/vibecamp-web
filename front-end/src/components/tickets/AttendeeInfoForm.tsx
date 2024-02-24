import dayjs from 'dayjs'
import React from 'react'

import { TABLE_ROWS, Tables } from '../../../../back-end/types/db-types'
import { AttendeeInfo } from '../../../../back-end/types/misc'
import { observer, setter } from '../../mobx/misc'
import Store from '../../stores/Store'
import Checkbox from '../core/Checkbox'
import InfoBlurb from '../core/InfoBlurb'
import Input from '../core/Input'
import RadioGroup from '../core/RadioGroup'
import Spacer from '../core/Spacer'

type Props = {
    attendeeInfo: AttendeeInfo,
    attendeeErrors: Partial<Record<keyof AttendeeInfo, string>>,
    isChild: boolean,
    showingErrors: boolean,
    festival: Tables['festival']
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
                {`Whatever name ${props.attendeeInfo.is_primary_for_account ? 'you\'d' : 'this person would'} like to go by (in comms, etc). Can be
                real or twitter display name or whatever. Does not need to be
                ${props.attendeeInfo.is_primary_for_account ? 'your' : 'their'} legal name!`}
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
                {`If ${props.attendeeInfo.is_primary_for_account ? 'you' : 'they'} provide ${props.attendeeInfo.is_primary_for_account ? 'your' : 'their'} Discord handle, we can give ${props.attendeeInfo.is_primary_for_account ? 'you' : 'them'} attendee 
                status on the Vibecamp server and add ${props.attendeeInfo.is_primary_for_account ? 'you' : 'them'} to attendee-specific
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

            <RadioGroup
                label={props.attendeeInfo.is_primary_for_account ? 'I am...' : 'This person is...'}
                options={TABLE_ROWS.age_range.slice().sort((a, b) => b.start - a.start).map(r => ({ label: r.description, value: r.age_range }))}
                value={props.attendeeInfo.age_range}
                onChange={setter(props.attendeeInfo, 'age_range')}
                error={props.showingErrors && props.attendeeErrors.age_range}
            />

            {/* <Spacer size={INFO_BLURB_SPACE} /> */}

            <InfoBlurb>
                This age should be at the time of ${props.festival.festival_name} (${dayjs.utc(props.festival.start_date).format('DD/MM/YYYY')} - ${dayjs.utc(props.festival.end_date).format('DD/MM/YYYY')})
            </InfoBlurb>

            {!props.isChild &&
                <>
                    <Spacer size={FIELD_SPACE} />

                    <RadioGroup
                        label={`${props.attendeeInfo.is_primary_for_account ? 'I\'m' : 'They\'re'} interested in volunteering as a...`}
                        options={VOLUNTEER_OPTIONS}
                        value={props.attendeeInfo.interested_in_volunteering_as}
                        onChange={setter(props.attendeeInfo, 'interested_in_volunteering_as')}
                        error={props.showingErrors && props.attendeeErrors.interested_in_volunteering_as}
                    />

                    <Spacer size={INFO_BLURB_SPACE} />

                    <InfoBlurb>
                        Volunteers fall into two major categories: fae, and general volunteers.
                        <Spacer size={6} />
                        Fae are part of our safety team, which is responsible for psychological, social, and physical safety during the event.
                        <Spacer size={6} />
                        General volunteers are our muscle. They will be tasked with setup, breakdown, and general physical tasks.
                        <Spacer size={6} />
                        {props.attendeeInfo.is_primary_for_account
                            ? 'If you indicate you are willing to volunteer we will reach out to you with more details via email.'
                            : 'If this person indicates they are willing to volunteer we will reach out to you with more details via email.'}

                    </InfoBlurb>

                    <Spacer size={FIELD_SPACE} />

                    <Checkbox
                        value={props.attendeeInfo.interested_in_pre_call}
                        onChange={setter(props.attendeeInfo, 'interested_in_pre_call')}
                        error={props.showingErrors && props.attendeeErrors.interested_in_pre_call}
                    >
                        {`${props.attendeeInfo.is_primary_for_account ? 'I\'m' : 'They\'re'} interested in being introduced to other attendees on a
                        video call before the event`}
                    </Checkbox>

                    <Spacer size={INFO_BLURB_SPACE} />

                    <InfoBlurb>
                        {`We'd like to introduce people to some of their fellow
                        attendees so they can lay the foundations of
                        connection before arriving at ${props.festival.festival_name}.
                        If ${props.attendeeInfo.is_primary_for_account ? 'you' : 'this person'} would like
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
