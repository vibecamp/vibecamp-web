import { Routes } from '../../back-end/common/route-types'
import env from './env'
export const API_PREFIX = '/api/v1'

export async function vibefetch<TEndpoint extends keyof Routes>(jwt: string | null, input: TEndpoint, method: Routes[TEndpoint]['method'], body: Routes[TEndpoint]['body']): Promise<Routes[TEndpoint]['response']> {
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

    if (res.status !== 200) {
        throw Error()
    }

    const json = await res.json() as Routes[TEndpoint]['response']

    return json
}
