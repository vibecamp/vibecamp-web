import React, { ChangeEvent, HTMLInputTypeAttribute, useCallback, useRef } from 'react'
import { observer } from 'mobx-react-lite'
import { given } from '../../utils'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

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

    const sharedProps = {
        value,
        onChange: handleChange,
        onBlur,
        disabled,
        placeholder,
        'aria-invalid': error != null,
        'aria-errormessage': error
    }

    return (
        <label className={'input' + ' ' + (disabled ? 'disabled' : '')}>
            <div className='label'>{label}</div>

            {multiline
                ? <textarea
                    {...sharedProps}
                    style={{ height: textareaHeight }}
                    ref={textarea}
                />
                : <input
                    {...sharedProps}
                    type={type} 
                    autoComplete={autocomplete}
                />}

            <ErrorMessage error={error} />
        </label>
    )
})