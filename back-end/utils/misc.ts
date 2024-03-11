import { TABLE_ROWS, Tables } from '../types/db-types.ts'
import { PURCHASE_TYPES_BY_TYPE } from '../types/misc.ts'
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

export function objectKeys<TObject extends object>(obj: TObject): Array<keyof TObject> {
  return Object.keys(obj) as Array<keyof TObject>
}

export function objectValues<TObject extends object>(obj: TObject): Array<TObject[keyof TObject]> {
  return Object.values(obj) as Array<TObject[keyof TObject]>
}

export function objectEntries<TObject extends object>(obj: TObject): Array<[keyof TObject, TObject[keyof TObject]]> {
  return Object.entries(obj) as Array<[keyof TObject, TObject[keyof TObject]]>
}

export function objectFromEntries<TKey extends string | number | symbol, TValue>(entries: Array<readonly [TKey, TValue]>): Record<TKey, TValue> {
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
  str.split('\n').map(line => '\t' + line).join('\n')

export const discountPerPurchase = (purchaseType: Tables['purchase_type']['purchase_type_id'], discounts: readonly Tables['discount'][]) => {
  const relevantDiscounts = discounts.filter(d => d.purchase_type_id === purchaseType)

  if (relevantDiscounts.length === 0) {
    return undefined
  } else {
    return relevantDiscounts
      .map(d => Number(d.price_multiplier))
      .reduce(product, 1)
  }
}

export const purchaseBreakdown = (purchases: Purchases, discounts: readonly Tables['discount'][]) =>
  objectEntries(purchases)
    .map(([purchaseType, count]) => {
      const basePrice = PURCHASE_TYPES_BY_TYPE[purchaseType].price_in_cents * count!
      const discountMultiplier = discountPerPurchase(purchaseType, discounts)

      return {
        purchaseType,
        count,
        basePrice,
        discountMultiplier,
        discountedPrice: basePrice * (discountMultiplier ?? 1)
      }
    })
