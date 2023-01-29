import { GetStaticPaths, GetStaticProps } from "next";
import { Page } from "../../common/data";
import DynamicPage, { Props as DynamicPageProps } from "../components/DynamicPage";
import { getPages, getNavLinks } from "../api/content";
import getMainLayout from "../layouts/main-layout";
import { renderMarkdown } from "../utils/markdown";
import { NextPageWithLayout } from "./_app";

type Params = { page_id: string }

const DynamicPageWithLayout: NextPageWithLayout<DynamicPageProps> = (props) => {
    return (
        <DynamicPage {...props} />
    )
}

DynamicPageWithLayout.getLayout = getMainLayout({ largeBanner: false })

export const getStaticPaths: GetStaticPaths<Params> = async () => {
    return {
        paths: (await getPages()).map(page => ({ params: { page_id: page.page_id } })),
        fallback: false, // can also be true or 'blocking'
    }
}

export const getStaticProps: GetStaticProps<DynamicPageProps, Params> = async ({ params }) => {
    const [pages, navLinks] = await Promise.all([getPages(), getNavLinks()])
    const page = pages.find(page => page.page_id === params?.page_id) as Page
    const html = renderMarkdown(page.content)
    const title = page.title

    return {
        props: {
            navLinks,
            title,
            html
        }
    }
}

export default DynamicPageWithLayout