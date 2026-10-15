'use client'

import { useState } from 'react'
import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import Modal from './Modal'

export default function InfoButton({
    name,
    info,
    disabled = false,
}: {
    name: string
    info: string | null
    disabled?: boolean
}) {
    const [open, setOpen] = useState(false)
    if (!info) return null
    return (
        <>
            <button
                type='button'
                className='info-button'
                disabled={disabled}
                aria-label={fill(t('common.moreInfo'), { name })}
                onClick={() => setOpen(true)}
            >
                <svg viewBox='0 0 20 20' aria-hidden='true'>
                    <circle
                        cx='10'
                        cy='10'
                        r='8.8'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='1.2'
                    />
                    <circle cx='10.65' cy='6.4' r='0.95' fill='currentColor' />
                    <path
                        d='M9.05 9.4 L10.05 9.1 L9.3 13.2 C9.18 13.9 9.55 14.2 10.3 13.75'
                        fill='none'
                        stroke='currentColor'
                        strokeWidth='1.2'
                        strokeLinecap='round'
                        strokeLinejoin='round'
                    />
                </svg>
            </button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title={name}>
                {() => <p className='preserve-lines'>{info}</p>}
            </Modal>
        </>
    )
}
