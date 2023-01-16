import debounce from "debounce"
import produce from "immer"
import React, { FC, useCallback, useEffect, useMemo, useState } from "react"
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
        existingPages?.map(page => ({ label: page.title, value: page.page_id })) ?? []
        , [existingPages])

    const selectPage = useCallback((pageId: string) => {
        const existing = existingPages?.find(page => page.page_id === pageId)
        setSelectedPage(JSON.parse(JSON.stringify(existing)))
    }, [existingPages])

    const addPage = useCallback(() => {
        setSelectedPage(JSON.parse(JSON.stringify(NEW_PAGE)))
    }, [])

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
                if (selectedPage.page_id === '' || selectedPage.page_id === titleToId(selectedPage.title)) {
                    selectedPage.page_id = titleToId(value)
                }

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

    // const handleNavOrderChange = useCallback((value: string) => {
    //     setSelectedPage(selectedPage => produce(selectedPage, selectedPage => {
    //         if (selectedPage) {
    //             selectedPage.nav_order = Number(value)
    //         }
    //     }))
    // }, [])

    const selectedPageContent = selectedPage?.content ?? ''
    const [previewHtml, setPreviewHtml] = useState('')
    const renderPreviewHtmlDebounced = useMemo(() => debounce((selectedPageContent: string) => {
        setPreviewHtml(renderMarkdown(selectedPageContent))
    }, 200), [])
    useEffect(() =>
        renderPreviewHtmlDebounced(selectedPageContent)
        , [renderPreviewHtmlDebounced, selectedPageContent])

    return (
        <>
            <NavList
                options={navOptions}
                value={selectedPage?.page_id}
                onChange={selectPage}
                onAddButtonClick={addPage}
            />

            <div className={styles.editSection}>
                {selectedPage && <>
                    <Input label='Title' value={selectedPage.title} onChange={handleTitleChange} />
                    <Input label='ID (Page URL)' value={selectedPage.page_id} onChange={handleIDChange} />
                    <TextArea label='Content' value={selectedPage.content} onChange={handleContentChange} />
                    <Dropdown label='Visibility' value={selectedPage.visibility_level} onChange={handleVisibilityChange} options={VISIBILITY_OPTIONS} />
                    {/* <Input label='Nav order' value={selectedPage.nav_order + ''} onChange={handleNavOrderChange} /> */}
                </>}
            </div>

            <article
                className={styles.previewSection}
                dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
        </>
    )
})

function titleToId(title: string) {
    return encodeURIComponent(title.replaceAll(/[\s]+/g, '-').replaceAll(/[',?#$!()]/g, ''))
}

const NEW_PAGE: Page = {
    page_id: '',
    title: '',
    content: '',
    visibility_level: 'admins'
}

const VISIBILITY_OPTIONS = VISIBILITY_LEVELS.map(stringToOption)

export default Pages