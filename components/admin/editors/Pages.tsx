import debounce from "debounce"
import produce from "immer"
import React, { FC, useCallback, useEffect, useMemo, useState } from "react"
import { getPublicPages, Page, savePage, VisibilityLevel, VISIBILITY_LEVELS } from "../../../data/content"
import { usePromise } from "../../../hooks/usePromise"
import { renderMarkdown } from "../../../utils/markdown"
import { stringToOption } from "../../../utils/misc"
import Button from "../../common/Button"
import Dropdown from "../../common/Dropdown"
import Input from "../../common/Input"
import NavList from "../../common/NavList"
import Spacer from "../../common/Spacer"
import TextArea from "../../common/TextArea"

import styles from './Pages.module.scss'

const Pages: FC = React.memo(() => {
    const [loadPages, existingPagesResult] = usePromise(getPublicPages)
    const [selectedPageId, setSelectedPageId] = useState<string | null>(null)
    const [editingPage, setEditingPage] = useState<Page | null>(null)

    const existingPages = existingPagesResult.kind === 'value' ? existingPagesResult.value : null

    const [modifiedCurrent, setModifiedCurrent] = useState(false)

    const navOptions = useMemo(() =>
        existingPages?.map(page => ({ label: page.title, value: page.page_id })) ?? []
        , [existingPages])

    useEffect(() => {
        const existing = existingPages?.find(page => page.page_id === selectedPageId)
        if (existing) {
            setEditingPage(JSON.parse(JSON.stringify(existing)))
        }
    }, [existingPages, selectedPageId])

    const addPage = useCallback(() => {
        setEditingPage(JSON.parse(JSON.stringify(NEW_PAGE)))
        setModifiedCurrent(true)
    }, [])

    const saveChanges = useCallback(async () => {
        if (editingPage) {
            await savePage(editingPage)
            setSelectedPageId(editingPage?.page_id)
            await loadPages()
            setModifiedCurrent(false)
        }
    }, [editingPage, loadPages])

    const discardChanges = useCallback(() => {
        if (selectedPageId) {
            const existing = existingPages?.find(page => page.page_id === selectedPageId)
            setEditingPage(JSON.parse(JSON.stringify(existing)))
        } else {
            setEditingPage(null)
        }
        setModifiedCurrent(false)
    }, [existingPages, selectedPageId])

    const handleIDChange = useCallback((value: string) => {
        setEditingPage(selectedPage => produce(selectedPage, selectedPage => {
            if (selectedPage) {
                selectedPage.page_id = value
                setModifiedCurrent(true)
            }
        }))
    }, [])

    const handleTitleChange = useCallback((value: string) => {
        setEditingPage(selectedPage => produce(selectedPage, selectedPage => {
            if (selectedPage) {
                if (selectedPage.page_id === '' || selectedPage.page_id === titleToId(selectedPage.title)) {
                    selectedPage.page_id = titleToId(value)
                }

                selectedPage.title = value
                setModifiedCurrent(true)
            }
        }))
    }, [])

    const handleContentChange = useCallback((value: string) => {
        setEditingPage(selectedPage => produce(selectedPage, selectedPage => {
            if (selectedPage) {
                selectedPage.content = value
                setModifiedCurrent(true)
            }
        }))
    }, [])

    const handleVisibilityChange = useCallback((value: VisibilityLevel) => {
        setEditingPage(selectedPage => produce(selectedPage, selectedPage => {
            if (selectedPage) {
                selectedPage.visibility_level = value
                setModifiedCurrent(true)
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

    const selectedPageContent = editingPage?.content ?? ''
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
                value={selectedPageId}
                onChange={setSelectedPageId}
                onAddButtonClick={addPage}
            />

            <div className={styles.editSection}>
                {editingPage && <>
                    <div>
                        <Button appearance="primary" onClick={saveChanges} disabled={!modifiedCurrent}>
                            Save Changes
                        </Button>
                        <Spacer size={1} />
                        <Button appearance="secondary" onClick={discardChanges} disabled={!modifiedCurrent}>
                            Discard Changes
                        </Button>
                    </div>

                    <Input label='Title' value={editingPage.title} onChange={handleTitleChange} />
                    <Input label='ID (Page URL)' value={editingPage.page_id} onChange={handleIDChange} />
                    <TextArea label='Content' value={editingPage.content} onChange={handleContentChange} />
                    <Dropdown label='Visibility' value={editingPage.visibility_level} onChange={handleVisibilityChange} options={VISIBILITY_OPTIONS} />
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