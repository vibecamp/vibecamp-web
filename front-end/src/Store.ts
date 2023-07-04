import { makeAutoObservable } from 'mobx'
import { createTransformer } from 'mobx-utils'
import { UserData, EventData } from './model'
import { request } from './mobx-utils'
import { ViewName } from './components/App'

class Store {
    constructor() {
        makeAutoObservable(this)
    }

    /// Navigation

    currentView: ViewName = 'Announcements'
    readonly setCurrentView = createTransformer((view: ViewName) => () => this.currentView = view)

    /// User

    currentUser: UserData = {
        username: '@brundolfsmith',
        calendarEvents: [],
        purchasedBedding: 0,
        purchasedSleepingBags: 0,
        purchasedBusTickets: 0,
        dietaryRestrictions: ''
    }

    /// Events

    readonly allEvents = request(loadAllEvents)
    eventBeingEdited: EventData | null = null

    readonly newEvent = () => {
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
            creator: this.currentUser.username
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
            creator: 'Ramuel'
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
            creator: '@brundolfsmith'
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
            creator: 'Official'
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
            creator: 'Aella & Robin Hanson'
        }
    ].sort((a, b) => new Date(a.start).valueOf() - new Date(b.start).valueOf())
}

export default new Store()