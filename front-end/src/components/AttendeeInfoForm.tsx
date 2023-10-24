import React from 'react'
import { observer } from 'mobx-react-lite'
import { TABLE_ROWS, Tables } from '../../../back-end/db-types'
import Input from './core/Input'
import Spacer from './core/Spacer'
import Checkbox from './core/Checkbox'
import InfoBlurb from './core/InfoBlurb'
import RadioGroup from './core/RadioGroup'
import Store from '../Store'

type Props = {
    attendeeInfo: AttendeeInfo,
    isChild: boolean,
    isAccountHolder: boolean
}

export type AttendeeInfo = Omit<Tables['attendee'], 'attendee_id' | 'notes'>

export default observer(({ attendeeInfo, isChild, isAccountHolder }: Props) => {

    return (
        <>
            <Input label='Name' value={attendeeInfo.name ?? ''} onChange={val => attendeeInfo.name = val} />

            <Spacer size={8} />

            <InfoBlurb>
                {`Whatever name you'd like to go by (in comms, etc). Can be
                real or twitter display name or whatever. Does not need to be
                your legal name!`}
            </InfoBlurb>

            <Spacer size={24} />

            <Input label='Discord handle (optional)' placeholder='gptbrooke' value={attendeeInfo.discord_handle ?? ''} onChange={val => attendeeInfo.discord_handle = val} />

            <Spacer size={24} />

            <Input label='Twitter handle (optional)' placeholder='@gptbrooke' value={attendeeInfo.twitter_handle ?? ''} onChange={val => attendeeInfo.twitter_handle = val} />

            <Spacer size={8} />

            <InfoBlurb>
                {'Username, not display name!'}
            </InfoBlurb>

            <Spacer size={24} />

            <RadioGroup
                label={isAccountHolder ? 'I am...' : 'This person is...'}
                value={attendeeInfo.age_group}
                onChange={val => attendeeInfo.age_group = val}
                options={isChild ? CHILD_AGE_GROUP_OPTIONS : ADULT_AGE_GROUP_OPTIONS}
            />

            <Spacer size={8} />

            <InfoBlurb>
                {Store.festival.state.result != null
                    ? `This age should be at the time of ${Store.festival.state.result.festival_name} (${Store.festival.state.result.start_date.toDateString()} - ${Store.festival.state.result.end_date.toDateString()})`
                    : 'This age should be at the time of the festival'}
            </InfoBlurb>

            {attendeeInfo.age_group === 'UNDER_2' &&
                <>
                    <Spacer size={8} />

                    <InfoBlurb>
                        {'Children under 2 don\'t need a ticket!'}
                    </InfoBlurb>
                </>}

            <Spacer size={24} />

            <Input label='Dietary restrictions' placeholder='(none)' multiline value={attendeeInfo.dietary_restrictions} onChange={val => attendeeInfo.dietary_restrictions = val} />

            <Spacer size={8} />

            <InfoBlurb>
                {`Including allergies, intolerances, and religious/ethical
                restrictions`}
            </InfoBlurb>

            <Spacer size={24} />

            <RadioGroup
                label="I'm interested in volunteering as a..."
                value={attendeeInfo.interested_in_volunteering_as}
                onChange={val => attendeeInfo.interested_in_volunteering_as = val}
                options={VOLUNTEER_OPTIONS}
            />

            <Spacer size={8} />

            <InfoBlurb>
                Volunteers for vibeclipse fall into two major categories. Fae, and general volunteers.
                <Spacer size={4} />
                Fae are part of our safety team, which is responsible for psychological, social, and physical safety during the event.
                <Spacer size={4} />
                General volunteers are our muscle. They will be tasked with setup, breakdown, and general physical tasks.
                <Spacer size={4} />
                If you indicate you are willing to volunteer we will reach out to you with more details via email.
            </InfoBlurb>

            <Spacer size={24} />

            <InfoBlurb>
                {`We're all about building community, and we'd like to do that
                even when we aren't renting out a campground. Would you like
                to participate in group videocalls or other online gatherings?`}
            </InfoBlurb>

            <Spacer size={8} />

            <Checkbox value={attendeeInfo.interested_in_pre_call} onChange={val => attendeeInfo.interested_in_pre_call = val}>
                {`I'm interested in being introduced to other attendees on a
                video call before the event`}
            </Checkbox>

        </>
    )
})

const ADULT_AGE_GROUP_OPTIONS = TABLE_ROWS.age_group
    .filter(g => !g.is_child)
    .map(({ age_group, description }) => ({
        value: age_group,
        label: description
    }))

const CHILD_AGE_GROUP_OPTIONS = TABLE_ROWS.age_group
    .filter(g => g.is_child)
    .map(({ age_group, description }) => ({
        value: age_group,
        label: description
    }))

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