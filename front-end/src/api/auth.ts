import Store from '../Store'

const BACK_END_ORIGIN = 'https://backend-ssp4.onrender.com'

export async function login({ email, password }: { email: string, password: string }): Promise<boolean> {
    try {
        const res = await fetch(BACK_END_ORIGIN + '/api/v1/login', {
            method: 'POST',
            body: JSON.stringify({ email, password }),
            credentials: 'include'
        })

        if (res.status == 200) {
            const { jwt } = await res.json() as { jwt: string | null }

            if (jwt == null) {
                return false
            }

            localStorage.setItem('jwt', jwt)
            Store.jwt = jwt

            return true
        }
    } catch {
    }

    return false
}
