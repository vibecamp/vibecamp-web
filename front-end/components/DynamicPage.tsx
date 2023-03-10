import Head from "next/head"
import { FC } from "react"
import { NavLink } from "../../common/data"
import useIsOnMobile from "../hooks/useIsOnMobile"

import styles from './DynamicPage.module.scss'
import MobileNav from "./MobileNav"
import NavLinks from "./NavLinks"

export type Props = {
    navLinks: readonly NavLink[],
    title: string,
    html: string,
}

const DynamicPage: FC<Props> = ({ navLinks, title, html }) => {
    const isOnMobile = useIsOnMobile()

    return <>
        <Head>
            <title>{title}</title>
        </Head>

        {isOnMobile
            ? <MobileNav links={navLinks} />
            : <NavLinks links={navLinks} />}

        <article
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    </>
}

export default DynamicPage