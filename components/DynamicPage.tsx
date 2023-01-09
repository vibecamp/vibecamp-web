import MarkdownIt from "markdown-it"
import { FC } from "react"
import { Page } from "../data/content"

import styles from './DynamicPage.module.scss'
import NavLinks, { LinkInfo } from "./NavLinks"

export type Props = {
    navLinks: readonly LinkInfo[],
    page: Page,
}

const DynamicPage: FC<Props> = ({ navLinks, page }) => {
    const md = new MarkdownIt()
    const html = md.render(page.content)

    return <>
        <NavLinks links={navLinks} />
        <main
            className={styles.content}
            dangerouslySetInnerHTML={{ __html: html }}
        />
    </>
}

export const pageToLink = (page: Page): LinkInfo => ({ label: page.title, href: `/${page.page_id}` })

export default DynamicPage