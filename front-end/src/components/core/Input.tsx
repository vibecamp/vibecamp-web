import React, { ChangeEvent, HTMLInputTypeAttribute, useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { given } from '../../utils'

type Props = {
    label: string,
    placeholder?: string,
    type?: HTMLInputTypeAttribute,
    disabled?: boolean,
    value: string,
    onChange: (val: string) => void,
    onBlur?: () => void,
    error?: string | undefined,
    multiline?: boolean
}

export default observer(({ label, placeholder, type, disabled, value, onChange, onBlur, error, multiline }: Props) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value)
    }, [onChange])

    const textarea = useRef<HTMLTextAreaElement | null>(null)
    const textareaHeight = given(textarea.current?.scrollHeight, scrollHeight => scrollHeight + 2) ?? undefined

    return (
        <label className='input'>
            <div>{label}</div>

            {multiline
                ? <textarea
                    value={value}
                    onChange={handleChange} 
                    onBlur={onBlur} 
                    disabled={disabled}
                    placeholder={placeholder}
                    style={{ height: textareaHeight }}
                    ref={textarea}
                />
                : <input
                    value={value}
                    onChange={handleChange} 
                    onBlur={onBlur}
                    type={type} 
                    disabled={disabled} 
                    placeholder={placeholder}
                />}

            <div className={`error ${error != null ? 'visible' : ''}`}>
                {error}
            </div>
        </label>
    )
})