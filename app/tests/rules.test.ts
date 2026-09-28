import { describe, expect, it } from 'vitest'
import dayjs from '@/lib/dayjs'
import { checkInProgressEventOverlap } from '@/lib/rules'

describe('checkInProgressEventOverlap()', () => {
    const at = (s: string) => dayjs(s)
    const existing = (start: string, site = 'Pool') => ({
        start_datetime: at(start),
        end_datetime: null,
        event_site_location: site,
        event_id: '12345',
    })

    it('basic overlap', () => {
        expect(
            checkInProgressEventOverlap(
                {
                    start_datetime: at('2025-06-19 18:00:00'),
                    end_datetime: null,
                    event_site_location: 'Pool',
                    event_id: undefined,
                },
                existing('2025-06-19 18:00:00'),
            ),
        ).toBe(true)
    })
    it('no overlap when start times differ and no end times', () => {
        expect(
            checkInProgressEventOverlap(
                {
                    start_datetime: at('2025-06-19 18:10:00'),
                    end_datetime: null,
                    event_site_location: 'Pool',
                    event_id: undefined,
                },
                existing('2025-06-19 18:00:00'),
            ),
        ).toBe(false)
    })
    it('same time and location, different day', () => {
        expect(
            checkInProgressEventOverlap(
                {
                    start_datetime: at('2025-06-19 18:00:00'),
                    end_datetime: null,
                    event_site_location: 'Pool',
                    event_id: undefined,
                },
                existing('2025-06-20 18:00:00'),
            ),
        ).toBe(false)
    })
    it('same time, different location', () => {
        expect(
            checkInProgressEventOverlap(
                {
                    start_datetime: at('2025-06-19 18:00:00'),
                    end_datetime: null,
                    event_site_location: 'Pool',
                    event_id: undefined,
                },
                existing('2025-06-19 18:00:00', 'Field'),
            ),
        ).toBe(false)
    })
    it('same event_id', () => {
        expect(
            checkInProgressEventOverlap(
                {
                    start_datetime: at('2025-06-19 18:00:00'),
                    end_datetime: null,
                    event_site_location: 'Pool',
                    event_id: '12345',
                },
                existing('2025-06-19 18:00:00'),
            ),
        ).toBe(false)
    })
})
