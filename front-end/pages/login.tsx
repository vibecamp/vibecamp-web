
import { FormEvent, useCallback, useState } from "react"
import Button from "../components/common/Button"
import Input from "../components/common/Input"
import { login } from "../api/auth"
import { NextPageWithLayout } from "./_app"

import styles from './login.module.scss'
import Spacer from "../components/common/Spacer"
import { getQueryParams } from "../utils/misc"
import { usePromiseLazy } from "../hooks/usePromise"
import { useRouter } from "next/router"

const Login: NextPageWithLayout = () => {
    const router = useRouter()

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const { redirect } = getQueryParams()

    const _submit = useCallback(async () => {
        const success = await login({ email, password })

        if (success) {
            router.push(redirect ?? '/')
        } else {
            throw Error()
        }
    }, [email, password, redirect, router])
    const [submit, submitState] = usePromiseLazy(_submit)

    const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        submit()
    }, [submit])

    return (
        <div className={styles.login}>
            <form onSubmit={handleSubmit}>
                <h1>
                    Log in
                </h1>

                <Spacer size={2} />

                <Input label='Email' type='email' value={email} onChange={setEmail} />

                <Spacer size={1} />

                <Input label='Password' type='password' value={password} onChange={setPassword} />

                <Spacer size={2} />

                <Button type='submit' loading={submitState.kind === 'loading'}>
                    Log in
                </Button>

                {submitState.kind === 'error' && <>
                    <Spacer size={1} />
                    Login failed!
                </>}
            </form>
        </div>
    )
}

export default Login