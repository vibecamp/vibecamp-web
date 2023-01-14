import React from "react"
import { Option } from '../../utils/types'

import styles from './Dropdown.module.scss'

type Props<T extends string> = {
    label: string,
    placeholder?: string,
    options: readonly Option<T>[],
    value: T | null | undefined,
    onChange: (value: T) => void,
}

const Dropdown = <T extends string,>({ label, placeholder, options, value, onChange }: Props<T>) => {

    return (
        <div className={styles.component}>
            <div className={styles.label}>
                {label}
            </div>
            <select>
                {options.map(option => {
                    function handleClick() {
                        onChange(option.value)
                    }

                    return (
                        <option value={option.value} onClick={handleClick} key={option.value}>
                            {option.label ?? option.value}
                        </option>
                    )
                })}
            </select>
        </div>
    )
}

export default React.memo(Dropdown) as typeof Dropdown