import produce from "immer"
import React, { FC, useCallback, useMemo, useState } from "react"
import { getPublicPages, Page, VisibilityLevel, VISIBILITY_LEVELS } from "../../../data/content"
import { usePromise } from "../../../hooks/usePromise"
import { renderMarkdown } from "../../../utils/markdown"
import { stringToOption } from "../../../utils/misc"
import Dropdown from "../../common/Dropdown"
import Input from "../../common/Input"
import NavList from "../../common/NavList"
import TextArea from "../../common/TextArea"

import styles from './Pages.module.scss'

const Pages: FC = React.memo(() => {
    const existingPagesResult = usePromise(getPublicPages)
    const [selectedPage, setSelectedPage] = useState<Page | null>(null)

    const existingPages = existingPagesResult.kind === 'value' ? existingPagesResult.value : null

    const navOptions = useMemo(() =>
        existingPages?.slice().sort((a, b) => (a.nav_order ?? 0) - (b.nav_order ?? 0)).map(page => ({ label: page.title, value: page.page_id })) ?? []
        , [existingPages])

    const selectPage = useCallback((pageId: string) => {
        const existing = existingPages?.find(page => page.page_id === pageId)
        setSelectedPage(JSON.parse(JSON.stringify(existing)))
    }, [existingPages])

    const handleIDChange = useCallback((value: string) => {
        setSelectedPage(selectedPage => produce(selectedPage, selectedPage => {
            if (selectedPage) {
                selectedPage.page_id = value
            }
        }))
    }, [])

    const handleTitleChange = useCallback((value: string) => {
        setSelectedPage(selectedPage => produce(selectedPage, selectedPage => {
            if (selectedPage) {
                selectedPage.title = value
            }
        }))
    }, [])

    const handleContentChange = useCallback((value: string) => {
        setSelectedPage(selectedPage => produce(selectedPage, selectedPage => {
            if (selectedPage) {
                selectedPage.content = value
            }
        }))
    }, [])

    const handleVisibilityChange = useCallback((value: VisibilityLevel) => {
        setSelectedPage(selectedPage => produce(selectedPage, selectedPage => {
            if (selectedPage) {
                selectedPage.visibility_level = value
            }
        }))
    }, [])

    const handleNavOrderChange = useCallback((value: string) => {
        setSelectedPage(selectedPage => produce(selectedPage, selectedPage => {
            if (selectedPage) {
                selectedPage.nav_order = Number(value)
            }
        }))
    }, [])

    const previewHtml = useMemo(() => selectedPage ? renderMarkdown(selectedPage.content) : '', [selectedPage])

    return (
        <>
            <NavList
                options={navOptions}
                value={selectedPage?.page_id}
                onChange={selectPage}
            />

            <div className={styles.editSection}>
                {selectedPage && <>
                    <Input label='ID' value={selectedPage.page_id} onChange={handleIDChange} />
                    <Input label='Title' value={selectedPage.title} onChange={handleTitleChange} />
                    <TextArea label='Content' value={selectedPage.content} onChange={handleContentChange} />
                    <Dropdown label='Visibility' value={selectedPage.visibility_level} onChange={handleVisibilityChange} options={VISIBILITY_OPTIONS} />
                    <Input label='Nav order' value={selectedPage.nav_order + ''} onChange={handleNavOrderChange} />
                </>}
            </div>

            <article
                className={styles.previewSection}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
        </>
    )
})

const VISIBILITY_OPTIONS = VISIBILITY_LEVELS.map(stringToOption)

export default Pages