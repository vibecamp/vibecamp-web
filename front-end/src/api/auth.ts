import env from '../env'
import { API_PREFIX } from './_common'

export async function login({ email_address, password }: { email_address: string, password: string }): Promise<{ status: number, jwt: string | null }> {
    try {
        const res = await fetch(env.BACK_END_ORIGIN + API_PREFIX + '/login', {
            method: 'POST',
            body: JSON.stringify({ email_address, password }),
            credentials: 'include'
        })

        if (res.status == 200) {
            const { jwt } = await res.json() as { jwt: string | null }
            return { status: res.status, jwt }
        } else {
            return { status: res.status, jwt: null }
        }
    } catch {
    }

    return { status: 500, jwt: null }
}

export async function signup({ email_address, password }: { email_address: string, password: string }): Promise<{ status: number, jwt: string | null }> {
    try {
        const res = await fetch(env.BACK_END_ORIGIN + API_PREFIX + '/signup', {
            method: 'POST',
            body: JSON.stringify({ email_address, password }),
            credentials: 'include'
        })

        if (res.status == 200) {
            const { jwt } = await res.json() as { jwt: string | null }
            return { status: res.status, jwt }
        } else {
            return { status: res.status, jwt: null }
        }
    } catch {
    }

    return { status: 500, jwt: null }
}
