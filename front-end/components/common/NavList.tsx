import React from "react"
import { Option } from '../../utils/types'

import styles from './NavList.module.scss'

type Props<T extends string> = {
    options: readonly Option<T>[],
    value: T | null | undefined,
    onChange: (value: T) => void,
    onAddButtonClick?: () => void
}

const NavList = <T extends string,>({ options, value, onChange, onAddButtonClick }: Props<T>) => {

    return (
        <div className={styles.navList}>
            {options.map(option => {
                function handleClick() {
                    onChange(option.value)
                }

                return (
                    <button className={option.value === value ? styles.selected : undefined} onClick={handleClick} key={option.value}>
                        {option.label ?? option.value}
                    </button>
                )
            })}

            {onAddButtonClick &&
                <button onClick={onAddButtonClick}>
                    + Add
                </button>}
        </div>
    )
}

export default React.memo(NavList) as typeof NavList