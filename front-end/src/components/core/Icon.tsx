import React, { CSSProperties } from 'react'
import { observer } from 'mobx-react-lite'

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

export default observer(({ name: _name, style }: Props) => {
    const name = _name.endsWith('_filled') ? _name.substring(0, _name.length - '_filled'.length) : _name
    const groupStyle = _name.endsWith('_filled') ? FILLED_STYLE : undefined

    return (
        <span className="material-symbols-outlined" style={{ ...groupStyle, ...style }}>
            {name}
        </span>
    )
})

const FILLED_STYLE: CSSProperties = {
    fontVariationSettings: '\'FILL\': 1'
}