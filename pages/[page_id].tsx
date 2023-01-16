import { GetStaticPaths, GetStaticProps } from "next";
import DynamicPage, { pageToLink, Props as DynamicPageProps } from "../components/DynamicPage";
import { getPublicLinks, getPublicPages, Page as DynamicPageWithLayout } from "../data/content";
import getMainLayout from "../layouts/main-layout";
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
        paths: (await getPublicPages()).map(page => ({ params: { page_id: page.page_id } })),
        fallback: false, // can also be true or 'blocking'
    }
}

export const getStaticProps: GetStaticProps<DynamicPageProps, Params> = async ({ params }) => {
    const pages = await getPublicPages()
    const page = pages.find(page => page.page_id === params?.page_id) as DynamicPageWithLayout
    const navLinks = await getPublicLinks()

    return {
        props: {
            navLinks,
            page
        }
    }
}

export default DynamicPageWithLayout