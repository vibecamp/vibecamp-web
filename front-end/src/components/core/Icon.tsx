import React, { CSSProperties } from 'react'

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
    | 'arrow_back'
    | 'check'
    | 'content_copy'
    | 'add'
    | 'confirmation_number'
    | 'calendar_today'
    | 'map'
    | 'info'
    | 'star'
    | 'videocam'

export default React.memo(({ fill, style: _style, name }: Props) => {
    const style = {
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        transition: 'font-variation-settings 0.1s ease-out',
        ..._style
    }

    return (
        <span className="icon material-symbols-outlined" style={style}>
            {name}
        </span>
    )
})
