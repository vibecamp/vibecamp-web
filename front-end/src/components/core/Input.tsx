import React, { ChangeEvent, HTMLInputTypeAttribute, useCallback, useState } from 'react'

import { given } from '../../../../back-end/utils/misc'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<string> & {
    placeholder?: string,
    type?: HTMLInputTypeAttribute,
    multiline?: boolean,
    autocomplete?: 'new-password' | 'current-password'
}

export default React.memo(({ label, value, onChange, onBlur, disabled, placeholder, error, multiline, type, autocomplete }: Props) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value)
    }, [onChange])

    const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null)
    const textareaHeight = given(textarea?.scrollHeight, scrollHeight => scrollHeight + 2) ?? undefined

    const sharedProps = {
        value,
        onChange: handleChange,
        onBlur,
        disabled,
        placeholder,
        'aria-invalid': typeof error === 'string',
        'aria-errormessage': typeof error === 'string' ? error : undefined
    }

    return (
        <label className={'input' + ' ' + (disabled ? 'disabled' : '')}>
            <div className='label'>{label}</div>

            {multiline
                ? <textarea
                    {...sharedProps}
                    style={{ height: textareaHeight }}
                    ref={setTextarea}
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