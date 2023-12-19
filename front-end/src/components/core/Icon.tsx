import React, { CSSProperties } from 'react'

import { observer } from '../../mobx/misc'

type Props = {
    name: MaterialIconName,
    style?: CSSProperties
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
    | 'calendar_today'
    | 'map'
    | 'info'
    | 'star'
    | 'star_filled'

export default observer((props: Props) => {
    const name = props.name.endsWith('_filled') ? props.name.substring(0, props.name.length - '_filled'.length) : props.name
    const groupStyle = props.name.endsWith('_filled') ? FILLED_STYLE : undefined

    return (
        <span className="material-symbols-outlined" style={{ ...groupStyle, ...props.style }}>
            {name}
        </span>
    )
})

const FILLED_STYLE: CSSProperties = {
    fontVariationSettings: '\'FILL\': 1'
}