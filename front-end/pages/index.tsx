import { GetStaticProps } from "next";
import { getPublicLinks, LinkInfo } from "../api/content";
import getMainLayout from "../layouts/main-layout";
import { NextPageWithLayout } from "./_app";

import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import MobileNav from "../components/MobileNav";
import NavLinks from "../components/NavLinks";
import useIsOnMobile from "../hooks/useIsOnMobile";

import styles from './index.module.scss'
import Head from "next/head";
import { DISCORD_HREF, PROJECTS_SHEET, TWITTER_HREF } from "../utils/urls";
import Link from "../components/common/Link";

type Props = {
    navLinks: readonly LinkInfo[]
}

const HomePage: NextPageWithLayout<Props> = ({ navLinks }) => {
    const isOnMobile = useIsOnMobile()

    return (
        <>
            <Head>
                <title>vibecamp</title>
            </Head>

            {isOnMobile
                ? <MobileNav links={navLinks} />
                : <NavLinks links={navLinks} />}

            <article>
                <blockquote className={styles.point}>
                    <div>🕰️</div>
                    <div>
                        <b>The time:</b> June 15th - June 18th 2023
                    </div>
                </blockquote>

                <blockquote className={styles.point}>
                    <div>🗺️</div>
                    <div>
                        <b>The place:</b> Ramblewood is a 200 acre scenic
                        property about an hour from both Baltimore and
                        Philadelphia.
                    </div>
                </blockquote>

                <blockquote className={styles.point}>
                    <div>🎟️</div>
                    <div>
                        <b>When do ticket sales close?</b>
                        <br />
                        Applications close on 2/15 and ticket sales will close
                        on 3/1. If you want to come to vibecamp just fill out
                        <Link href='https://forms.gle/6eTcwTrGgTeBTzdi9'>this form</Link>
                        and keep an eye on your email.
                    </div>
                </blockquote>

                <blockquote className={styles.point}>
                    <div>🧑🏿‍💻</div>
                    <div>
                        <b>I filled out my application but haven’t heard back yet!</b>
                        <br />
                        If you haven’t heard back within a week of filling out
                        your application please contact Colby#6799 on our
                        <Link href={DISCORD_HREF}>discord server</Link>.
                    </div>
                </blockquote>

                <blockquote className={styles.point}>
                    <div>🏗️</div>
                    <div>
                        <b>How do I contribute to vibecamp?</b>
                        <br />
                        Create a project and put it in this
                        <Link href={PROJECTS_SHEET}>
                            collaborative sheet
                        </Link>.
                        <br />
                        Browse the projects in the sheet or the #projects
                        discord channel and offer to help someone.
                    </div>
                </blockquote>

                <blockquote className={styles.point}>
                    <div>🔗</div>
                    <div>
                        <Link href={TWITTER_HREF}>Vibecamp twitter</Link>
                        <br />
                        <Link href={DISCORD_HREF}>Vibecamp discord</Link>
                        <br />
                        <Link href='https://forms.gle/6eTcwTrGgTeBTzdi9'>Vibecamp application</Link>
                        <br />
                        <Link href='/faq'>FAQ</Link>
                        <br />
                        <Link href={PROJECTS_SHEET}>Projects Sheet</Link>
                    </div>
                </blockquote>
            </article>
        </>
    )
}

HomePage.getLayout = getMainLayout({ largeBanner: true })

export const getStaticProps: GetStaticProps<Props, Params> = async () => {
    const navLinks = await getPublicLinks()

    return {
        props: {
            navLinks
        }
    }
}

export default HomePage