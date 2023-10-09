import Account from './components/Account'
import Tickets from './components/Tickets'

export const VIEWS = {
    Tickets: {
        icon: 'confirmation_number',
        component: Tickets
    },
    // Events: {
    //     icon: 'calendar_today',
    //     component: Events
    // },
    // Map: {
    //     icon: 'map',
    //     component: Map
    // },
    // Info: {
    //     icon: 'info',
    //     component: Info
    // },
    Account: {
        icon: 'person',
        component: Account
    }
} as const

export const VIEWS_ENTRIES = Object.entries(VIEWS) as [ViewName, typeof VIEWS[ViewName]][]

export function isViewName(str: string): str is ViewName {
    return Object.keys(VIEWS).includes(str)
}

export type ViewName = keyof typeof VIEWS