import { autorun } from 'mobx'
import React from 'react'
import { ChangeEvent } from 'react'

import { useObservableClass } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<number | null> & {
    placeholder?: string
}

export default observer((props: Props) => {
    const state = useObservableClass(class {
        strValue = String(props.value)

        readonly strUpdater = autorun(() => {
            this.strValue = String(props.value)
        })

        readonly handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value

            this.strValue = value

            if (value !== '' && !isNaN(Number(value))) {
                props.onChange(Number(value))
            }
        }
    })

    return (
        <label className='number-input'>
            <div className='label'>{props.label}</div>

            <input
                type='number'
                inputMode='numeric'
                placeholder={props.placeholder}
                step={1}
                value={state.strValue}
                onChange={state.handleChange}
                ref={disableWheel}
                onBlur={props.onBlur}
                disabled={props.disabled}
            />

            <ErrorMessage error={props.error} />
        </label>
    )
})

const LISTENER_ADDED = 'listenerAdded'
type WithListenerAddedFlag = { [LISTENER_ADDED]?: boolean }

function disableWheel(_ref: HTMLInputElement | null) {
    const ref = _ref as (HTMLInputElement & WithListenerAddedFlag) | null

    if (ref != null && !ref[LISTENER_ADDED]) {
        ref[LISTENER_ADDED] = true
        ref.addEventListener('wheel', e => e.preventDefault(), { passive: false })
    }
}
