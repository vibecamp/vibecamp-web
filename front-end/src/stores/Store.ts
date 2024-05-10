import dayjs, { Dayjs } from 'dayjs'
import jwtDecode from 'jwt-decode'
import { autorun, makeAutoObservable } from 'mobx'

import { Tables } from '../../../back-end/types/db-types.ts'
import { VibeJWTPayload } from '../../../back-end/types/misc'
import { ONE_YEAR_MS } from '../../../back-end/utils/constants.ts'
import { objectEntries, objectFromEntries } from '../../../back-end/utils/misc.ts'
import { request } from '../mobx/request'
import { given, jsonParse } from '../utils'
import { vibefetch } from '../vibefetch'

const JWT_KEY = 'jwt'

class Store {
    constructor() {
        makeAutoObservable(this)

        autorun(() => {
            localStorage.setItem(JWT_KEY, JSON.stringify(this.jwt))
        })
    }

    readonly purchaseTypes = request(() =>
        vibefetch(null, '/tables/purchase_type', 'get', undefined)
            .then(res => res.body))

    readonly discounts = request(() =>
        vibefetch(null, '/tables/discount', 'get', undefined)
            .then(res => res.body))

    readonly festivals = request(() =>
        vibefetch(null, '/tables/festival', 'get', undefined)
            .then(res => res.body)
            .then(f => f?.map(f => ({
                ...f,
                start_date: dayjs.utc(f.start_date),
                end_date: dayjs.utc(f.end_date)
            })))
            .then(f => f?.sort((a, b) => festivalComparator(a) - festivalComparator(b))))

    readonly festivalSites = request(() =>
        vibefetch(null, '/tables/festival_site', 'get', undefined)
            .then(res => res.body))

    readonly eventSites = request(() =>
        vibefetch(null, '/tables/event_site', 'get', undefined)
            .then(res => res.body))

    get festivalsWithSalesOpen() {
        return this.festivals.state.result?.filter(f => f.sales_are_open) ?? []
    }

    readonly festivalsHappeningAt = (date: Dayjs) =>
        this.festivals.state.result
            ?.filter(e =>
                date.isAfter(dayjs.utc(e.start_date)) &&
                date.isBefore(dayjs.utc(e.end_date))) ?? []
    /// User
    jwt: string | null = given(localStorage.getItem(JWT_KEY), jwt => {
        const parsed = jsonParse(jwt)

        if (typeof parsed === 'string') {
            return parsed
        } else {
            return null
        }
    }) ?? null

    readonly logOut = () => {
        this.jwt = null
    }

    get loggedIn() {
        return this.jwt != null
    }

    get jwtPayload() {
        if (this.jwt != null) {
            try {
                return jwtDecode<VibeJWTPayload>(this.jwt)
            } catch {
            }
        }
    }

    readonly accountInfo = request(async () => {
        if (this.jwt != null) {
            const res = await vibefetch(this.jwt, '/account', 'get', undefined)

            // if JWT token doesn't work, clear it and kick user back to the login screen
            if (res.status === 401) {
                this.jwt = null
            }

            return res.body
        } else {
            return null
        }
    })

    get primaryAttendee() {
        return this.accountInfo.state.result?.attendees.find(a => a.is_primary_for_account)
    }

    get purchasesByFestival() {
        const purchasesByFestival: Record<Tables['festival']['festival_id'], Tables['purchase'][]> = objectFromEntries(this.festivals.state.result?.map(f =>
            [f.festival_id, []]) ?? [])

        const accountInfo = this.accountInfo.state.result

        if (accountInfo != null) {
            for (const purchase of accountInfo.purchases) {
                const festival_id = this.purchaseTypes.state.result?.find(t => t.purchase_type_id === purchase.purchase_type_id)?.festival_id

                if (festival_id) {
                    const arr = purchasesByFestival[festival_id]

                    if (arr) {
                        arr.push(purchase)
                    }
                }
            }
        }

        return purchasesByFestival
    }

    get purchasedTicketsByFestival() {
        return objectFromEntries(objectEntries(this.purchasesByFestival)
            .map(([festival_id, purchases]) =>
                [
                    festival_id,
                    purchases.filter(p =>
                        this.purchaseTypes.state.result?.find(t => t.purchase_type_id === p.purchase_type_id)?.is_attendance_ticket)
                ]))
    }

    get nonTicketPurchasesByFestival() {
        return objectFromEntries(objectEntries(this.purchasesByFestival)
            .map(([festival_id, purchases]) =>
                [
                    festival_id,
                    purchases.filter(p =>
                        !this.purchaseTypes.state.result?.find(t => t.purchase_type_id === p.purchase_type_id)?.is_attendance_ticket)
                ]))
    }

    /// Events
    readonly allEvents = request(async () => {
        if (this.jwt != null) {
            return (await vibefetch(this.jwt, '/events', 'get', undefined)).body?.events
                .map(e => ({
                    ...e,
                    start_datetime: dayjs.utc(e.start_datetime),
                    end_datetime: e.end_datetime ? dayjs.utc(e.end_datetime) : null
                }))
        } else {
            return null
        }
    })

    readonly bookmarks = request(async () => {
        if (this.jwt != null) {
            return (await vibefetch(this.jwt, '/event/bookmarks', 'get', undefined)).body
        } else {
            return null
        }
    }, { keepLatest: true })
}

const storeInstance = new Store()

const festivalComparator = (festival: {
    start_date: Dayjs,
    end_date: Dayjs | null
}) => {
    const isInPast = festival.end_date?.isBefore(dayjs.utc())
    const oneHundredYears = 100 * ONE_YEAR_MS
    const modifier = isInPast ? oneHundredYears : 0 // push past events to the bottom of the list

    return festival.start_date.valueOf() + modifier
}

export default storeInstance