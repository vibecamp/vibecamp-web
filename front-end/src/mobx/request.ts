import { autorun, IReactionDisposer, observable, runInAction } from 'mobx'

export type RequestObservable<T> = {
    state: RequestState<T>
    load: () => Promise<void>
    dispose: () => void
}

type MutableRequestState<T> =
    | { kind: 'idle', result: Readonly<T> | undefined, error: undefined }
    | { kind: 'loading', result: Readonly<T> | undefined, error: undefined}
    | { kind: 'result', result: Readonly<T>, error: undefined }
    | { kind: 'error', result: Readonly<T> | undefined, error: unknown }

export type RequestState<T> = Readonly<MutableRequestState<T>>

/**
 * Observable MobX abstraction around an async function (usually but not
 * necessarily an API request). Exposes loading/error/response state,
 * and allows triggering a re-fetch.
 *
 * By default it will trigger the request automatically when created, and
 * re-run it if any observed values change. If `{ lazy: true }` is passed,
 * it will only be triggered when `load()` is called.
 */
export function request<T>(fn: () => Promise<T> | T, { lazy, keepLatest }: { lazy?: boolean, keepLatest?: boolean } = {}): RequestObservable<T> {
    let latestRequestId: string | undefined
    async function load() {
        const thisRequestId = latestRequestId = String(Math.random())

        runInAction(() => {
            res.state.kind = 'loading'
            if (!keepLatest) {
                res.state.result = undefined
            }
        })

        try {
            const result = await fn()

            if (thisRequestId === latestRequestId) {
                runInAction(() => {
                    res.state.kind = 'result'
                    res.state.result = result
                })
            }
        } catch (error: unknown) {
            if (thisRequestId === latestRequestId) {
                runInAction(() => {
                    res.state.kind = 'error'
                    res.state.error = error
                    if (!keepLatest) {
                        res.state.result = undefined
                    }
                })
                console.error(error)
            }
        }
    }

    let autorunDisposer: IReactionDisposer | undefined
    const res = observable({
        state: { kind: 'idle', result: undefined, error: undefined } as MutableRequestState<T>,
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