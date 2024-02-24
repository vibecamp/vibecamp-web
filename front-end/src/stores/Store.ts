import dayjs from 'dayjs'
import jwtDecode from 'jwt-decode'
import { autorun, makeAutoObservable } from 'mobx'

import { Tables } from '../../../back-end/types/db-types.ts'
import { PURCHASE_TYPES_BY_TYPE, VibeJWTPayload } from '../../../back-end/types/misc'
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
        const purchasedTickets: Partial<Record<Tables['festival']['festival_id'], Tables['purchase'][]>> = {}

        const accountInfo = this.accountInfo.state.result

        if (accountInfo != null) {
            const tickets = accountInfo.purchases
                .filter(p => PURCHASE_TYPES_BY_TYPE[p.purchase_type_id].is_attendance_ticket)

            for (const ticket of tickets) {
                const festival_id = PURCHASE_TYPES_BY_TYPE[ticket.purchase_type_id].festival_id
                const ticketsForFestival = purchasedTickets[festival_id] = purchasedTickets[festival_id] ?? []
                ticketsForFestival.push(ticket)
            }

            return purchasedTickets
        } else {
            return {}
        }
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

export default new Store()