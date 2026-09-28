export function objectKeys<TObject extends object>(obj: TObject): Array<keyof TObject> {
    return Object.keys(obj) as Array<keyof TObject>
}

export function objectValues<TObject extends object>(obj: TObject): Array<TObject[keyof TObject]> {
    return Object.values(obj) as Array<TObject[keyof TObject]>
}

export function objectEntries<TObject extends object>(
    obj: TObject,
): Array<[keyof TObject, TObject[keyof TObject]]> {
    return Object.entries(obj) as Array<[keyof TObject, TObject[keyof TObject]]>
}

export function objectFromEntries<TKey extends string | number | symbol, TValue>(
    entries: Array<readonly [TKey, TValue]>,
): Record<TKey, TValue> {
    return Object.fromEntries(entries) as Record<TKey, TValue>
}

export function escapeHtml(s: string) {
    return s
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;')
}

export function jsonParse(json: string): unknown | undefined {
    try {
        return JSON.parse(json)
    } catch {
        return undefined
    }
}

export const PASSWORD_RESET_SECRET_KEY = 'passwordResetSecret'
