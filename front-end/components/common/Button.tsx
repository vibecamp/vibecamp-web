import { type } from "os"
import React, { FC } from "react"
import styles from './Button.module.scss'
import Spacer from "./Spacer"

type Props = {
    type?: 'button' | 'submit',
    onClick?: () => void,
    children: React.ReactNode,
    appearance?: 'primary' | 'secondary' | 'danger',
    loading?: boolean,
    disabled?: boolean
}

const Button: FC<Props> = React.memo(({ type = 'button', onClick, children, appearance = 'secondary', loading, disabled }) => {
    const className = (
        styles.component +
        (' ' + styles[appearance])
    )

    return (
        <button className={className} type={type} onClick={onClick} disabled={loading || disabled}>
            {children}

            {loading &&
                <>
                    <Spacer size={1} />
                    <img src="/loading-spinner.gif" width={16} height={16}></img>
                </>}
        </button>
    )
})

export default Button