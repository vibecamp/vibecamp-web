import { autorun, makeAutoObservable } from "mobx"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { NavLink } from "../../../../common/data"
import { getNavLinks, updateNavLinks } from "../../../api/content"
import { remote } from "../../../utils/mobx/remote"
import Button from "../../common/Button"
import Input from "../../common/Input"
import Spacer from "../../common/Spacer"
import SaveOrDiscard from "../SaveOrDiscard"

import styles from './NavLinks.module.scss'

class _NavLinksStore {
    constructor() {
        makeAutoObservable(this)

        autorun(() => {
            if (this.loadedNavLinks.value) {
                this.navLinksBeingEdited = JSON.parse(JSON.stringify(this.loadedNavLinks.value))
            }
        })
    }

    initializeForEditing = () => {
        if (this.loadedNavLinks.value) {
            this.navLinksBeingEdited = JSON.parse(JSON.stringify(this.loadedNavLinks.value))
        }
    }

    readonly loadedNavLinks = remote(getNavLinks)

    navLinksBeingEdited: NavLink[] | undefined = undefined

    saveChanges = async () => {
        if (this.navLinksBeingEdited != null) {
            this.savingChanges = true
            try {
                await updateNavLinks(this.navLinksBeingEdited)
            } finally {
                this.savingChanges = false
            }
        }
    }
    savingChanges = false
}
const NavLinksStore = new _NavLinksStore()

const NavLinks: FC = observer(() => {
    return (
        <>
            <div className={styles.editor}>
                <SaveOrDiscard
                    onSave={NavLinksStore.saveChanges}
                    onCancel={NavLinksStore.initializeForEditing}
                />

                <Spacer size={4} />

                {NavLinksStore.navLinksBeingEdited?.map((navLink, index) => {

                    return (
                        <React.Fragment key={index}>
                            {index > 0 &&
                                <Spacer size={2} />}

                            <div className={styles.navLink}>
                                <Input label='Label' value={navLink.label} onChange={val => navLink.label = val} />
                                <Spacer size={2} />
                                <Input label='URL or path' value={navLink.href} onChange={val => navLink.href = val} />
                                <Spacer size={2} />
                                <Input label='Nav order' value={String(navLink.nav_order)} onChange={val => navLink.nav_order = Number(val)} />
                            </div>
                        </React.Fragment>
                    )
                })}
            </div>
        </>
    )
})

const NEW_NAV_LINK: NavLink = {
    href: '',
    label: '',
    nav_order: 0,
}

export default NavLinks