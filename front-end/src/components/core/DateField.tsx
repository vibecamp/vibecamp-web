/* eslint-disable @typescript-eslint/ban-types */
import dayjs, { Dayjs } from 'dayjs'
import { autorun } from 'mobx'
import React, { ChangeEvent } from 'react'

import { useObservableClass } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<Dayjs | null>

export default observer((props: Props) => {
    const state = useObservableClass(class {
        strValue = props.value == null ? '' : formatNoTimezone(props.value)

        readonly strUpdater = autorun(() => {
            if (props.value != null) {
                this.strValue = formatNoTimezone(props.value)
            }
        })

        readonly handleChange = (e: ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value

            this.strValue = value

            const date = dayjs(value)
            if (date.isValid()) {
                props.onChange(date)
            } else {
                props.onChange(null)
            }
        }
    })

    return (
        <label className={'date-field' + ' ' + (props.disabled ? 'disabled' : '')}>
            <div className='label'>{props.label}</div>

            <input
                type='datetime-local'
                value={state.strValue ?? ''}
                onChange={state.handleChange}
                disabled={props.disabled}
                onBlur={props.onBlur}
            />

            <ErrorMessage error={props.error} />
        </label>
    )
})

export const formatNoTimezone = (d: Dayjs) => d.format().replace(/:[0-9]+-[0-9]+:[0-9]+$/, '')