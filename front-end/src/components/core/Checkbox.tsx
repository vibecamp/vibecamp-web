import React, { useCallback } from 'react'
import { observer } from 'mobx-react-lite'
import { CommonFieldProps } from './_common'

type Props = Omit<CommonFieldProps<boolean>, 'label'> & {
    children: React.ReactNode
}

export default observer(({ value, onChange, error, onBlur, children}: Props) => {
    const handleChange = useCallback(() => onChange(!value), [value, onChange])

    return (
        <label className='checkbox'>
            <input type='checkbox' checked={value} onChange={handleChange} onBlur={onBlur}></input>

            {children}

            <div className={`error ${error != null ? 'visible' : ''}`}>
                {error}
            </div>
        </label>
    )
})