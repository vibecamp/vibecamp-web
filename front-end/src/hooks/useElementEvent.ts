import { useEffect } from 'react'

import { Maybe } from '../../../back-end/types/misc'

export default function useElementEvent<E extends HTMLElement, K extends keyof HTMLElementEventMap>(ref: Maybe<E>, type: K, listener: (this: void, ev: HTMLElementEventMap[K], ref: E) => unknown) {
    useEffect(() => {
        if (ref) {
            const handle = (e: HTMLElementEventMap[K]) => listener(e, ref)
            ref.addEventListener(type, handle)
            return () => ref.removeEventListener(type, handle)
        }
    }, [listener, ref, type])
}