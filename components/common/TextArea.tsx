
import React, { ChangeEvent, FC } from "react"
import Spacer from "./Spacer"

import styles from './TextArea.module.scss'

type Props = {
    label: string,
    placeholder?: string,
    value: string,
    onChange: (value: string) => void,
}

const TextArea: FC<Props> = React.memo(({ label, placeholder, value, onChange }) => {
    function handleChange(e: ChangeEvent<HTMLTextAreaElement>) {
        onChange(e.target.value)
    }

    return (
        <div className={styles.component}>
            <div className={styles.label}>
                {label}
            </div>
            <Spacer size={1} />
            <textarea className={styles.textarea} value={value} onChange={handleChange} />
        </div>
    )
})

export default TextArea