
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

export function objectKeys<TObject extends Record<string | number | symbol, unknown>>(obj: TObject): Array<keyof TObject> {
  return Object.keys(obj)
}

export function objectEntries<TObject extends Record<string | number | symbol, unknown>>(obj: TObject): Array<[keyof TObject, TObject[keyof TObject]]> {
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
