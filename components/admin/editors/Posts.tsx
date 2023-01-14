import React, { FC } from "react"
import NavList from "../../common/NavList"

const Posts: FC = React.memo(() => {

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

export default Posts