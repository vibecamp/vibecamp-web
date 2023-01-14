import Head from "next/head"
import { FC } from "react"
import { Page } from "../data/content"
import { renderMarkdown } from "../utils/markdown"

import styles from './DynamicPage.module.scss'
import NavLinks, { LinkInfo } from "./NavLinks"

export type Props = {
    navLinks: readonly LinkInfo[],
    page: Page,
}

const DynamicPage: FC<Props> = ({ navLinks, page }) => {
    const html = renderMarkdown(page.content)

    return <>
        <Head>
            <title>{page.title}</title>
        </Head>
        <NavLinks links={navLinks} />
        <article
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    </>
}

export const pageToLink = (page: Page): LinkInfo => ({ label: page.title, href: `/${page.page_id}` })

export default DynamicPage