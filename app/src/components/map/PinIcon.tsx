import type { CSSProperties } from 'react'
import { PIN_DOT_RADIUS, PIN_HEAD_Y, PIN_HEIGHT, PIN_PATH, PIN_WIDTH } from './pin'

export default function PinIcon({ color }: { color?: string }) {
    return (
        <svg
            className='map-pin'
            viewBox={`0 0 ${PIN_WIDTH} ${PIN_HEIGHT}`}
            aria-hidden
            style={color ? ({ '--pin': color } as CSSProperties) : undefined}
        >
            <path d={PIN_PATH} />
            <circle cx={PIN_WIDTH / 2} cy={PIN_HEAD_Y} r={PIN_DOT_RADIUS} />
        </svg>
    )
}
