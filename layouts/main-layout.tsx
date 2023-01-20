import Link from "../components/common/Link";
import Spacer from "../components/common/Spacer";
import { GetLayoutFn } from "../pages/_app";
import { STARS_DATA } from "../utils/stars";

import styles from './main-layout.module.scss'

const getMainLayout = ({ largeBanner }: { largeBanner: boolean }): GetLayoutFn => (content) => {

    return (
        <div>
            <header className={styles.headerSection + (largeBanner ? ` ${styles.largeBanner}` : ``)}>
                <div className={styles.stars}>
                    {STARS_DATA.map((style, index) =>
                        <div
                            className={styles.star}
                            style={style}
                            key={index}
                        />)}
                </div>

                <Link href="/">
                    VIBECAMP
                </Link>

                <img src="/twitter.png" />
            </header>

            {content}

            <footer className={styles.footerSection}>
                <Link className={styles.donateLink} href='/donate'>
                    Donate here
                </Link>

                <Spacer size={3} />

                <div className={styles.footerNotes}>
                    <div>
                        © vibecamp
                    </div>
                    <Spacer size={2} />
                    <div>
                        Design by <Link href='https://html5up.net/'>HTML5 UP</Link>
                    </div>
                </div>
            </footer>
        </div>
    )
}

export default getMainLayout