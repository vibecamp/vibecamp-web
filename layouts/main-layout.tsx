import Link from "../components/common/Link";
import { GetLayoutFn } from "../pages/_app";

import styles from './main-layout.module.scss'

const getMainLayout = ({ largeBanner }: { largeBanner: boolean }): GetLayoutFn => (content) => {

    return (
        <div>
            <header className={styles.headerSection + (largeBanner ? ` ${styles.largeBanner}` : ``)}>
                <div className={styles.stars}>
                    {starsData.map((style, index) =>
                        <div
                            className={styles.star}
                            style={style}
                            key={index}
                        />)}
                </div>

                VIBECAMP

                <img src="/twitter.png" />
            </header>

            {content}

            <footer className={styles.footerSection}>
                <Link className={styles.donateLink} href='/donate'>
                    Donate here
                </Link>
            </footer>
        </div>
    )
}

const starsData = new Array(50).fill(null).map(() => ({
    left: Math.floor(Math.random() * 100) + '%',
    top: Math.floor(Math.random() * 100) + '%',
    '--size': Math.floor(Math.random() * 4 + 1) + 'px',
    '--delay': Math.floor(Math.random() * 100) / 100 + 's'
}))

export default getMainLayout