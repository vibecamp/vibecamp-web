import React, { ChangeEvent, useCallback } from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    label: string,
    value: string,
    onChange: (val: string) => void,
    error?: string | undefined,
    suggestions?: string[]
}

export default observer(({ label, value, onChange, error, suggestions }: Props) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value)
    }, [onChange])

    return (
        <label className='input'>
            <div>{label}</div>
            <input value={value} onChange={handleChange} />
        </label>
    )
})