import React from 'react'
import { observer } from 'mobx-react-lite'
import { TABLE_ROWS, Tables } from '../../../back-end/db-types'
import Input from './core/Input'
import Spacer from './core/Spacer'
import Checkbox from './core/Checkbox'
import InfoBlurb from './core/InfoBlurb'
import RadioGroup from './core/RadioGroup'
import Store from '../Store'
import { Form, fieldToProps } from '../mobx/form'
import { AttendeeInfo } from '../../../back-end/common/types'

type Props = {
    attendeeInfo: Form<AttendeeInfo>,
    isChild: boolean,
    isAccountHolder: boolean
}

export default observer(({ attendeeInfo, isChild, isAccountHolder }: Props) => {

    return (
        <>
            {attendeeInfo.fields.name.value &&
                <div className='attendee-info-form-sticky-header'>
                    {`${attendeeInfo.fields.name.value}'s info`}
                </div>}

            <Input
                label='Name'
                {...fieldToProps(attendeeInfo.fields.name)}
            />

            <Spacer size={12} />

            <InfoBlurb>
                {`Whatever name you'd like to go by (in comms, etc). Can be
                real or twitter display name or whatever. Does not need to be
                your legal name!`}
            </InfoBlurb>

            <Spacer size={24} />

            <Input 
                label='Discord handle (optional)'
                placeholder='gptbrooke' 
                {...fieldToProps(attendeeInfo.fields.discord_handle)}
                value={attendeeInfo.fields.discord_handle.value ?? ''}
            />

            <Spacer size={12} />

            <InfoBlurb>
                {`If you provide your Discord handle, we can give you attendee 
                status on the Vibecamp server and add you to attendee-specific
                channels`}
            </InfoBlurb>

            <Spacer size={24} />

            <Input 
                label='Twitter handle (optional)' 
                placeholder='@gptbrooke' 
                {...fieldToProps(attendeeInfo.fields.twitter_handle)}
                value={attendeeInfo.fields.twitter_handle.value ?? ''}
            />

            <Spacer size={12} />

            <InfoBlurb>
                {'Username, not display name!'}
            </InfoBlurb>

            <Spacer size={24} />

            <RadioGroup
                label={isAccountHolder ? 'I am...' : 'This person is...'}
                options={isChild ? CHILD_AGE_GROUP_OPTIONS : ADULT_AGE_GROUP_OPTIONS}
                {...fieldToProps(attendeeInfo.fields.age_group)}
            />

            <Spacer size={12} />

            <InfoBlurb>
                {Store.festival.state.result != null
                    ? `This age should be at the time of ${Store.festival.state.result.festival_name} (${Store.festival.state.result.start_date.toDateString()} - ${Store.festival.state.result.end_date.toDateString()})`
                    : 'This age should be at the time of the festival'}
            </InfoBlurb>

            {attendeeInfo.fields.age_group.value === 'UNDER_2' &&
                <>
                    <Spacer size={8} />

                    <InfoBlurb>
                        {'Children under 2 don\'t need a ticket!'}
                    </InfoBlurb>
                </>}

            <Spacer size={24} />

            <RadioGroup
                label='Dietary restriction:'
                options={DIET_OPTIONS}
                {...fieldToProps(attendeeInfo.fields.special_diet)}
            />

            <Spacer size={24} />

            <div>
                Allergies:
            </div>

            {ALLERGIES.map(allergy =>
                <React.Fragment key={allergy}>
                    <Spacer size={8} />

                    <Checkbox {...fieldToProps(attendeeInfo.fields[`has_allergy_${allergy}`])} key={allergy}>
                        {capitalize(snakeCaseToSpaces(allergy))}
                    </Checkbox>
                </React.Fragment>)}

            <Spacer size={24} />

            <RadioGroup
                label="I'm interested in volunteering as a..."
                options={VOLUNTEER_OPTIONS}
                {...fieldToProps(attendeeInfo.fields.interested_in_volunteering_as)}
            />

            <Spacer size={12} />

            <InfoBlurb>
                Volunteers for vibeclipse fall into two major categories. Fae, and general volunteers.
                <Spacer size={6} />
                Fae are part of our safety team, which is responsible for psychological, social, and physical safety during the event.
                <Spacer size={6} />
                General volunteers are our muscle. They will be tasked with setup, breakdown, and general physical tasks.
                <Spacer size={6} />
                If you indicate you are willing to volunteer we will reach out to you with more details via email.
            </InfoBlurb>

            <Spacer size={24} />

            <Checkbox {...fieldToProps(attendeeInfo.fields.interested_in_pre_call)}>
                {`I'm interested in being introduced to other attendees on a
                video call before the event`}
            </Checkbox>

            <Spacer size={12} />

            <InfoBlurb>
                {`We're all about building community, and we'd like to do that
                even when we aren't renting out a campground. Would you like
                to participate in group videocalls or other online gatherings?`}
            </InfoBlurb>

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

const DIET_OPTIONS = [
    { value: null, label: 'No restrictions' },
    ...TABLE_ROWS.diet
        .map(diet => ({
            value: diet.diet_id,
            label: diet.description
        }))
]

const ALLERGIES = [
    'milk',
    'eggs',
    'fish',
    'shellfish',
    'tree_nuts',
    'peanuts',
    'wheat',
    'soy'
] as const

const capitalize = (str: string) => str[0]?.toUpperCase() + str.substring(1)
const snakeCaseToSpaces = (str: string) => str.replaceAll('_', ' ')