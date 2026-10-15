// festival.end_date is stored as the day after the last day
export const formatDateRange = (start: string, end: string) =>
    new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
    }).formatRange(new Date(start), new Date(Date.parse(end) - 86_400_000))
