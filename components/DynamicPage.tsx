import Head from "next/head"
import { FC } from "react"
import { LinkInfo, Page } from "../data/content"
import useIsOnMobile from "../hooks/useIsOnMobile"

import styles from './DynamicPage.module.scss'
import MobileNav from "./MobileNav"
import NavLinks from "./NavLinks"

export type Props = {
    navLinks: readonly LinkInfo[],
    page: Page,
    html: string,
}

const DynamicPage: FC<Props> = ({ navLinks, page, html }) => {
    const isOnMobile = useIsOnMobile()

    return <>
        <Head>
            <title>{page.title}</title>
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

export const pageToLink = (page: Page): LinkInfo => ({ label: page.title, href: `/${page.page_id}` })

export default DynamicPage