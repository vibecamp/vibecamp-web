import { IReactionDisposer, observable, autorun } from 'mobx'

export type RequestObservable<T> = {
    state: RequestState<T>
    load: () => void
    dispose: () => void
}

export type RequestState<T> =
    | { readonly kind: 'idle', readonly result: undefined }
    | { readonly kind: 'loading', readonly result: undefined }
    | { readonly kind: 'result', readonly result: T }
    | { readonly kind: 'error', readonly result: undefined, readonly error: unknown }

export function request<T>(fn: () => Promise<T> | T, { lazy }: { lazy?: boolean } = {}): RequestObservable<T> {
    let latestRequestId: string | undefined
    async function load() {
        const thisRequestId = latestRequestId = String(Math.random())

        res.state = { kind: 'loading', result: undefined }

        try {
            const result = await fn()

            if (thisRequestId === latestRequestId) {
                res.state = { kind: 'result', result }
            }
        } catch (error: unknown) {
            if (thisRequestId === latestRequestId) {
                res.state = { kind: 'error', error, result: undefined }
                console.error(error)
            }
        }
    }

    let autorunDisposer: IReactionDisposer | undefined
    const res: RequestObservable<T> = observable({
        state: { kind: 'idle', result: undefined },
        load,
        dispose: () => {
            autorunDisposer?.()
        }
    })

    if (!lazy) {
        // HACK: setTimeout to delay autorun until (probably) all observed
        // values have been made observable by makeAutoObservable
        setTimeout(() => {
            autorunDisposer = autorun(load)
        }, 0)
    }

    return res
}