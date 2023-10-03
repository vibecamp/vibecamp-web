
export type UserData = {
    username: `@${string}`,
    calendarEvents: string[],
    purchasedBedding: number,
    purchasedSleepingBags: number,
    purchasedBusTickets: number,
    dietaryRestrictions: string
}

export type EventData = {
    id: string,
    name: string,
    description: string,
    start: string,
    end: string,
    locationName: string,
    locationAddress: string,
    visibility: 'public' | 'mutuals' | 'whitelist',
    visibilityWhitelist: string[],
    creator: number,
}
