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
