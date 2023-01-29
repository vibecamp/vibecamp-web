
import { FC } from 'react'
import { LinkInfo } from '../api/content'
import Link from './common/Link'
import styles from './NavLinks.module.scss'

export type Props = {
    links: readonly LinkInfo[]
}

const NavLinks: FC<Props> = ({ links }) => {

    return (
        <nav className={styles.links}>
            {links.map(link =>
                <Link href={link.href} key={link.href}>
                    {link.label}
                </Link>)}
        </nav>
    )
}

export default NavLinks