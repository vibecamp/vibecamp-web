import { autorun, makeAutoObservable, reaction } from "mobx"
import { observer } from "mobx-react-lite"
import React, { FC } from "react"
import { Page, PERMISSION_LEVELS } from "../../../../common/data/pages"
import { getPublicPages, savePage } from "../../../api/content"
import { renderMarkdown } from "../../../utils/markdown"
import { stringToOption } from "../../../utils/misc"
import { debouncedGet } from "../../../utils/mobx/debounced-get"
import { remote } from "../../../utils/mobx/remote"
import Button from "../../common/Button"
import Dropdown from "../../common/Dropdown"
import Input from "../../common/Input"
import NavList from "../../common/NavList"
import Spacer from "../../common/Spacer"
import TextArea from "../../common/TextArea"

import styles from './Pages.module.scss'

class _PagesStore {
    constructor() {
        makeAutoObservable(this)

        autorun(() => {
            if (this.selectedPage != null) {
                this.pageBeingEdited = JSON.parse(JSON.stringify(this.selectedPage))
            }
        })

        reaction(
            () => this.selectedPageId,
            () => this.previewHtml.updateImmediately()
        )

        // TODO: auto-set page ID based on title changes
    }

    readonly loadedPages = remote(getPublicPages)

    initializeSelectedPageForEditing = () => {
        if (this.selectedPage != null) {
            this.pageBeingEdited = JSON.parse(JSON.stringify(this.selectedPage))
            this.previewHtml.updateImmediately()
        }
    }

    saveChanges = async () => {
        if (this.pageBeingEdited != null) {
            this.savingChanges = true
            try {
                await savePage(this.pageBeingEdited)
                this.currentPageModified = false
                this.selectedPageId = this.pageBeingEdited?.page_id
                await this.loadedPages.load()
            } finally {
                this.savingChanges = false
            }
        }
    }
    savingChanges = false

    get navOptions() {
        return this.loadedPages.value?.map(page => ({ label: page.title, value: page.page_id })) ?? []
    }

    get selectedPage() {
        return this.loadedPages.value?.find(page => page.page_id === this.selectedPageId)
    }

    selectedPageId: string | undefined = undefined
    pageBeingEdited: Page | undefined = undefined
    currentPageModified = false

    readonly previewHtml = debouncedGet(() => renderMarkdown(this.pageBeingEdited?.content ?? ''), 200)
}
const PagesStore = new _PagesStore()

const Pages: FC = observer(() => {
    const pageBeingEdited = PagesStore.pageBeingEdited

    return (
        <>
            <NavList
                options={PagesStore.navOptions}
                value={PagesStore.selectedPageId}
                onChange={id => PagesStore.selectedPageId = id}
            // onAddButtonClick={addPage} TODO
            />

            <div className={styles.editSection}>
                {pageBeingEdited && <>
                    <div>
                        <Button appearance="primary" onClick={PagesStore.saveChanges} loading={PagesStore.savingChanges}>
                            {/* disabled={!PagesStore.currentPageModified} */}
                            Save Changes
                        </Button>
                        <Spacer size={1} />
                        <Button appearance="secondary" onClick={PagesStore.initializeSelectedPageForEditing} disabled={PagesStore.savingChanges}>
                            {/* disabled={!PagesStore.currentPageModified} */}
                            Discard Changes
                        </Button>
                    </div>

                    <Input label='Title' value={pageBeingEdited.title} onChange={val => pageBeingEdited.title = val} />
                    <Input label='ID (Page URL)' value={pageBeingEdited.page_id} onChange={val => pageBeingEdited.page_id = val} />
                    <TextArea label='Content' value={pageBeingEdited.content} onChange={val => pageBeingEdited.content = val} />
                    <Dropdown label='Visibility' value={pageBeingEdited.permission_level} onChange={val => pageBeingEdited.permission_level = val} options={PERMISSION_OPTIONS} />
                    {/* <Input label='Nav order' value={selectedPage.nav_order + ''} onChange={handleNavOrderChange} /> */}
                </>}
            </div>

            <article
                className={styles.previewSection}
                dangerouslySetInnerHTML={{ __html: PagesStore.previewHtml.get() }}
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
    permission_level: 'admin'
}

const PERMISSION_OPTIONS = PERMISSION_LEVELS.map(stringToOption)

export default Pages