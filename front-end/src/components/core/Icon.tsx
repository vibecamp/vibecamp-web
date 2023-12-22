import React, { CSSProperties } from 'react'

import { observer } from '../../mobx/misc'

type Props = {
    name: MaterialIconName,
    fill?: number,
    style?: CSSProperties
}

/**
 * There are lots more of these available, feel free to add to this list
 *
 * Find more here: https://fonts.google.com/icons
 */
export type MaterialIconName =
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
    | 'calendar_today'
    | 'map'
    | 'info'
    | 'star'

export default observer((props: Props) => {
    const style = {
        fontVariationSettings: `'FILL' ${props.fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        transition: 'font-variation-settings 0.1s ease-out',
        ...props.style
    }

    return (
        <span className="icon material-symbols-outlined" style={style}>
            {props.name}
        </span>
    )
})
