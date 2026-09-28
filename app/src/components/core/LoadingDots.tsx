import type { CSSProperties } from 'react'

type Props = {
    size: number
    color: string
}

export default function LoadingDots({ size, color }: Props) {
    return (
        <div
            className='loading-dots'
            style={{ '--size': `${size}px`, '--dot-color': color } as CSSProperties}
        >
            <div className='spinner'>
                <div />
                <div />
                <div />
                <div />
            </div>
        </div>
    )
}
