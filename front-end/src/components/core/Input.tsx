import React, { ChangeEvent, HTMLInputTypeAttribute, useRef } from 'react'

import { given } from '../../../../back-end/utils/misc'
import { useStable } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = CommonFieldProps<string> & {
    placeholder?: string,
    type?: HTMLInputTypeAttribute,
    multiline?: boolean,
    autocomplete?: 'new-password' | 'current-password'
}

export default observer((props: Props) => {
    const handleChange = useStable(() => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        props.onChange(e.target.value)
    })

    const textarea = useRef<HTMLTextAreaElement | null>(null)
    const textareaHeight = given(textarea.current?.scrollHeight, scrollHeight => scrollHeight + 2) ?? undefined

    const sharedProps = {
        value: props.value,
        onChange: handleChange,
        onBlur: props.onBlur,
        disabled: props.disabled,
        placeholder: props.placeholder,
        'aria-invalid': typeof props.error === 'string',
        'aria-errormessage': typeof props.error === 'string' ? props.error : undefined
    }

    return (
        <label className={'input' + ' ' + (props.disabled ? 'disabled' : '')}>
            <div className='label'>{props.label}</div>

            {props.multiline
                ? <textarea
                    {...sharedProps}
                    style={{ height: textareaHeight }}
                    ref={textarea}
                />
                : <input
                    {...sharedProps}
                    type={props.type}
                    autoComplete={props.autocomplete}
                />}

            <ErrorMessage error={props.error} />
        </label>
    )
})