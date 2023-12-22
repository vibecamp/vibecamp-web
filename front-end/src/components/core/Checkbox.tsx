import React from 'react'

import { useStable } from '../../mobx/hooks'
import { observer } from '../../mobx/misc'
import { CommonFieldProps } from './_common'
import ErrorMessage from './ErrorMessage'

type Props = Omit<CommonFieldProps<boolean>, 'label'> & {
    children: React.ReactNode
}

export default observer((props: Props) => {
    const handleChange = useStable(() => () => props.onChange(!props.value))

    return (
        <label className={'checkbox' + ' ' + (props.disabled ? 'disabled' : '')}>
            <input
                type='checkbox'
                checked={props.value}
                onChange={handleChange}
                onBlur={props.onBlur}
                disabled={props.disabled}
                aria-invalid={typeof props.error === 'string'}
                aria-errormessage={typeof props.error === 'string' ? props.error : undefined}
            />

            {props.children}

            <ErrorMessage error={props.error} />
        </label>
    )
})