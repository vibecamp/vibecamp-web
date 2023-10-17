import React from 'react'
import { observer } from 'mobx-react-lite'
import { Tables } from '../../../back-end/db-types'
import Input from './core/Input'
import Spacer from './core/Spacer'
import Checkbox from './core/Checkbox'

type Props = {
    attendeeInfo: Tables['attendee']
}

export default observer(({ attendeeInfo }: Props) => {

    return (
        <>
            <Input label='Name' value={attendeeInfo.name ?? ''} onChange={val => attendeeInfo.name = val} />

            <Spacer size={8} />

            <Input label='Discord handle (optional)' placeholder='(none)' value={attendeeInfo.discord_handle ?? ''} onChange={val => attendeeInfo.discord_handle = val} />

            <Spacer size={8} />

            {/* TODO: Age group */}
            {/* <RowSelect options={}></RowSelect> */}

            {/* <Spacer size={8} /> */}

            <Input label='Dietary restrictions' placeholder='(none)' multiline value={attendeeInfo.dietary_restrictions} onChange={val => attendeeInfo.dietary_restrictions = val} />

            <Spacer size={8} />

            <Checkbox value={attendeeInfo.interested_in_volunteering} onChange={val => attendeeInfo.interested_in_volunteering = val}>
                Interested in being a volunteer at this event
            </Checkbox>

            <Spacer size={8} />

            <Checkbox value={attendeeInfo.interested_in_pre_call} onChange={val => attendeeInfo.interested_in_pre_call = val}>
                Interested in being introduced to other attendees on a video call before the event
            </Checkbox>

        </>
    )
})