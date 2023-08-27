import Store from '../Store'

export async function vibeFetch<T = unknown>(input: RequestInfo | URL, init?: RequestInit | undefined): Promise<T> {
    const jwt = Store.jwt

    const res = await fetch(input, {
        ...init,
        headers: {
            ...(jwt
                ? { 'Authorization': 'Bearer ' + jwt }
                : undefined),
            ...init?.headers,
        }
    })

    const json = await res.json()

    if (json.error) {
        throw Error(json.error)
    } else {
        return json as T
    }
}
