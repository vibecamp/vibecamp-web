import { autorun, makeObservable, observable } from 'mobx';
import { v4 as uuidv4 } from 'uuid';

export const remote = <T>(fn: () => Promise<T>) => new Remote(fn)

class Remote<T> {
    public readonly dispose: () => void
    private _loading: boolean = false
    private _value: T | undefined = undefined
    private _error: boolean = false

    constructor(private readonly requester: () => Promise<T>) {
        makeObservable(this, {
            // @ts-ignore
            _loading: observable,
            _value: observable,
            _error: observable
        })
        this.dispose = autorun(this.load)
    }

    public get loading() {
        return this._loading
    }

    public get value() {
        return this._value
    }

    public get error() {
        return this._error
    }

    private lastRequestId: string | undefined
    public load = () => {
        const closureRequestId = this.lastRequestId = uuidv4()

        return this.requester()
            .then(res => {
                if (closureRequestId === this.lastRequestId) {
                    this._value = res
                    this._error = false
                }
            })
            .catch(() => {
                if (closureRequestId === this.lastRequestId) {
                    this._value = undefined
                    this._error = true
                }
            })
            .finally(() => {
                if (closureRequestId === this.lastRequestId) {
                    this._loading = false
                }
            })
    }
}