
import { FC, useContext } from 'react'
import { NavLink } from '../../common/data'
import { UserInfoContext } from '../pages/_app'
import Link from './common/Link'
import styles from './NavLinks.module.scss'

export type Props = {
    links: readonly NavLink[]
}

const NavLinks: FC<Props> = ({ links }) => {
    const { userInfo } = useContext(UserInfoContext)

    return (
        <nav className={styles.links}>
            {links.map(link =>
                <Link href={link.href} key={link.href}>
                    {link.label}
                </Link>)}

            {(userInfo?.is_content_admin || userInfo?.is_account_admin) &&
                <Link href='/admin' openInNewTab>
                    Admin
                </Link>}
        </nav>
    )
}

export default NavLinks