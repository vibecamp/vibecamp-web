import React, { ReactNode } from 'react'

import { objectEntries, objectFromEntries } from '../../back-end/utils/misc'
import { DayjsEvent } from './hooks/useStore'
import { InProgressEvent } from './types/misc'

export function wait(ms: number): Promise<void> {
    return new Promise(res => setTimeout(res, ms))
}

export function jsonParse(json: string): unknown | undefined {
    try {
        return JSON.parse(json)
    } catch {
        return undefined
    }
}

export const preventingDefault = <F extends () => unknown | void>(fn: F) =>
    (event: { preventDefault: () => void }) => {
        event.preventDefault()
        return fn()
    }

export const DEFAULT_FORM_ERROR = 'Something went wrong, please try again'

export function doNothing() {
}

export function validate<
    TObj extends object
>(
    obj: TObj,
    validators: Partial<{[K in keyof TObj]: (val: TObj[K]) => string | undefined}>
): ErrorsFor<TObj> {
    return objectFromEntries(
        objectEntries(validators)
            .map(([key, validator]) => [key, validator!(obj[key as unknown as keyof TObj])] as const)
    )
}

export type ErrorsFor<TObj extends object> = Partial<{[K in keyof TObj]: string | undefined}>

export function someValue<TObj extends object>(obj: TObj, cb: (value: TObj[keyof TObj]) => boolean): boolean {
    for (const key in obj) {
        if (cb(obj[key])) {
            return true
        }
    }
    return false
}

export function urlsToLinks(str: string): React.ReactNode[] {
    const segments: ReactNode[] = []
    const urlRegex = /(?:http|https):\/\/([\w_-]+(?:(?:\.[\w_-]+)+))(?:[\w.,@?^=%&:/~+#-]*[\w@?^=%&/~+#-])/igm
    let result: RegExpExecArray | null = null
    let lastIndex = 0
    // eslint-disable-next-line no-cond-assign
    while (result = urlRegex.exec(str)) {
        segments.push(str.substring(lastIndex, result.index))
        const url = result[0]
        segments.push(<a href={url} target='_blank' rel="noreferrer" key={result.index}>{url}</a>)
        lastIndex = result.index + url.length
    }

    segments.push(str.substring(lastIndex))

    return segments
}

export function checkInProgressEventOverlap(
    newEvent: InProgressEvent,
    existingEvent: DayjsEvent,
    bufferMinutes = 0
): boolean {
    if (
        !newEvent.start_datetime ||
        !newEvent.event_site_location ||
        !existingEvent.start_datetime ||
        !existingEvent.event_site_location ||
        (newEvent.event_id && existingEvent.event_id && newEvent.event_id === existingEvent.event_id) ||
        newEvent.event_site_location !== existingEvent.event_site_location
    ) {
        return false
    }

    const start1 = newEvent.start_datetime.isUTC() ? newEvent.start_datetime : newEvent.start_datetime.utc(true)
    const start2 = existingEvent.start_datetime
    const end1 = newEvent.end_datetime?.isUTC() ? newEvent.end_datetime : newEvent.end_datetime?.utc(true)
    const end2 = existingEvent.end_datetime

    // Treat events with no end_datetime as running indefinitely
    if (!end1) return start2.isAfter(start1.subtract(bufferMinutes, 'minutes'))
    if (!end2) return start1.isAfter(start2.subtract(bufferMinutes, 'minutes'))

    return (
        start1.isBefore(end2.add(bufferMinutes, 'minutes')) &&
        end1.isAfter(start2.subtract(bufferMinutes, 'minutes'))
    )
}
