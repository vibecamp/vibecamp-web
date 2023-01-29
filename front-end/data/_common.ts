import { getJwtCookie } from "./auth"

export function vibeFetch(input: RequestInfo | URL, init?: RequestInit | undefined): Promise<Response> {
    const jwt = getJwtCookie()

    return fetch(input, {
        ...init,
        headers: {
            ...(jwt
                ? { 'Authorization': 'Bearer ' + jwt }
                : undefined),
            ...init?.headers,
        }
    })
}