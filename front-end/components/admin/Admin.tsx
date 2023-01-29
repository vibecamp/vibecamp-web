import React, { FC, useState } from "react"
import NavList from "../common/NavList"
import Pages from "./editors/Pages"

import styles from './Admin.module.scss'
import { stringToOption } from "../../utils/misc"
import Users from "./editors/Users"
import Posts from "./editors/Posts"
import NavLinks from "./editors/NavLinks"

const Admin: FC = () => {
    const [openSection, setOpenSection] = useState<AdminSection | undefined>(undefined)

    const EditorComponent = openSection ? ADMIN_SECTIONS[openSection] : None

    return (
        <div className={styles.admin}>
            <NavList
                options={NAV_OPTIONS}
                value={openSection}
                onChange={setOpenSection}
            />

            <EditorComponent />
        </div>
    )
}

const None: FC = () => <div></div>

const ADMIN_SECTIONS = {
    'Pages': Pages,
    'Nav Links': NavLinks,
    'Posts': Posts,
    'Users': Users,
} as const
type AdminSection = keyof typeof ADMIN_SECTIONS

const NAV_OPTIONS = (Object.keys(ADMIN_SECTIONS) as AdminSection[]).map(stringToOption)

export default Admin