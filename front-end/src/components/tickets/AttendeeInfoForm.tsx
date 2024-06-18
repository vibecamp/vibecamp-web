import React from 'react'

import { TABLE_ROWS } from '../../../../back-end/types/db-types'
import { AttendeeInfo } from '../../../../back-end/types/misc'
import { Store,useStore } from '../../hooks/useStore'
import Checkbox from '../core/Checkbox'
import InfoBlurb from '../core/InfoBlurb'
import Input from '../core/Input'
import RadioGroup from '../core/RadioGroup'
import Spacer from '../core/Spacer'

export type Props = {
    attendeeInfo: Readonly<AttendeeInfo>,
    attendeeErrors: Partial<Record<keyof AttendeeInfo, string>>,
    setAttendeeProperty: <T extends AttendeeInfo, K extends keyof T>(attendee: T, property: K, value: T[K]) => void,
    isChild: boolean,
    showFloatingHeading?: boolean,
    festival: (NonNullable<Store['festivals']['state']['result']>)[number] | undefined
}

const INFO_BLURB_SPACE = 12
const FIELD_SPACE = 24

export default React.memo(({ attendeeInfo, attendeeErrors, setAttendeeProperty, isChild, showFloatingHeading, festival }: Props) => {
    const store = useStore()

    return (
        <>
            {showFloatingHeading && attendeeInfo.name &&
                <div className='attendee-info-form-sticky-header'>
                    {`${attendeeInfo.name}'s info`}
                </div>}

            <Input
                label='Attendee name'
                placeholder='Brooke'
                value={attendeeInfo.name}
                onChange={val => setAttendeeProperty(attendeeInfo, 'name', val)}
                error={attendeeErrors.name}
            />

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {`Whatever name ${attendeeInfo.is_primary_for_account ? 'you\'d' : 'this person would'} like to go by (in comms, etc). Can be
                real or twitter display name or whatever. Does not need to be
                ${attendeeInfo.is_primary_for_account ? 'your' : 'their'} legal name!`}
            </InfoBlurb>

            <Spacer size={FIELD_SPACE} />

            <Input
                label='Twitter handle (optional)'
                placeholder='@gptbrooke'
                value={attendeeInfo.twitter_handle ?? ''}
                onChange={val => setAttendeeProperty(attendeeInfo, 'twitter_handle', val)}
                error={attendeeErrors.twitter_handle}
            />

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {'Username, not display name!'}
            </InfoBlurb>

            <Spacer size={FIELD_SPACE} />

            <Input
                label='Discord handle (optional)'
                placeholder='gptbrooke'
                value={attendeeInfo.discord_handle ?? ''}
                onChange={val => setAttendeeProperty(attendeeInfo, 'discord_handle', val)}
                error={attendeeErrors.discord_handle}
            />

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {`If ${attendeeInfo.is_primary_for_account ? 'you' : 'they'} provide ${attendeeInfo.is_primary_for_account ? 'your' : 'their'} Discord handle, we can give ${attendeeInfo.is_primary_for_account ? 'you' : 'them'} attendee 
                status on the Vibecamp server and add ${attendeeInfo.is_primary_for_account ? 'you' : 'them'} to attendee-specific
                channels`}
            </InfoBlurb>

            <Spacer size={FIELD_SPACE} />

            <RadioGroup
                label={attendeeInfo.is_primary_for_account ? 'I am...' : 'This person is...'}
                options={TABLE_ROWS.age_range.slice().sort((a, b) => b.start - a.start).map(r => ({ label: r.description, value: r.age_range }))}
                value={attendeeInfo.age_range}
                onChange={val => setAttendeeProperty(attendeeInfo, 'age_range', val)}
                error={attendeeErrors.age_range}
            />

            {/* <Spacer size={INFO_BLURB_SPACE} /> */}

            {festival &&
                <InfoBlurb>
                    This age should be at the time of {festival.festival_name} ({festival.start_date.format('MM/DD/YYYY')} - {festival.end_date.format('MM/DD/YYYY')})
                </InfoBlurb>}

            {!isChild &&
                <>
                    <Spacer size={FIELD_SPACE} />

                    <RadioGroup
                        label={`${attendeeInfo.is_primary_for_account ? 'I\'m' : 'They\'re'} interested in volunteering as a...`}
                        options={VOLUNTEER_OPTIONS}
                        value={attendeeInfo.interested_in_volunteering_as}
                        onChange={val => setAttendeeProperty(attendeeInfo, 'interested_in_volunteering_as', val)}
                        error={attendeeErrors.interested_in_volunteering_as}
                    />

                    <Spacer size={INFO_BLURB_SPACE} />

                    <InfoBlurb>
                        Volunteers fall into two major categories: fae, and general volunteers.
                        <Spacer size={6} />
                        Fae are part of our safety team, which is responsible for psychological, social, and physical safety during the event.
                        <Spacer size={6} />
                        General volunteers are our muscle. They will be tasked with setup, breakdown, and general physical tasks.
                        <Spacer size={6} />
                        {attendeeInfo.is_primary_for_account
                            ? 'If you indicate you are willing to volunteer we will reach out to you with more details via email.'
                            : 'If this person indicates they are willing to volunteer we will reach out to you with more details via email.'}

                    </InfoBlurb>

                    {festival &&
                        <>
                            <Spacer size={FIELD_SPACE} />

                            <Checkbox
                                value={attendeeInfo.interested_in_pre_call}
                                onChange={val => setAttendeeProperty(attendeeInfo, 'interested_in_pre_call', val)}
                                error={attendeeErrors.interested_in_pre_call}
                            >
                                {`${attendeeInfo.is_primary_for_account ? 'I\'m' : 'They\'re'} interested in being introduced to other attendees on a
                                video call before the event`}
                            </Checkbox>

                            <Spacer size={INFO_BLURB_SPACE} />

                            <InfoBlurb>
                                {`We'd like to introduce people to some of their fellow
                                attendees so they can lay the foundations of
                                connection before arriving at ${festival.festival_name}.
                                If ${attendeeInfo.is_primary_for_account ? 'you' : 'this person'} would like
                                to be invited to online hangouts please check the box
                                below.`}&nbsp;
                                <b>If you check this box, your email address
                                ({store.accountInfo.state.result?.email_address}) may be
                                viewable by a limited number of attendees who also
                                choose to participate.</b>
                            </InfoBlurb>
                        </>}
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
