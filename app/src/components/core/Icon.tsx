import type { CSSProperties } from 'react'
import { ICON_PATHS, ICON_VIEWBOX } from './icon-paths'

export type MaterialIconName = keyof typeof ICON_PATHS

type Props = {
    name: MaterialIconName
    fill?: number
    style?: CSSProperties
}

export default function Icon({ fill = 0, style, name }: Props) {
    const paths = ICON_PATHS[name]
    return (
        <svg className='icon' viewBox={ICON_VIEWBOX} aria-hidden style={style}>
            {typeof paths === 'string' ? (
                <path d={paths} />
            ) : (
                <>
                    <path d={paths[0]} style={{ opacity: 1 - fill }} />
                    <path d={paths[1]} style={{ opacity: fill }} />
                </>
            )}
        </svg>
    )
}
