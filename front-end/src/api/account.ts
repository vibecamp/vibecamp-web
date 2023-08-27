import { FullAccountInfo } from '../../../common/data'
import { vibeFetch } from './_common'

const BACK_END_ORIGIN = 'https://backend-ssp4.onrender.com'

export async function getAccountInfo(): Promise<FullAccountInfo | null> {
    try {
        return await vibeFetch<FullAccountInfo | null>(BACK_END_ORIGIN + '/api/v1/account')
    } catch {
        return null
    }
}
