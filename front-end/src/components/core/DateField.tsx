/* eslint-disable @typescript-eslint/ban-types */
import React, { ChangeEvent } from 'react'
import { observer } from 'mobx-react-lite'
import { CommonFieldProps } from './_common'
import { useStable } from '../../mobx/hooks'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<Date | null>

export default observer(({ label, value, onChange, error, onBlur, disabled }: Props) => {
    const handleChange = useStable(() => (e: ChangeEvent<HTMLInputElement>) => {
        try {
            const date = new Date(e.target.value)

            if (!isNaN(date as any)) {
                onChange(date)
            }
        } catch {
        }
    })

    return (

        <label className={'date-field' + ' ' + (disabled ? 'disabled' : '')}>
            <div className='label'>{label}</div>

            <input
                type='datetime-local'
                defaultValue={value?.toISOString() ?? ''}
                onChange={handleChange}
                disabled={disabled}
                onBlur={onBlur}
            />

            <ErrorMessage error={error} />
        </label>
    )
})
