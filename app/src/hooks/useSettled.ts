'use client'

import { useEffect, useState } from 'react'

const UNSETTLED = Symbol('unsettled')

// false until the frame after `key` first paints: state worked out before then should appear, not animate in
export default function useSettled(key: unknown = null): boolean {
    const [settled, setSettled] = useState<unknown>(UNSETTLED)
    useEffect(() => {
        const frame = requestAnimationFrame(() => setSettled(key))
        return () => cancelAnimationFrame(frame)
    }, [key])
    return Object.is(settled, key)
}
