import React from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    name: MaterialIconName
}

/**
 * There are lots more of these available, feel free to add to this list
 *
 * Find more here: https://fonts.google.com/icons
 */
type MaterialIconName =
    | 'calendar_add_on'
    | 'edit_calendar'
    | 'rsvp'
    | 'schedule'
    | 'location_on'
    | 'person'
    | 'open_in_new'
    | 'arrow_back_ios'
    | 'check'
    | 'content_copy'
    | 'add'
    | 'confirmation_number'

export default observer(({ name }: Props) => {
    return <span className="material-symbols-outlined">{name}</span>
})