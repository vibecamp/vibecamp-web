function requireEnvVar(name: string) {
    const value = process.env[name]

    if (!value) {
        throw Error(`Expected environment variable ${name} wasn't found`)
    }

    return value
}

export default {
    BACK_END_ORIGIN: requireEnvVar('NEXT_PUBLIC_BACK_END_ORIGIN'),
    STRIPE_PUBLIC_KEY: requireEnvVar('NEXT_PUBLIC_STRIPE_PUBLIC_KEY'),
}