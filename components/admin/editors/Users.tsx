import React, { FC } from "react"
import NavList from "../../common/NavList"

const Users: FC = React.memo(() => {

    return (
        <>
            <NavList
                options={[]}
            // value={selectedPage?.page_id}
            // onChange={selectPage}
            />

        </>
    )
})

export default Users