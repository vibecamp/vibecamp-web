/* eslint-disable @typescript-eslint/ban-types */
import dayjs, { Dayjs } from 'dayjs'
import React, { ChangeEvent } from 'react'

import { useObservableClass } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<Dayjs | null>

export default observer((props: Props) => {
    const state = useObservableClass(class {
        get valueString() {
            return props.value?.format().replace(/:[0-9]+-[0-9]+:[0-9]+$/, '') ?? ''
        }

        readonly handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            const date = dayjs(e.target.value)
            if (date.isValid()) {
                props.onChange(date)
            }
        }
    })

    return (
        <label className={'date-field' + ' ' + (props.disabled ? 'disabled' : '')}>
            <div className='label'>{props.label}</div>

            <input
                type='datetime-local'
                value={state.valueString}
                onChange={state.handleChange}
                disabled={props.disabled}
                onBlur={props.onBlur}
            />

            <ErrorMessage error={props.error} />
        </label>
    )
})
