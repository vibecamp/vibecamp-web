import { GetStaticProps } from "next";
import DynamicPage, { Props as DynamicPageProps } from "../components/DynamicPage";
import { getPublicLinks, getPublicPages, Page } from "../data/content";
import getMainLayout from "../layouts/main-layout";
import { renderMarkdown } from "../utils/markdown";
import { NextPageWithLayout } from "./_app";

type Params = { page_id: string }

const HomePage: NextPageWithLayout<DynamicPageProps> = (props) => {
    return (
        <DynamicPage {...props} />
    )
}

HomePage.getLayout = getMainLayout({ largeBanner: true })

export const getStaticProps: GetStaticProps<DynamicPageProps, Params> = async ({ params }) => {
    const pages = await getPublicPages()
    const page = pages.find(page => page.page_id === '<index>') as Page
    const navLinks = await getPublicLinks()
    const html = renderMarkdown(page.content)

    return {
        props: {
            navLinks,
            page,
            html
        }
    }
}

export default HomePage