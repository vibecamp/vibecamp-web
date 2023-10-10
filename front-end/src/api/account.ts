import { FullAccountInfo } from '../../../back-end/common/data'
import { vibeFetch } from './_common'

export async function getAccountInfo(jwt: string | null): Promise<FullAccountInfo | null> {
    try {
        return await vibeFetch<FullAccountInfo | null>('/account', jwt)
    } catch (e) {
        console.error(e)
        return null
    }
}

export async function submitInviteCode(jwt: string | null, invite_code: string): Promise<boolean> {
    try {
        await vibeFetch<null>('/account/submit-invite-code', jwt, { body: JSON.stringify({ invite_code }) })
        return true
    } catch (e) {
        console.error(e)
    }

    return false
}