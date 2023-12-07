import { objectEntries } from '../../back-end/utils/misc'
import Account from './components/Account'
import Tickets from './components/Tickets'
import Stats from './components/Stats'

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
    },
    Stats: {
        icon: 'info',
        component: Stats
    },
} as const

export const VIEWS_ARRAY = objectEntries(VIEWS)
    .map(([name, { icon, component }]) => ({ name, icon, component } as const))

export function isViewName(str: string): str is ViewName {
    return Object.keys(VIEWS).includes(str)
}

export type ViewName = keyof typeof VIEWS
