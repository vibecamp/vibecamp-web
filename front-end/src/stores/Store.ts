import dayjs from 'dayjs'
import jwtDecode from 'jwt-decode'
import { autorun, makeAutoObservable } from 'mobx'

import { TABLE_ROWS } from '../../../back-end/types/db-types'
import { PURCHASE_TYPES_BY_TYPE, VibeJWTPayload } from '../../../back-end/types/misc'
import { BUS_TICKET_PURCHASE_TYPES } from '../components/tickets/BusTicketsField'
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

    readonly festival = request(async () => {
        if (this.jwt != null) {
            const festival = (await vibefetch(this.jwt, '/festival-info', 'get', undefined)).body

            if (festival == null) {
                return null
            }

            return {
                ...festival,
                start_date: dayjs.utc(festival.start_date),
                end_date: dayjs.utc(festival.end_date),
            } as const
        } else {
            return null
        }
    })

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

    get purchasedTickets() {
        const accountInfo = this.accountInfo.state.result

        if (accountInfo != null) {
            const tickets = accountInfo.purchases
                .filter(p => PURCHASE_TYPES_BY_TYPE[p.purchase_type_id].is_attendance_ticket)

            const attendees = [...accountInfo.attendees]

            return tickets.map((t, i) => ({ ...t, attendeeInfo: attendees[i] }))
        } else {
            return []
        }
    }

    get purchasedBusTickets() {
        return this.accountInfo.state.result?.purchases.filter(p => BUS_TICKET_PURCHASE_TYPES.includes(p.purchase_type_id as any))
    }

    get purchasedSleepingBags() {
        return this.accountInfo.state.result?.purchases.filter(p => p.purchase_type_id === 'SLEEPING_BAG_VIBECLIPSE_2024')
    }

    get purchasedPillows() {
        return this.accountInfo.state.result?.purchases.filter(p => p.purchase_type_id === 'PILLOW_WITH_CASE_VIBECLIPSE_2024')
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

    readonly allEventSites = request(async () => {
        if (this.jwt != null) {
            return (await vibefetch(this.jwt, '/event-sites', 'post', { festival_id: TABLE_ROWS.next_festival[0].festival_id })).body?.eventSites
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

export default new Store()