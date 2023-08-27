import React, { ChangeEvent, HTMLInputTypeAttribute, useCallback } from 'react'
import { observer } from 'mobx-react-lite'

type Props = {
    label: string,
    type?: HTMLInputTypeAttribute,
    value: string,
    onChange: (val: string) => void,
    onBlur?: () => void,
    error?: string | undefined,
    suggestions?: string[]
}

export default observer(({ label, type, value, onChange, onBlur, error, suggestions }: Props) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        onChange(e.target.value)
    }, [onChange])

    return (
        <label className='input'>
            <div>{label}</div>
            <input value={value} onChange={handleChange} onBlur={onBlur} type={type} />

            <div className={`error ${error != null ? 'visible' : ''}`}>
                {error}
            </div>
        </label>
    )
})