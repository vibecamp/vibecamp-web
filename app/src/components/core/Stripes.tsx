import { classNames } from '@/lib/ui'

export default function Stripes({ position }: { position: 'top-left' | 'bottom-right' }) {
    return (
        <div className='stripes-clip'>
            <div className={classNames('stripes', position)}>
                <div />
                <div />
                <div />
            </div>
        </div>
    )
}
