import React, { FC } from "react"

type Props = {
    onClick: () => void,
    children: React.ReactNode,
}

const Button: FC<Props> = React.memo(({ onClick, children }) => {

    return (
        <button type="button" onClick={onClick}>
            {children}
        </button>
    )
})

export default Button