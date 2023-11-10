import { autorun, makeAutoObservable } from 'mobx'
import { createTransformer } from 'mobx-utils'
import jwtDecode from 'jwt-decode'

import { EventData } from './model'
import { VibeJWTPayload } from '../../back-end/types/misc'
import { given, jsonParse } from './utils'
import { ViewName, isViewName } from './views'
import { vibefetch } from './vibefetch'
import { request } from './mobx/request'

const JWT_KEY = 'jwt'

const viewFromUrl = window.location.hash.substring(1)

class Store {
    constructor() {
        makeAutoObservable(this)

        autorun(() => {
            localStorage.setItem(JWT_KEY, JSON.stringify(this.jwt))
        })
    }

    /// Navigation
    currentView: ViewName = isViewName(viewFromUrl) ? viewFromUrl : 'Tickets'
    readonly setCurrentView = createTransformer((view: ViewName) => () => this.currentView = view)

    /// User
    jwt: string | null = given(localStorage.getItem(JWT_KEY), jwt => {
        const parsed = jsonParse(jwt)

        if (typeof parsed === 'string') {
            return parsed
        } else {
            return null
        }
    }) ?? null

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
            const festival = await vibefetch(this.jwt, '/festival-info', 'get', undefined)

            if (festival == null) {
                return null
            }

            return {
                festival_name: festival.festival_name,
                start_date: new Date(festival.start_date),
                end_date: new Date(festival.end_date),
            } as const
        } else {
            return null
        }
    })

    readonly accountInfo = request(() => {
        if (this.jwt != null) {
            return vibefetch(this.jwt, '/account', 'get', undefined)
        } else {
            return null
        }
    })

    get purchasedTickets() {
        const accountInfo = this.accountInfo.state.result

        if (accountInfo != null) {
            const tickets = accountInfo.purchases
                .filter(p => p.purchase_type_id === 'ATTENDANCE_VIBECLIPSE_2024' || p.purchase_type_id === 'ATTENDANCE_CHILD_VIBECLIPSE_2024')
            const attendees = [...accountInfo.attendees]

            return tickets.map((t, i) => ({ ...t, attendeeInfo: attendees[i] }))
        } else {
            return []
        }
    }

    /// Events

    readonly allEvents = request(loadAllEvents)
    eventBeingEdited: EventData | null = null

    readonly newEvent = () => {
        if (this.jwtPayload?.account_id != null) {
            this.eventBeingEdited = {
                id: String(Math.random()),
                name: '',
                description: '',
                start: '',
                end: '',
                locationName: '',
                locationAddress: '',
                visibility: 'public',
                visibilityWhitelist: [],
                creator: this.jwtPayload?.account_id
            }
        }
    }

    readonly editEvent = (id: string) => {
        const event = this.allEvents.state.kind === 'result' ? this.allEvents.state.result.find(e => e.id === id) : undefined

        if (event != null) {
            this.eventBeingEdited = JSON.parse(JSON.stringify(event))
        }
    }

    readonly saveEvent = async (): Promise<boolean> => {
        if (this.eventBeingEdited == null) {
            return false
        }

        if (!this.eventBeingEdited.name) {
            return false
        }

        if (!this.eventBeingEdited.start) {
            return false
        }

        if (!this.eventBeingEdited.locationName) {
            return false
        }

        // TODO: persist

        this.stopEditingEvent()
        await this.allEvents.load()

        return true
    }

    readonly stopEditingEvent = () => this.eventBeingEdited = null
}

async function loadAllEvents(): Promise<EventData[]> {
    return [
        {
            id: '1',
            name: 'Lockpicking',
            description: 'Learn the basics of lockpicking in the roundtable room! Locks and pick sets will remain available at a table for the duration of camp. By taking this workshop you agree to teach at least one other person at vibecamp how to pick locks.',
            start: '2023-06-15T16:00:00-04:00',
            end: '2023-06-15T17:00:00-04:00',
            locationName: 'Roundtable Room',
            locationAddress: '',
            visibility: 'public' as const,
            visibilityWhitelist: [],
            creator: '0'
        },
        {
            id: '2',
            name: 'Speed Friending',
            description: 'Meet lots of vibecampers in a short amount of time.',
            start: '2023-06-15T16:00:00-04:00',
            end: '2023-06-15T17:00:00-04:00',
            locationName: 'Meeting Room',
            locationAddress: '',
            visibility: 'public' as const,
            visibilityWhitelist: [],
            creator: '1'
        },
        {
            id: '3',
            name: 'Dinner',
            description: 'To reduce long lines and congestion we have assigned all attendees to recommended mealtimes. They aren’t enforced and we understand if you want to shift a little bit for a can’t-miss event, but please try to follow the schedule when you can. Thursday night times are a little early to accommodate opening ceremonies.\nCyan: 5:00 PM\nYellow: 6:00 PM\nMagenta: 7:00 PM',
            start: '2023-06-15T16:00:00-04:00',
            end: '2023-06-15T20:00:00-04:00',
            locationName: 'Dining Hall',
            locationAddress: '',
            visibility: 'public' as const,
            visibilityWhitelist: [],
            creator: '-1'
        },
        {
            id: '4',
            name: 'Live Twitter Polls',
            description: 'Live twitter polls, spicy level: high.',
            start: '2023-06-15T17:45:00-04:00',
            end: '2023-06-15T18:45:00-04:00',
            locationName: 'Amphitheater',
            locationAddress: '',
            visibility: 'public' as const,
            visibilityWhitelist: [],
            creator: '2'
        }
    ].sort((a, b) => new Date(a.start).valueOf() - new Date(b.start).valueOf())
}

export default new Store()