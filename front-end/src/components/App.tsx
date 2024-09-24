import React, { FC, useEffect, useMemo } from 'react'

import { exists } from '../../../back-end/utils/misc'
import useHashState from '../hooks/useHashState'
import useIsOffline from '../hooks/useIsOffline'
import { StoreContext, useNewStoreInstance } from '../hooks/useStore'
import useWindowSize from '../hooks/useWindowSize'
import Account from './Account'
import Icon, { MaterialIconName } from './core/Icon'
import Modal from './core/Modal'
import MultiView from './core/MultiView'
import Spacer from './core/Spacer'
import Stripes from './core/Stripes'
import Events from './Events'
import Login from './Login'
import Tickets from './Tickets'

type View = {
    readonly name: string,
    readonly icon: MaterialIconName,
    readonly component: FC
}

export default React.memo(() => {
    const store = useNewStoreInstance()
    const { hashState, setHashState } = useHashState()
    const { height } = useWindowSize()

    useEffect(() => {
        if (hashState?.currentView == null) {
            setHashState({ currentView: 'Tickets' })
        }
    }, [hashState?.currentView, setHashState])

    const views = useMemo(() =>
        [
            {
                name: 'Tickets',
                icon: 'confirmation_number' as const,
                component: Tickets
            },
            // Store.accountInfo.state.result?.allowed_to_purchase
            //     ?
            {
                name: 'Events',
                icon: 'calendar_today' as const,
                component: Events
            },
            // : null,
            // Map: {
            //     icon: 'map',
            //     component: Map
            // },
            // Info: {
            //     icon: 'info',
            //     component: Info
            // },
            {
                name: 'Account',
                icon: 'person' as const,
                component: Account
            }
        ].filter(exists)
    , [])

    useEffect(() => {
        const root = document.getElementById('root')
        if (root != null) {
            root.style.height = height + 'px'
        }
    }, [height])

    return (
        <StoreContext.Provider value={store}>
            <Stripes position='bottom-right' />

            <MultiView
                views={views.map(({ name, component: Component }) =>
                    ({ name, content: <Component /> }))}
                currentView={hashState?.currentView}
            />

            <Nav views={views} />

            <Modal isOpen={!store.loggedIn} side='left'>
                {() => <Login />}
            </Modal>
        </StoreContext.Provider>
    )
})

const Nav = React.memo((props: { views: readonly View[] }) => {
    const { hashState } = useHashState()
    const isOffline = useIsOffline()

    return (
        <div className='nav'>
            {props.views.map(({ name, icon }, index) => {
                const active = name === hashState?.currentView

                return (
                    <a
                        className={active ? 'active' : undefined}
                        href={`#${encodeURIComponent(JSON.stringify({ currentView: name }))}`}
                        title={name}
                        key={index}
                    >
                        <Icon name={icon} fill={active ? 1 : 0} />
                        <Spacer size={4} />
                        <span style={{ fontSize: 8 }}>{name}</span>
                    </a>
                )
            })}

            <div className={`offline-banner ${!isOffline ? 'hidden' : ''}`}>
                Currently offline
            </div>
        </div>
    )
})
