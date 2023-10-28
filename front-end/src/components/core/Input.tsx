import React, { ChangeEvent, HTMLInputTypeAttribute, useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { given } from '../../utils'
import { CommonFieldProps } from './_common'

type Props = CommonFieldProps<string> & {
    placeholder?: string,
    type?: HTMLInputTypeAttribute,
    multiline?: boolean,
    autocomplete?: 'new-password' | 'current-password'
}

export default observer(({ label, placeholder, type, disabled, value, onChange, onBlur, error, multiline, autocomplete }: Props) => {
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
                    autoComplete={autocomplete}
                />}

            <div className={`error ${error != null ? 'visible' : ''}`}>
                {error}
            </div>
        </label>
    )
})