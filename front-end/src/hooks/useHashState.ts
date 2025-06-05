import { useCallback, useMemo } from 'react'

import { Tables } from '../../../back-end/types/db-types'
import { PASSWORD_RESET_SECRET_KEY } from '../../../back-end/utils/constants'
import { jsonParse } from '../utils'
import useLocationHash from './useLocationHash'

export default function useHashState() {
    const hash = useLocationHash()

    const hashState = useMemo(() => {
        const parsed = jsonParse(decodeURIComponent(hash.substring(1)))

        if (parsed == null || typeof parsed !== 'object') {
            return undefined
        }

        for (const key in parsed) {
            if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'boolean' && key !== null) {
                return undefined
            }
        }

        return parsed as HashState
    }, [hash])

    const getHashStateString = useCallback((state: HashState) => {
        return encodeURIComponent(JSON.stringify({ ...hashState, ...state }))
    }, [hashState])

    const setHashState = useCallback((state: HashState) => {
        window.location.hash = getHashStateString(state)
    }, [getHashStateString])

    return { hashState, setHashState, getHashStateString } as const
}

type HashState = Readonly<{
    currentView?: 'Tickets' | 'Events' | 'Account',
    ticketPurchaseModalState?: Tables['festival']['festival_id'] | 'payment' | 'badges',
    eventsFilter?: EventsFilter,
    viewingEventDetails?: Tables['event']['event_id'],
    compactEventsView?: boolean,
    [PASSWORD_RESET_SECRET_KEY]?: string
}>

export type EventsFilter = 'All' | 'Bookmarked' | 'Mine'
