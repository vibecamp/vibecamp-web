import { GetStaticProps } from "next";
import DynamicPage, { pageToLink, Props as DynamicPageProps } from "../components/DynamicPage";
import { getPublicPages, Page } from "../data/content";
import getMainLayout from "../layouts/main-layout";
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
    const page = pages.find(page => page.page_id === '') as Page

    return {
        props: {
            navLinks: pages.map(pageToLink),
            page
        }
    }
}

export default HomePage