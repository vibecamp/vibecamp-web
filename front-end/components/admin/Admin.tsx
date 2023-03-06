import React, { FC, useContext, useMemo, useState } from "react"
import NavList from "../common/NavList"
import Pages from "./editors/Pages"

import styles from './Admin.module.scss'
import { stringToOption } from "../../utils/misc"
import Users from "./editors/Users"
import Posts from "./editors/Posts"
import Button from "../common/Button"
import { deployStaticSite } from "../../api/content"
import NavLinks from "./editors/NavLinks"
import Link from "../common/Link"
import Spacer from "../common/Spacer"
import { UserInfoContext } from "../../pages/_app"

const Admin: FC = () => {
    const { userInfo } = useContext(UserInfoContext)
    const [openSection, setOpenSection] = useState<AdminSection | undefined>(undefined)

    const EditorComponent = openSection ? ADMIN_SECTIONS[openSection] : None

    const options = useMemo(() => {
        const allOptions = (Object.keys(ADMIN_SECTIONS) as AdminSection[]).map(stringToOption)

        return (
            !userInfo?.is_account_admin
                ? allOptions.filter(option => !ADMIN_SECTIONS[option.value].accountAdminsOnly)
                : allOptions
        )
    }, [userInfo?.is_account_admin])

    if (!userInfo?.is_content_admin && !userInfo?.is_account_admin) {
        return (
            <>
                Please <Link href='/login'>log in</Link> to access admin UI
            </>
        )
    }

    return (
        <>

            <div className={styles.navBar}>
                <Button appearance='primary' onClick={deployStaticSite}>
                    Publish changes to live site
                </Button>
                <Spacer size={2} />
                <Link href='/' openInNewTab>
                    Open main site ↗
                </Link>

                {/* TODO: Show current username, logout button */}
            </div>

            <div className={styles.admin}>
                <NavList
                    options={options.filter(option => option.value)}
                    value={openSection}
                    onChange={setOpenSection}
                />

                <EditorComponent />
            </div>
        </>
    )
}

const None: FC = () => <div></div>

const ADMIN_SECTIONS = {
    'Pages': {
        component: Pages,
        accountAdminsOnly: false
    },
    'Nav Links': {
        component: NavLinks,
        accountAdminsOnly: false
    },
    'Posts': {
        component: Posts,
        accountAdminsOnly: false
    },
    'Users': {
        component: Users,
        accountAdminsOnly: true
    },
} as const
type AdminSection = keyof typeof ADMIN_SECTIONS

export default Admin