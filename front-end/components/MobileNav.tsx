
import { FC, useCallback, useContext } from 'react'
import { NavLink } from '../../common/data'
import { MobileNavOpenContext } from '../pages/_app'
import Link from './common/Link'

import styles from './MobileNav.module.scss'

export type Props = {
    links: readonly NavLink[]
}

const MobileNav: FC<Props> = ({ links }) => {
    const { isOpen, setIsOpen } = useContext(MobileNavOpenContext)
    const open = useCallback(() => setIsOpen(true), [setIsOpen])
    const close = useCallback(() => setIsOpen(false), [setIsOpen])

    return (
        <>
            <div className={styles.openButtonContainer}>
                <button className={styles.openButton} onClick={open}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M0 96C0 78.3 14.3 64 32 64H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32H416c17.7 0 32 14.3 32 32s-14.3 32-32 32H32c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32H32c-17.7 0-32-14.3-32-32s14.3-32 32-32H416c17.7 0 32 14.3 32 32z" /></svg>
                </button>
            </div>

            <nav className={styles.nav + ' ' + (isOpen ? styles.isOpen : '')}>
                <button className={styles.closeButton} onClick={close}>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L160 210.7 54.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L114.7 256 9.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L160 301.3 265.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L205.3 256 310.6 150.6z" /></svg>
                </button>

                {links.map(link =>
                    <Link href={link.href} onClick={close} key={link.href}>
                        {link.label}
                    </Link>)}
            </nav>
        </>
    )
}

export default MobileNav