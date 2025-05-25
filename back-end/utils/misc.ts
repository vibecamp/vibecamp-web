import { Tables } from '../types/db-types.ts'
import { Maybe } from '../types/misc.ts'
import { Purchases } from '../types/route-types.ts'

export async function allPromises<
  TPromises extends Record<string, Promise<unknown>>,
>(
  obj: TPromises,
): Promise<{ [key in keyof TPromises]: Awaited<TPromises[key]> }> {
  const entries = Object.entries(obj)

  const results = await Promise.all(entries.map(([_key, value]) => value))

  return Object.fromEntries(
    entries.map(([key, _value], index) => [key, results[index]]),
  ) as { [key in keyof TPromises]: Awaited<TPromises[key]> }
}

export function objectKeys<TObject extends object>(
  obj: TObject,
): Array<keyof TObject> {
  return Object.keys(obj) as Array<keyof TObject>
}

export function objectValues<TObject extends object>(
  obj: TObject,
): Array<TObject[keyof TObject]> {
  return Object.values(obj) as Array<TObject[keyof TObject]>
}

export function objectEntries<TObject extends object>(
  obj: TObject,
): Array<[keyof TObject, TObject[keyof TObject]]> {
  return Object.entries(obj) as Array<[keyof TObject, TObject[keyof TObject]]>
}

export function objectFromEntries<
  TKey extends string | number | symbol,
  TValue,
>(entries: Array<readonly [TKey, TValue]>): Record<TKey, TValue> {
  return Object.fromEntries(entries) as Record<TKey, TValue>
}

export function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms))
}

export function exists<T>(val: T | null | undefined): val is T {
  return val != null
}

export function sum(a: number, b: number) {
  return a + b
}

export function product(a: number, b: number) {
  return a * b
}

// Overengineering this a little to reduce allocations...
const spacesStrCache = new Map<number, string>()
export const spaces = (length: number): string => {
  const cached = spacesStrCache.get(length)

  if (cached != null) {
    return cached
  } else {
    const str = new Array(length).fill(' ').join('')
    spacesStrCache.set(length, str)
    return str
  }
}

export const pad = (str: string, length: number) => {
  const spacesToAdd = Math.max(length - str.length, 0)
  return str + spaces(spacesToAdd)
}

export const indent = (str: string) =>
  str.split('\n').map((line) => '\t' + line).join('\n')

export const discountPerPurchase = (
  purchaseTypeId: Tables['purchase_type']['purchase_type_id'],
  discounts: readonly Tables['discount'][],
) => {
  const relevantDiscounts = discounts.filter((d) =>
    d.purchase_type_id === purchaseTypeId
  )

  if (relevantDiscounts.length === 0) {
    return undefined
  } else {
    return relevantDiscounts
      .map((d) => Number(d.price_multiplier))
      .reduce(product, 1)
  }
}

export const purchaseBreakdown = (
  purchases: Purchases,
  appliedDiscounts: readonly Tables['discount'][],
  allPurchaseTypes: readonly Tables['purchase_type'][],
) => {
  return objectEntries(purchases)
    .map(([purchaseTypeId, count]) => {
      const purchaseType = allPurchaseTypes.find((p) =>
        p.purchase_type_id === purchaseTypeId
      )!
      const basePrice = purchaseType!.price_in_cents * count!
      const discountMultiplier = discountPerPurchase(
        purchaseTypeId,
        appliedDiscounts,
      )

      return {
        purchaseType,
        count,
        basePrice,
        discountMultiplier,
        discountedPrice: Math.round(basePrice * (discountMultiplier ?? 1)),
      }
    })
}

export const totalCost = (
  breakdown: ReturnType<typeof purchaseBreakdown>,
): number =>
  breakdown
    .map(({ discountedPrice }) => discountedPrice)
    .reduce(sum, 0)

export const purchaseTypeAvailable = (
  purchaseType: Tables['purchase_type'],
  account: Maybe<Pick<Tables['account'], 'is_low_income'>>,
  festival: Pick<Tables['festival'], 'sales_are_open'>,
) => {
  const { available_from, available_to } = purchaseType
  const now = Date.now()

  return (
    festival.sales_are_open &&
    !purchaseType.hidden_from_ui &&
    (!purchaseType.low_income_only || account?.is_low_income) &&
    (available_from == null || now >= new Date(available_from).valueOf()) &&
    (available_to == null || now <= new Date(available_to).valueOf())
  )
}

export const formatCents = (cents: number) =>
  (cents / 100).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

export const getDiscountsFromCode = (
  allDiscounts: readonly Tables['discount'][],
  discountCode: string,
): readonly Tables['discount'][] => {
  return allDiscounts.filter((d) =>
    d.discount_code.toLocaleUpperCase() === discountCode.toLocaleUpperCase()
  )
}

export function given<T, R>(
  val: T | null | undefined,
  fn: (val: T) => R,
): R | null | undefined {
  if (val != null) {
    return fn(val)
  } else {
    return val as null | undefined
  }
}

type FakeDayjs = {
  isUTC: () => boolean,
  utc: (x: boolean) => FakeDayjs,
  diff: (other: any, unit: 'minutes') => number,
  add: (n: number, unit: 'minutes') => FakeDayjs,
  subtract: (n: number, unit: 'minutes') => FakeDayjs,
  isAfter: (other: any) => boolean,
  isBefore: (other: any) => boolean
}

export function checkInProgressEventOverlap(
  newEvent: { start_datetime: FakeDayjs | null, end_datetime: FakeDayjs | null, event_site_location: string | null, event_id: string | undefined },
  existingEvent: { start_datetime: FakeDayjs, end_datetime: FakeDayjs | null, event_site_location: string | null, event_id: string },
  bufferMinutes = 0
): boolean {
  if (
    !newEvent.start_datetime ||
    !newEvent.event_site_location ||
    !existingEvent.event_site_location ||
    (newEvent.event_id && existingEvent.event_id && newEvent.event_id === existingEvent.event_id) ||
    newEvent.event_site_location !== existingEvent.event_site_location
  ) {
    return false
  }

  const start1 = newEvent.start_datetime
  const start2 = existingEvent.start_datetime
  const end1 = newEvent.end_datetime
  const end2 = existingEvent.end_datetime

  if (!end1) {
    if (!end2) {
      // if neither has an end time, just check if they start at the same time
      return Math.abs(start1.diff(start2, 'minutes')) <= bufferMinutes
    } else {
      // if only 2 has an end time, see if 1 starts during 2
      return start1.isAfter(start2.subtract(bufferMinutes, 'minutes'))
        && start1.isBefore(end2.add(bufferMinutes, 'minutes'))
    }
  } else {
    if (!end2) {
      // if only 1 has an end time, see if 2 starts during 1
      return start2.isAfter(start1.subtract(bufferMinutes, 'minutes'))
        && start2.isBefore(end1.add(bufferMinutes, 'minutes'))
    } else {
      // if both have end times, test overlap
      return (
        start1.isBefore(end2.add(bufferMinutes, 'minutes')) &&
        end1.isAfter(start2.subtract(bufferMinutes, 'minutes'))
      )
    }
  }
}
