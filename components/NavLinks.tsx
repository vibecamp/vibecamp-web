
import { FC } from 'react'
import Link from './Link'
import styles from './NavLinks.module.scss'

export type Props = {
    links: readonly LinkInfo[]
}

export type LinkInfo = { label: string, href: string }

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