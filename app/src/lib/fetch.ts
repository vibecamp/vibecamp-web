import type { Routes } from '@/contract/route-types'

const API_PREFIX = '/api/v1'

export async function vibefetch<TEndpoint extends keyof Routes>(
    jwt: string | null | undefined,
    endpoint: TEndpoint,
    method: Routes[TEndpoint]['method'],
    body: Routes[TEndpoint]['body'],
): Promise<{ body: Routes[TEndpoint]['response'] | null; status: number }> {
    const res = await fetch(API_PREFIX + endpoint, {
        method: method.toUpperCase(),
        headers: {
            ...(jwt ? { Authorization: `Bearer ${jwt}` } : undefined),
            ...(body !== undefined ? { 'Content-Type': 'application/json' } : undefined),
        },
        body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const json = (await res.json().catch(() => null)) as Routes[TEndpoint]['response'] | null

    return { body: json, status: res.status }
}
