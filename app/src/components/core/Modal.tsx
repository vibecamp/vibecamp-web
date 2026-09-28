'use client'

import { type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import Icon from './Icon'

type Props = {
    isOpen: boolean
    onClose?: () => void
    title?: string
    side?: 'left' | 'right'
    children: () => ReactNode
}

const FOCUSABLE =
    'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'

export default function Modal({ isOpen, onClose, title, side, children }: Props) {
    const ref = useRef<HTMLDialogElement>(null)
    const [mounted, setMounted] = useState(false)
    useEffect(() => setMounted(true), [])

    useEffect(() => {
        if (!mounted || !isOpen) return
        const dialog = ref.current
        if (!dialog) return
        const previous = document.activeElement
        dialog.showModal()
        return () => {
            dialog.close()
            if (previous instanceof HTMLElement) previous.focus()
        }
    }, [isOpen, mounted])

    if (!mounted) return null

    const drawer = side === 'left'

    return createPortal(
        <dialog
            ref={ref}
            className={drawer ? 'drawer' : 'sheet'}
            onKeyDown={(event) => {
                if (event.key !== 'Tab') return
                const controls = [
                    ...event.currentTarget.querySelectorAll<HTMLElement>(FOCUSABLE),
                ].filter((element) => element.getClientRects().length > 0)
                const first = controls[0]
                const last = controls.at(-1)
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault()
                    last?.focus()
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault()
                    first?.focus()
                }
            }}
            onCancel={(event) => {
                event.preventDefault()
                onClose?.()
            }}
            onPointerDown={(event) => {
                const rect = event.currentTarget.getBoundingClientRect()
                if (
                    event.target === event.currentTarget &&
                    (event.clientX < rect.left ||
                        event.clientX > rect.right ||
                        event.clientY < rect.top ||
                        event.clientY > rect.bottom)
                )
                    onClose?.()
            }}
        >
            {!drawer && (title || onClose) && (
                <div className='sheet-header'>
                    <h2>{title}</h2>
                    {onClose && (
                        <button type='button' className='icon-button' onClick={onClose}>
                            <Icon name='close' />
                        </button>
                    )}
                </div>
            )}
            {isOpen && children()}
        </dialog>,
        document.body,
    )
}
