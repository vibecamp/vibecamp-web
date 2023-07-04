
export type Event = {
    start: string,
    end: string | null,
    name: string,
    location: string | null,
    description: string | null,
    hosts: string[]
}

const EVENTS = [
    {
        name: 'First Buses Leaving AUS',

    }
]

type A = [1, 2]
type B = [...A, 3]
type C = [...B, 4]