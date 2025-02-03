
import React, { ReactNode } from 'react'

import { exists, objectEntries, objectFromEntries } from '../../back-end/utils/misc'
import { Dayjs } from 'dayjs'
import { Tables } from '../../back-end/types/db-types'

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

// Checks if two events overlap in location and time with buffer minutes (default 0)
export function eventsOverlap(
    event1: Pick<Tables['event'], 'event_id' | 'event_site_location'> & {
      start_datetime: Dayjs,
      end_datetime: Dayjs | null
    },
    event2: Pick<Tables['event'], 'event_id' | 'event_site_location'> & {
      start_datetime: Dayjs,
      end_datetime: Dayjs | null
    },
    bufferMinutes = 0
  ): boolean {
    if (
      // Same event (for edit case)
      event1.event_id === event2.event_id ||
      // Either event has no event site location
      !exists(event1.event_site_location) ||
      !exists(event2.event_site_location) ||
      // Events are at different locations
      event1.event_site_location !== event2.event_site_location
    ) {
      return false
    }
  
    const start1 = event1.start_datetime
    const start2 = event2.start_datetime
    
    // Treat events with no end time as running indefinitely
    if (!exists(event1.end_datetime)) {
      return start2.unix() >= start1.subtract(bufferMinutes, 'minutes').unix()
    }
    if (!exists(event2.end_datetime)) {
      return start1.unix() >= start2.subtract(bufferMinutes, 'minutes').unix()
    }
  
    // Both events have end times so we check for overlap with buffer
    return (
      start1.unix() <= event2.end_datetime.add(bufferMinutes, 'minutes').unix() &&
      event1.end_datetime.unix() >= start2.subtract(bufferMinutes, 'minutes').unix()
    )
  }