'use client'

import {
    type ChangeEvent,
    type HTMLInputTypeAttribute,
    type InputHTMLAttributes,
    useCallback,
    useId,
    useLayoutEffect,
    useState,
} from 'react'
import { classNames } from '@/lib/ui'
import type { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = Omit<CommonFieldProps<string>, 'value'> & {
    placeholder?: string
    type?: HTMLInputTypeAttribute
    multiline?: boolean
    autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete']
    inputMode?: InputHTMLAttributes<HTMLInputElement>['inputMode']
    value: string | null
}

export default function Input({
    label,
    value,
    onChange,
    onBlur,
    disabled,
    placeholder,
    error,
    multiline,
    type,
    autoComplete,
    inputMode,
}: Props) {
    const id = useId()
    const handleChange = useCallback(
        (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
            onChange(e.target.value)
        },
        [onChange],
    )

    const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null)

    useLayoutEffect(() => {
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${textarea.scrollHeight + 2}px`
        }
    }, [textarea])

    const [isFocused, setIsFocused] = useState(false)
    const handleFocus = useCallback(() => setIsFocused(true), [])
    const handleBlur = useCallback(() => {
        setIsFocused(false)
        onBlur?.()
    }, [onBlur])

    const showPlaceholder = placeholder && !isFocused && !value

    const sharedProps = {
        id,
        value: value ?? '',
        onChange: handleChange,
        onFocus: handleFocus,
        onBlur: handleBlur,
        disabled,
    }

    return (
        <label
            htmlFor={id}
            className={classNames(
                'input',
                disabled && 'disabled',
                multiline && 'multiline',
                !!error && 'hasError',
            )}
        >
            {label && (
                <div id={`${id}-label`} className='label'>
                    {label}
                </div>
            )}

            <div className='input-wrapper'>
                {showPlaceholder && <span className='placeholder'>{placeholder}</span>}

                {multiline ? (
                    <textarea {...sharedProps} ref={setTextarea} />
                ) : (
                    <input
                        {...sharedProps}
                        type={type}
                        autoComplete={autoComplete}
                        inputMode={inputMode}
                    />
                )}
            </div>

            <div id={`${id}-error`}>
                <ErrorMessage error={error} />
            </div>
        </label>
    )
}
