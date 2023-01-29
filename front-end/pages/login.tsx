
import { FormEvent, useCallback, useState } from "react"
import Button from "../components/common/Button"
import Input from "../components/common/Input"
import { login } from "../api/auth"
import { NextPageWithLayout } from "./_app"

const Login: NextPageWithLayout = () => {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const [outcome, setOutcome] = useState<null | boolean>(null)

    const handleSubmit = useCallback(async (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault()

        const res = await login({ email, password })
        setOutcome(res)
    }, [email, password])

    return (
        <>
            <form onSubmit={handleSubmit}>
                <Input label='Email' type='email' value={email} onChange={setEmail} />
                <Input label='Password' type='password' value={password} onChange={setPassword} />
                <Button type='submit'>
                    Log in
                </Button>

                {outcome === true ?
                    'Success!'
                    : outcome === false ?
                        'Failed'
                        : null}
            </form>
        </>
    )
}

export default Login