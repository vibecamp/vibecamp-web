import { BACK_END_ORIGIN } from "../public-runtime-config"

export async function login({ email, password }: { email: string, password: string }): Promise<boolean> {
    try {
        const res = await fetch(BACK_END_ORIGIN + '/api/v1/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        })

        if (res.status == 200) {
            return true
        }
    } catch {
    }

    return false
}