import { Routes } from '../../back-end/types/route-types'
import env from './env'
import Store from './stores/Store'
export const API_PREFIX = '/api/v1'

export async function vibefetch<TEndpoint extends keyof Routes>(jwt: string | null, input: TEndpoint, method: Routes[TEndpoint]['method'], body: Routes[TEndpoint]['body']) {
    const res = await fetch(env.BACK_END_ORIGIN + API_PREFIX + input, {
        method,
        headers: {
            ...(jwt
                ? { 'Authorization': 'Bearer ' + jwt }
                : undefined),
        },
        body: typeof body !== 'undefined' ? JSON.stringify(body) : undefined,
        credentials: 'include'
    })

    // if JWT token doesn't work, clear it and kick user back to the login screen
    if (res.status === 401) {
        Store.jwt = null
    }

    const json = await res.json() as (Routes[TEndpoint]['response']) | null

    return {
        body: json,
        status: res.status
    }
}
