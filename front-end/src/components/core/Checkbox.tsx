import React, { useCallback } from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    value: boolean,
    onChange: (value: boolean) => void,
    children: React.ReactNode
}

export default observer(({ value, onChange, children}: Props) => {
    const handleChange = useCallback(() => onChange(!value), [value, onChange])

    return (
        <label className='checkbox'>
            <input type='checkbox' checked={value} onChange={handleChange}></input>

            {children}
        </label>
    )
})