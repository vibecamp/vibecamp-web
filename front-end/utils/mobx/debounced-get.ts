import { debounce } from "debounce"
import { makeAutoObservable } from "mobx"

export const debouncedGet = <T>(fn: () => T, ms: number) => new DebouncedGet(fn, ms)

class DebouncedGet<T> {
    constructor(private readonly fn: () => T, private readonly ms: number) {
        makeAutoObservable(this)
    }

    private _value: T = this.fn()

    public updateImmediately = () => {
        this._value = this.fn()
    }
    private updateDebounced = debounce(this.updateImmediately, this.ms)

    public get = () => {
        this.updateDebounced()
        return this._value
    }
}