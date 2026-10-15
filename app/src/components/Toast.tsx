'use client'

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react'

import { classNames } from '@/lib/ui'

const ToastContext = createContext<(text: string) => void>(() => {})

const LEAVE_MS = 160

export function ToastProvider({ children }: { children: ReactNode }) {
    const [text, setText] = useState<string | null>(null)
    const [leaving, setLeaving] = useState(false)
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const show = useCallback((next: string) => {
        clearTimeout(timer.current)
        setLeaving(false)
        setText(next)
        timer.current = setTimeout(() => {
            setLeaving(true)
            timer.current = setTimeout(() => setText(null), LEAVE_MS)
        }, 2500)
    }, [])

    const value = useMemo(() => show, [show])

    return (
        <ToastContext.Provider value={value}>
            {children}
            {text && <div className={classNames('toast', leaving && 'leaving')}>{text}</div>}
        </ToastContext.Provider>
    )
}

export function useToast() {
    return useContext(ToastContext)
}
