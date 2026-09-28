'use client'

import { useState } from 'react'
import Modal from '../core/Modal'

export default function AdditionalInfo({ name, info }: { name: string; info: string | null }) {
    const [open, setOpen] = useState(false)
    if (!info) return null
    return (
        <>
            <button type='button' className='info-button' onClick={() => setOpen(true)}>
                <span>{String.fromCharCode(105)}</span>
            </button>
            <Modal isOpen={open} onClose={() => setOpen(false)} title={name}>
                {() => <p className='preserve-lines'>{info}</p>}
            </Modal>
        </>
    )
}
