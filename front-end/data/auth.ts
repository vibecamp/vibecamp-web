import { BACK_END_ORIGIN } from "../public-runtime-config"
import { vibeFetch } from "./_common"

export async function login({ email, password }: { email: string, password: string }): Promise<boolean> {
    try {
        const res = await vibeFetch(BACK_END_ORIGIN + '/api/v1/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        })

        if (res.status == 200) {
            const { jwt } = await res.json()
            setJwtCookie(jwt)
            return true
        }
    } catch {
    }

    return false
}

export function setJwtCookie(jwt: string) {
    document.cookie = 'jwt=' + jwt
}

export function getJwtCookie() {
    return document.cookie.split(';').find(piece => piece.startsWith('jwt='))?.substring(4)
}