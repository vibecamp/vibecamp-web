'use client'

import { type MouseEvent, type ReactNode, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { t } from '@/copy/t'
import Icon from './Icon'

type Props = {
    isOpen: boolean
    onClose?: () => void
    title?: string
    side?: 'left' | 'right'
    children: () => ReactNode
}

const CLOSE_MS = 260

const isOutside = (event: MouseEvent<HTMLDialogElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return (
        event.target === event.currentTarget &&
        (event.clientX < rect.left ||
            event.clientX > rect.right ||
            event.clientY < rect.top ||
            event.clientY > rect.bottom)
    )
}

const FOCUSABLE =
    'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex="0"]'

export default function Modal({ isOpen, onClose, title, side, children }: Props) {
    const ref = useRef<HTMLDialogElement>(null)
    const [mounted, setMounted] = useState(false)
    const [shown, setShown] = useState(isOpen)
    const content = useRef<ReactNode>(null)
    const pressedOutside = useRef(false)
    useEffect(() => setMounted(true), [])

    useEffect(() => {
        if (isOpen) return
        const timer = setTimeout(() => setShown(false), CLOSE_MS)
        return () => clearTimeout(timer)
    }, [isOpen])

    if (isOpen && !shown) setShown(true)
    if (isOpen) content.current = children()

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
                pressedOutside.current = isOutside(event)
            }}
            onClick={(event) => {
                if (pressedOutside.current && isOutside(event)) onClose?.()
            }}
        >
            {!drawer && (title || onClose) && (
                <div className='sheet-header'>
                    <h2>{title}</h2>
                    {onClose && (
                        <button
                            type='button'
                            className='icon-button'
                            aria-label={t('common.close')}
                            onClick={onClose}
                        >
                            <Icon name='close' />
                        </button>
                    )}
                </div>
            )}
            {shown && content.current}
        </dialog>,
        document.body,
    )
}
