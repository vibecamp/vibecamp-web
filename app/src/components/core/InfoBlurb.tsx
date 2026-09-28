import type { ReactNode } from 'react'

type Props = {
    children: ReactNode
}

export default function InfoBlurb({ children }: Props) {
    return <div className='info-blurb'>{children}</div>
}
