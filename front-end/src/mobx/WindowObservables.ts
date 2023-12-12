import { makeAutoObservable } from 'mobx'
import { jsonParse } from '../utils'

class _WindowObservables {
    constructor() {
        makeAutoObservable(this)

        window.addEventListener('resize', () => {
            this._width = window.innerWidth
            this._height = window.innerHeight
        })


        window.addEventListener('hashchange', () => {
            this._hash = window.location.hash
        })
    }

    private _width = window.innerWidth
    private _height = window.innerHeight
    private _hash = window.location.hash

    get width() {
        return this._width
    }
    get height() {
        return this._height
    }
    get hash() {
        return this._hash
    }

    get hashState(): HashState | undefined {
        const parsed = jsonParse(decodeURIComponent(this.hash.substring(1)))

        if (parsed == null || typeof parsed !== 'object') {
            return undefined
        }

        for (const key in parsed) {
            if (typeof key !== 'string' && typeof key !== 'number' && typeof key !== 'boolean' && key !== null) {
                return undefined
            }
        }

        return parsed as HashState
    }

    set hashState(obj: HashState) {
        window.location.hash = encodeURIComponent(JSON.stringify(obj))
    }

    readonly assignHashState = (update: HashState) => {
        this.hashState = { ...this.hashState, ...update }
    }
}

type HashState = Readonly<Record<string, string | number | boolean | null>> & {
    currentView?: string | number | boolean | null,
    ticketPurchaseModalState?: string | number | boolean | null,
    applicationModalOpen?: string | number | boolean | null,
}

const WindowObservables = new _WindowObservables()
export default WindowObservables