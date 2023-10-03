// export const BACK_END_ORIGIN = 'https://backend-ssp4.onrender.com'
export const BACK_END_ORIGIN = 'http://localhost:10000'
export const API_PREFIX = '/api/v1'

export async function vibeFetch<T = unknown>(input: RequestInfo | URL, jwt: string | null, init?: RequestInit | undefined): Promise<T> {
    const res = await fetch(BACK_END_ORIGIN + API_PREFIX + input, {
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
