
import React, { ChangeEvent, FC } from "react"
import Spacer from "./Spacer"

import styles from './Input.module.scss'

type Props = {
    label: string,
    placeholder?: string,
    value: string,
    onChange: (value: string) => void,
}

const Input: FC<Props> = React.memo(({ label, placeholder, value, onChange }) => {
    function handleChange(e: ChangeEvent<HTMLInputElement>) {
        onChange(e.target.value)
    }

    return (
        <div className={styles.component}>
            <div className={styles.label}>
                {label}
            </div>
            <Spacer size={1} />
            <input value={value} onChange={handleChange} />
        </div>
    )
})

export default Input