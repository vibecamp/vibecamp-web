import React, { ChangeEvent, CSSProperties, HTMLInputTypeAttribute, InputHTMLAttributes, ReactNode, useCallback, useLayoutEffect, useState } from 'react'

import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'
import Icon, { MaterialIconName } from './Icon'

type Props = Omit<CommonFieldProps<string>, 'value'> & {
    placeholderIcon?: MaterialIconName,
    placeholder?: string,
    type?: HTMLInputTypeAttribute,
    multiline?: boolean,
    autoComplete?: InputHTMLAttributes<HTMLInputElement>['autoComplete'],
    value: string | null,
    style?: CSSProperties,
    onEndButtonClick?: () => void,
    endButtonLabel?: ReactNode
}

export default React.memo(({ label, value, onChange, onBlur, disabled, placeholderIcon, placeholder, error, multiline, type, autoComplete, style, onEndButtonClick, endButtonLabel }: Props) => {
    const handleChange = useCallback((e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        onChange(e.target.value)
    }, [onChange])

    const [textarea, setTextarea] = useState<HTMLTextAreaElement | null>(null)

    useLayoutEffect(() => {
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${textarea.scrollHeight + 2}px`
        }
    }, [textarea, value])

    const [isFocused, setIsFocused] = useState(false)
    const handleFocus = useCallback(() => setIsFocused(true), [])
    const handleBlur = useCallback(() => {
        setIsFocused(false)
        onBlur?.()
    }, [onBlur])

    const showPlaceholder = placeholder && !isFocused && !value
    const showEndButton = onEndButtonClick || endButtonLabel

    const sharedProps = {
        value: value ?? '',
        onChange: handleChange,
        onFocus: handleFocus,
        onBlur: handleBlur,
        disabled,
        'aria-placeholder': placeholder,
        'aria-invalid': typeof error === 'string',
        'aria-errormessage': typeof error === 'string' ? error : undefined
    }

    return (
        <label className={'input' + ' ' + (disabled ? 'disabled' : '') + ' ' + (multiline ? 'multiline' : '')} style={style}>
            <div className='label'>{label}</div>

            <div className='input-wrapper'>
                {showPlaceholder && (
                    <span className='placeholder' aria-hidden='true'>
                        {placeholderIcon && <Icon name={placeholderIcon} />}
                        {placeholder}
                    </span>
                )}

                {multiline
                    ? <textarea
                        {...sharedProps}
                        ref={setTextarea}
                    />
                    : <input
                        {...sharedProps}
                        type={type}
                        autoComplete={autoComplete}
                    />}

                {showEndButton && (
                    <button type='button' className='end-button' onClick={onEndButtonClick}>
                        {endButtonLabel}
                    </button>
                )}
            </div>

            <ErrorMessage error={error} />
        </label>
    )
})