import React, { CSSProperties, FC, ReactNode, useCallback, useContext, useMemo, useState } from 'react'

import useElementEvent from '../../hooks/useElementEvent'
import { doNothing } from '../../utils'

type Props<TView> = {
    views: readonly { readonly name: TView, readonly content: ReactNode }[],
    currentView: TView,
}

function MultiView<TView>({ views, currentView }: Props<TView>) {
    const [refs, setRefs] = useState<Array<HTMLElement | null>>(views.map(() => null))
    const scrollHeights = useMemo(() => refs.map(ref => ref?.scrollTop ?? 0), [refs])

    const setRef = (index: number) => (ref: HTMLElement | null) => {
        const newRefs = [...refs]
        newRefs[index] = ref
        setRefs(newRefs)
    }

    return (
        <div className='multi-view' style={{
            '--view-count': views.length,
            '--current-view': views.findIndex(e => e.name === currentView)
        } as CSSProperties}>
            <div className='sliding-container'>
                {views.map(({ name, content }) =>
                    <Slide key={String(name)}>
                        {content}
                    </Slide>)}
            </div>
        </div>
    )
}

const Slide: FC<{ children: ReactNode }> = React.memo(({ children }) => {
    const [ref, setRef] = useState<HTMLElement | null>(null)
    const [scrollTop, setScrollTop] = useState(0)
    const [scrollHeight, setScrollHeight] = useState(0)
    const scrollToTop = useCallback(() =>
        ref?.scrollTo({ top: 0, behavior: 'smooth' })
    , [ref])

    useElementEvent(ref, 'scroll', (_, ref) => setScrollTop(ref.scrollTop))
    useElementEvent(ref, 'resize', (_, ref) => setScrollHeight(ref.scrollHeight))

    const contextValue = useMemo(() => ({ scrollTop, scrollHeight, scrollToTop } as const), [scrollHeight, scrollToTop, scrollTop])

    return (
        <div className='slide' ref={setRef}>
            <SlideScrollContext.Provider value={contextValue}>
                {children}
            </SlideScrollContext.Provider>
        </div>
    )
})

const SlideScrollContext = React.createContext({ scrollTop: 0, scrollHeight: 0, scrollToTop: doNothing })

export function useSlideScroll() {
    return useContext(SlideScrollContext)
}

export default React.memo(MultiView) as typeof MultiView