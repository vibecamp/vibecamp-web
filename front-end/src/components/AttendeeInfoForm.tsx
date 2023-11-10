import React from 'react'
import { observer } from 'mobx-react-lite'
import { TABLE_ROWS } from '../../../back-end/types/db-types'
import Input from './core/Input'
import Spacer from './core/Spacer'
import Checkbox from './core/Checkbox'
import InfoBlurb from './core/InfoBlurb'
import RadioGroup from './core/RadioGroup'
import Store from '../Store'
import { Form, fieldToProps } from '../mobx/form'
import { AttendeeInfo } from '../../../back-end/types/misc'
import { prettyDate } from '../utils'

type Props = {
    attendeeInfo: Form<AttendeeInfo>,
    isAccountHolder: boolean,
    isChild: boolean
}

const INFO_BLURB_SPACE = 12
const FIELD_SPACE = 24

export default observer(({ attendeeInfo, isAccountHolder, isChild }: Props) => {

    return (
        <>
            {attendeeInfo.fields.name.value &&
                <div className='attendee-info-form-sticky-header'>
                    {`${attendeeInfo.fields.name.value}'s info`}
                </div>}

            <Input
                label='Attendee name'
                placeholder='Brooke'
                {...fieldToProps(attendeeInfo.fields.name)}
            />

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {`Whatever name ${isAccountHolder ? 'you\'d' : 'this person would'} like to go by (in comms, etc). Can be
                real or twitter display name or whatever. Does not need to be
                ${isAccountHolder ? 'your' : 'their'} legal name!`}
            </InfoBlurb>

            <Spacer size={FIELD_SPACE} />

            <Input 
                label='Discord handle (optional)'
                placeholder='gptbrooke' 
                {...fieldToProps(attendeeInfo.fields.discord_handle)}
                value={attendeeInfo.fields.discord_handle.value ?? ''}
            />

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {`If ${isAccountHolder ? 'you' : 'they'} provide ${isAccountHolder ? 'your' : 'their'} Discord handle, we can give ${isAccountHolder ? 'you' : 'them'} attendee 
                status on the Vibecamp server and add ${isAccountHolder ? 'you' : 'them'} to attendee-specific
                channels`}
            </InfoBlurb>

            <Spacer size={FIELD_SPACE} />

            <Input 
                label='Twitter handle (optional)' 
                placeholder='@gptbrooke' 
                {...fieldToProps(attendeeInfo.fields.twitter_handle)}
                value={attendeeInfo.fields.twitter_handle.value ?? ''}
            />

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {'Username, not display name!'}
            </InfoBlurb>

            <Spacer size={FIELD_SPACE} />

            <RadioGroup
                label={isAccountHolder ? 'I am...' : 'This person is...'}
                options={isChild ? CHILD_AGE_GROUP_OPTIONS : ADULT_AGE_GROUP_OPTIONS}
                {...fieldToProps(attendeeInfo.fields.age_group)}
            />

            {attendeeInfo.fields.age_group.value === 'UNDER_2' &&
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

            {/* <Spacer size={FIELD_SPACE} />

            <RadioGroup
                label='Dietary restriction:'
                options={DIET_OPTIONS}
                {...fieldToProps(attendeeInfo.fields.diet)}
            />

            <Spacer size={INFO_BLURB_SPACE} />

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

            <Spacer size={INFO_BLURB_SPACE} />

            <InfoBlurb>
                {`Please indicate your dietary preferences, and we will do our
                best to accommodate everyone. We will message what diets we are
                able to accommodate ahead of the event, so please be on the
                lookout for that announcement. In the case that we can't
                accommodate your dietary preference you will need to bring
                your own food.`}
            </InfoBlurb> */}

            {!isChild &&
                <>
                    <Spacer size={FIELD_SPACE} />
    
                    <RadioGroup
                        label={`${isAccountHolder ? 'I\'m' : 'They\'re'} interested in volunteering as a...`}
                        options={VOLUNTEER_OPTIONS}
                        {...fieldToProps(attendeeInfo.fields.interested_in_volunteering_as)}
                    />
    
                    <Spacer size={INFO_BLURB_SPACE} />
                
                    <InfoBlurb>
                        Volunteers for vibeclipse fall into two major categories. Fae, and general volunteers.
                        <Spacer size={6} />
                        Fae are part of our safety team, which is responsible for psychological, social, and physical safety during the event.
                        <Spacer size={6} />
                        General volunteers are our muscle. They will be tasked with setup, breakdown, and general physical tasks.
                        <Spacer size={6} />
                        {isAccountHolder
                            ? 'If you indicate you are willing to volunteer we will reach out to you with more details via email.'
                            : 'If this person indicates they are willing to volunteer we will reach out to you with more details via email.'}
                        
                    </InfoBlurb>
                    
                    <Spacer size={FIELD_SPACE} />

                    <Checkbox {...fieldToProps(attendeeInfo.fields.interested_in_pre_call)}>
                        {`${isAccountHolder ? 'I\'m' : 'They\'re'} interested in being introduced to other attendees on a
                        video call before the event`}
                    </Checkbox>
                    
                    <Spacer size={INFO_BLURB_SPACE} />
                
                    <InfoBlurb>
                        {`We're all about building community, and we'd like to do that
                        even when we aren't renting out a campground. Would ${isAccountHolder ? 'you' : 'this person'} like
                        to participate in group videocalls or other online gatherings?`}
                    </InfoBlurb>
                </>}
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

// const DIET_OPTIONS = [
//     { value: null, label: 'No restrictions' },
//     ...TABLE_ROWS.diet
//         .map(diet => ({
//             value: diet.diet_id,
//             label: diet.description
//         }))
// ]

// const ALLERGIES = [
//     'milk',
//     'eggs',
//     'fish',
//     'shellfish',
//     'tree_nuts',
//     'peanuts',
//     'wheat',
//     'soy'
// ] as const

// const capitalize = (str: string) => str[0]?.toUpperCase() + str.substring(1)
// const snakeCaseToSpaces = (str: string) => str.replaceAll('_', ' ')