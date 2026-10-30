'use client'

import { useRouter } from 'next/navigation'
import { type RefObject, useEffect } from 'react'
import { prefetchPage } from '@/lib/prefetch'

const callbacks = new WeakMap<Element, () => void>()
let observer: IntersectionObserver | undefined

function watch(el: Element, onVisible: () => void) {
    observer ??= new IntersectionObserver((entries) => {
        for (const entry of entries) {
            if (!entry.isIntersecting) continue
            callbacks.get(entry.target)?.()
            observer?.unobserve(entry.target)
        }
    })
    callbacks.set(el, onVisible)
    observer.observe(el)
    return () => observer?.unobserve(el)
}

export default function usePrefetchWhenVisible(ref: RefObject<Element | null>, href: string) {
    const router = useRouter()
    useEffect(() => {
        const el = ref.current
        return el ? watch(el, () => prefetchPage(router, href)) : undefined
    }, [href, ref, router])
}
