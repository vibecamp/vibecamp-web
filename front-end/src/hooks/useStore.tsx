import dayjs, { Dayjs } from 'dayjs'
import jwtDecode from 'jwt-decode'
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { Tables } from '../../../back-end/types/db-types'
import { VibeJWTPayload } from '../../../back-end/types/misc'
import { ONE_YEAR_MS } from '../../../back-end/utils/constants'
import { given, objectEntries, objectFromEntries } from '../../../back-end/utils/misc'
import { jsonParse } from '../utils'
import { vibefetch } from '../vibefetch'
import { usePromise } from './usePromise'

const JWT_KEY = 'jwt'

export function useNewStoreInstance() {
    const [jwt, setJwt] = useState<string | undefined>(
        given(localStorage.getItem(JWT_KEY), jwt => {
            const parsed = jsonParse(jwt)

            if (typeof parsed === 'string') {
                return parsed
            }
        }) ?? undefined
    )

    useEffect(() => {
        localStorage.setItem(JWT_KEY, JSON.stringify(jwt))
    }, [jwt])

    const logOut = useCallback(() => setJwt(undefined), [])

    const loggedIn = jwt != null

    const jwtPayload = useMemo(() => {
        if (jwt != null) {
            try {
                return jwtDecode<VibeJWTPayload>(jwt)
            } catch {
            }
        }
    }, [jwt])

    const purchaseTypes = usePromise(() =>
        vibefetch(null, '/tables/purchase_type', 'get', undefined)
            .then(res => res.body)
    , [])

    const discounts = usePromise(() =>
        vibefetch(null, '/tables/discount', 'get', undefined)
            .then(res => res.body)
    , [])

    const festivals = usePromise(() =>
        vibefetch(null, '/tables/festival', 'get', undefined)
            .then(res => res.body)
            .then(f => f?.map(f => ({
                ...f,
                start_date: dayjs.utc(f.start_date),
                end_date: dayjs.utc(f.end_date)
            })))
            .then(f => f?.sort((a, b) => festivalComparator(a) - festivalComparator(b)))
    , [])

    const festivalsWithSalesOpen = useMemo(() =>
        festivals.state.result?.filter(f => f.sales_are_open) ?? []
    , [festivals.state.result])

    const festivalSites = usePromise(() =>
        vibefetch(null, '/tables/festival_site', 'get', undefined)
            .then(res => res.body)
    , [])

    const eventSites = usePromise(() =>
        vibefetch(null, '/tables/event_site', 'get', undefined)
            .then(res => res.body)
    , [])

    const allEvents = usePromise(() =>
        vibefetch(null, '/events', 'get', undefined)
            .then(res => res.body?.events)
            .then(events => events?.map(e => ({
                ...e,
                start_datetime: dayjs.utc(e.start_datetime),
                end_datetime: e.end_datetime ? dayjs.utc(e.end_datetime) : null
            })))
    , [])

    const bookmarks = usePromise(async () => {
        if (jwt != null) {
            return (await vibefetch(jwt, '/event/bookmarks', 'get', undefined)).body
        } else {
            return null
        }
    }, [jwt])

    const accountInfo = usePromise(async () => {
        if (jwt != null) {
            const res = await vibefetch(jwt, '/account', 'get', undefined)

            // if JWT token doesn't work, clear it and kick user back to the login screen
            if (res.status === 401) {
                setJwt(undefined)
            }

            return res.body
        } else {
            return null
        }
    }, [jwt])

    const primaryAttendee = useMemo(() =>
        accountInfo.state.result?.attendees.find(a => a.is_primary_for_account)
    , [accountInfo.state.result?.attendees])

    const purchasesByFestival = useMemo(() => {
        const purchasesByFestival: Record<Tables['festival']['festival_id'], Tables['purchase'][]> = objectFromEntries(festivals.state.result?.map(f =>
            [f.festival_id, []]) ?? [])

        const info = accountInfo.state.result

        if (info != null) {
            for (const purchase of info.purchases) {
                const festival_id = purchaseTypes.state.result?.find(t => t.purchase_type_id === purchase.purchase_type_id)?.festival_id

                if (festival_id) {
                    const arr = purchasesByFestival[festival_id]

                    if (arr) {
                        arr.push(purchase)
                    }
                }
            }
        }

        return purchasesByFestival
    }, [accountInfo.state.result, festivals.state.result, purchaseTypes.state.result])

    const purchasedTicketsByFestival = useMemo(() =>
        objectFromEntries(objectEntries(purchasesByFestival)
            .map(([festival_id, purchases]) =>
                [
                    festival_id,
                    purchases.filter(p =>
                        purchaseTypes.state.result?.find(t => t.purchase_type_id === p.purchase_type_id)?.is_attendance_ticket)
                ]))
    , [purchaseTypes.state.result, purchasesByFestival])

    const nonTicketPurchasesByFestival = useMemo(() =>
        objectFromEntries(objectEntries(purchasesByFestival)
            .map(([festival_id, purchases]) =>
                [
                    festival_id,
                    purchases.filter(p =>
                        !purchaseTypes.state.result?.find(t => t.purchase_type_id === p.purchase_type_id)?.is_attendance_ticket)
                ]))
    , [purchaseTypes.state.result, purchasesByFestival])

    return useMemo(() => ({
        jwt,
        setJwt,
        logOut,
        loggedIn,
        jwtPayload,
        purchaseTypes,
        discounts,
        festivals,
        festivalsWithSalesOpen,
        festivalSites,
        eventSites,
        allEvents,
        bookmarks,
        accountInfo,
        primaryAttendee,
        purchasesByFestival,
        purchasedTicketsByFestival,
        nonTicketPurchasesByFestival
    }), [accountInfo, allEvents, bookmarks, discounts, eventSites, festivalSites, festivals, festivalsWithSalesOpen, jwt, jwtPayload, logOut, loggedIn, nonTicketPurchasesByFestival, primaryAttendee, purchaseTypes, purchasedTicketsByFestival, purchasesByFestival])
}

const festivalComparator = (festival: {
    start_date: Dayjs,
    end_date: Dayjs | null
}) => {
    const isInPast = festival.end_date?.isBefore(dayjs.utc())
    const oneHundredYears = 100 * ONE_YEAR_MS
    const modifier = isInPast ? oneHundredYears : 0 // push past events to the bottom of the list

    return festival.start_date.valueOf() + modifier
}

export type Store = ReturnType<typeof useNewStoreInstance>

export type DayjsEvent = NonNullable<NonNullable<Store['allEvents']>['state']['result']>[number]

export type DayjsFestival = NonNullable<NonNullable<Store['festivals']>['state']['result']>[number]

export const StoreContext = React.createContext<Store>(undefined as unknown as Store)

export function useStore() {
    return useContext(StoreContext)
}