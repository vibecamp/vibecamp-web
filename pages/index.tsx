import { GetStaticProps } from "next";
import DynamicPage, { Props as DynamicPageProps } from "../components/DynamicPage";
import { getPublicLinks, getPublicPages, Page } from "../data/content";
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
    const navLinks = await getPublicLinks()

    return {
        props: {
            navLinks,
            page
        }
    }
}

export default HomePage