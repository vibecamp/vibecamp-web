
import React, { ChangeEvent, FC } from "react"

import styles from './Input.module.scss'

type Props = {
    type?: 'password' | 'email',
    label: string,
    placeholder?: string,
    value: string,
    onChange: (value: string) => void,
}

const Input: FC<Props> = React.memo(({ type, label, placeholder, value, onChange }) => {
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        onChange(e.target.value)
    }

    return (
        <div className={styles.component}>
            <div className={styles.label}>
                {label}
            </div>
            <input type={type} value={value} onChange={handleChange} />
        </div>
    )
})

export default Input