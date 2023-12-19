/* eslint-disable @typescript-eslint/ban-types */
import React, { ChangeEvent } from 'react'

import { useStable } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<Date | null>

export default observer((props: Props) => {
    const handleChange = useStable(() => (e: ChangeEvent<HTMLInputElement>) => {
        try {
            const date = new Date(e.target.value)

            if (!isNaN(date as any)) {
                props.onChange(date)
            }
        } catch {
        }
    })

    return (

        <label className={'date-field' + ' ' + (props.disabled ? 'disabled' : '')}>
            <div className='label'>{props.label}</div>

            <input
                type='datetime-local'
                defaultValue={props.value?.toISOString() ?? ''}
                onChange={handleChange}
                disabled={props.disabled}
                onBlur={props.onBlur}
            />

            <ErrorMessage error={props.error} />
        </label>
    )
})
