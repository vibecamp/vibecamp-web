import type { CSSProperties } from 'react'

type Props = {
    name: MaterialIconName
    fill?: number
    style?: CSSProperties
}

export type MaterialIconName =
    | 'menu'
    | 'filter_list'
    | 'calendar_add_on'
    | 'edit_calendar'
    | 'schedule'
    | 'location_on'
    | 'person'
    | 'open_in_new'
    | 'arrow_back'
    | 'add'
    | 'confirmation_number'
    | 'calendar_today'
    | 'info'
    | 'close'
    | 'search'
    | 'share'
    | 'remove'
    | 'mail'
    | 'gavel'
    | 'chevron_right'
    | 'badge'
    | 'add_shopping_cart'
    | 'shopping_bag'
    | 'hourglass_top'
    | 'error'
    | 'check_circle'
    | 'logout'
    | 'warning'
    | 'bookmark'

export default function Icon({ fill, style: _style, name }: Props) {
    const style = {
        fontVariationSettings: `'FILL' ${fill}, 'wght' 400, 'GRAD' 0, 'opsz' 24`,
        transition: 'font-variation-settings 0.1s ease-out',
        ..._style,
    }

    return (
        <span className='icon material-symbols-outlined' style={style}>
            {name}
        </span>
    )
}
