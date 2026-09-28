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

const ToastContext = createContext<(text: string) => void>(() => {})

export function ToastProvider({ children }: { children: ReactNode }) {
    const [text, setText] = useState<string | null>(null)
    const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)

    const show = useCallback((next: string) => {
        clearTimeout(timer.current)
        setText(next)
        timer.current = setTimeout(() => setText(null), 2500)
    }, [])

    const value = useMemo(() => show, [show])

    return (
        <ToastContext.Provider value={value}>
            {children}
            {text && <div className='toast'>{text}</div>}
        </ToastContext.Provider>
    )
}

export function useToast() {
    return useContext(ToastContext)
}
