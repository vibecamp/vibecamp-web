import type { LocationJson } from '@/contract/route-types'
import { matchesSearch } from './search'

// only locations placed on the map have a page; the rest are described in the event editor instead
export const isMapped = (l: LocationJson): l is LocationJson & { pin_x: number; pin_y: number } =>
    l.pin_x != null && l.pin_y != null

export const matchesLocation = (l: LocationJson, query: string) =>
    matchesSearch(l.name, query) || (l.aka != null && matchesSearch(l.aka, query))
