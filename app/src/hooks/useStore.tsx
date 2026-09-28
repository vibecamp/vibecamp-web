'use client'

import {
    createContext,
    type ReactNode,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react'
import type { VibeJWTPayload } from '@/contract/misc'
import type { Routes } from '@/contract/route-types'
import type { Tables } from '@/db/types'
import dayjs, { type Dayjs } from '@/lib/dayjs'
import { vibefetch } from '@/lib/fetch'
import { decodeJwtPayload } from '@/lib/jwt'
import { jsonParse } from '@/lib/misc'
import { usePromise } from './usePromise'

const JWT_STORAGE_KEY = 'jwt'

export type DayjsFestival = Omit<Tables['festival'], 'start_date' | 'end_date'> & {
    start_date: Dayjs
    end_date: Dayjs
}

type EventsResponseItem = Routes['/events']['response']['events'][number]

export type DayjsEvent = Omit<EventsResponseItem, 'start_datetime' | 'end_datetime'> & {
    start_datetime: Dayjs
    end_datetime: Dayjs | null
}

function readStoredJwt(): string | undefined {
    const stored = localStorage.getItem(JWT_STORAGE_KEY)
    if (stored == null) {
        return undefined
    }
    const parsed = jsonParse(stored)
    return typeof parsed === 'string' ? parsed : undefined
}

function useNewStoreInstance() {
    const [jwt, setJwtState] = useState<string | undefined>(undefined)
    const [ready, setReady] = useState(false)

    useEffect(() => {
        setJwtState(readStoredJwt())
        setReady(true)
    }, [])

    const setJwt = useCallback((next: string | undefined) => {
        if (next != null) {
            localStorage.setItem(JWT_STORAGE_KEY, JSON.stringify(next))
        } else {
            localStorage.removeItem(JWT_STORAGE_KEY)
        }
        setJwtState(next)
    }, [])

    const logOut = useCallback(() => setJwt(undefined), [setJwt])

    const loggedIn = jwt != null

    const jwtPayload: VibeJWTPayload | undefined = useMemo(
        () => (jwt != null ? decodeJwtPayload(jwt) : undefined),
        [jwt],
    )

    const catalog = usePromise(
        async () =>
            jwt ? (await vibefetch(jwt, '/purchase/catalog', 'get', undefined)).body : null,
        [jwt],
    )

    const reference = usePromise(
        () => vibefetch(null, '/reference', 'get', undefined).then((res) => res.body),
        [],
    )

    const festivals = useMemo(
        () =>
            reference.state.result?.festivals
                .map(
                    (f): DayjsFestival => ({
                        ...f,
                        start_date: dayjs.utc(f.start_date),
                        end_date: dayjs.utc(f.end_date),
                    }),
                )
                .sort((a, b) => a.start_date.valueOf() - b.start_date.valueOf()),
        [reference.state.result],
    )

    const eventSites = reference.state.result?.event_sites
    const ageRanges = reference.state.result?.age_ranges

    const allEvents = usePromise(
        () =>
            vibefetch(null, '/events', 'get', undefined)
                .then((res) => res.body?.events)
                .then((events) =>
                    events?.map(
                        (e): DayjsEvent => ({
                            ...e,
                            start_datetime: dayjs.utc(e.start_datetime),
                            end_datetime: e.end_datetime ? dayjs.utc(e.end_datetime) : null,
                        }),
                    ),
                ),
        [],
    )

    const bookmarks = usePromise(async () => {
        if (jwt != null) {
            return (await vibefetch(jwt, '/event/bookmarks', 'get', undefined)).body
        }
        return null
    }, [jwt])

    const accountInfo = usePromise(async () => {
        if (jwt != null) {
            const res = await vibefetch(jwt, '/account', 'get', undefined)

            if (res.status === 401) {
                setJwt(undefined)
            }

            return res.body
        }
        return null
    }, [jwt, setJwt])

    return useMemo(
        () => ({
            jwt,
            setJwt,
            logOut,
            loggedIn,

            ready,
            jwtPayload,
            catalog,
            festivals,
            eventSites,
            ageRanges,
            allEvents,
            bookmarks,
            accountInfo,
        }),
        [
            accountInfo,
            ageRanges,
            allEvents,
            bookmarks,
            eventSites,
            festivals,
            jwt,
            jwtPayload,
            logOut,
            loggedIn,
            catalog,
            ready,
            setJwt,
        ],
    )
}

type Store = ReturnType<typeof useNewStoreInstance>

const StoreContext = createContext<Store | undefined>(undefined)

export function StoreProvider({ children }: { children: ReactNode }) {
    const store = useNewStoreInstance()
    return <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
}

export function useStore(): Store {
    const store = useContext(StoreContext)
    if (store == null) {
        throw new Error('useStore() must be used inside <StoreProvider>')
    }
    return store
}
