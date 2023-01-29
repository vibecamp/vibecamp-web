import { BACK_END_ORIGIN } from "../public-runtime-config"
import { isClientSide } from "../utils/misc"

export async function login({ email, password }: { email: string, password: string }): Promise<boolean> {
    try {
        const res = await fetch(BACK_END_ORIGIN + '/api/v1/login', {
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
    if (isClientSide()) {
        document.cookie = 'jwt=' + jwt
    }
}

export function getJwtCookie() {
    return isClientSide()
        ? document.cookie.split(';').find(piece => piece.startsWith('jwt='))?.substring(4)
        : undefined
}