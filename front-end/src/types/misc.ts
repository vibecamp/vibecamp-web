import { Dayjs } from 'dayjs'

import { Tables } from '../../../back-end/types/db-types'

export type InProgressEvent = {
    event_id: Tables['event']['event_id'] | undefined,
    name: string,
    description: string,
    start_datetime: Dayjs | null,
    end_datetime: Dayjs | null,
    plaintext_location: string | null,
    event_site_location: Tables['event_site']['event_site_id'] | null,
    event_type: Tables['event']['event_type'] | undefined,
    bookmarks?: unknown,
    created_by?: unknown,
    creator_name?: unknown
}