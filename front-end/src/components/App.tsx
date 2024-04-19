import { autorun, configure as configureMobx } from 'mobx'
import React, { FC } from 'react'

import { exists } from '../../../back-end/utils/misc'
import { useObservableClass } from '../mobx/hooks'
import { observer } from '../mobx/misc'
import WindowObservables from '../mobx/WindowObservables'
import Store from '../stores/Store'
import Account from './Account'
import Icon, { MaterialIconName } from './core/Icon'
import Modal from './core/Modal'
import MultiView from './core/MultiView'
import Spacer from './core/Spacer'
import Stripes from './core/Stripes'
import Events from './Events'
import Login from './Login'
import Tickets from './Tickets'

// eslint-disable-next-line no-console
console.log(Store)

configureMobx({
    enforceActions: 'never',
})

if (WindowObservables.hashState?.currentView == null) {
    WindowObservables.assignHashState({ currentView: 'Tickets' })
}

type View = {
    readonly name: string,
    readonly icon: MaterialIconName,
    readonly component: FC
}

export default observer(() => {
    const state = useObservableClass(class {
        get views(): readonly View[] {
            return [
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
        }

        readonly heightSetters = autorun(() => {
            const root = document.getElementById('root')
            if (root != null) {
                root.style.height = WindowObservables.height + 'px'
            }
        })
    })

    return (
        <>
            <Stripes position='bottom-right' />

            <MultiView
                views={state.views.map(({ name, component: Component }) =>
                    ({ name, content: <Component /> }))}
                currentView={WindowObservables.hashState?.currentView}
            />

            <Nav views={state.views} />

            <Modal isOpen={!Store.loggedIn} side='left'>
                {() => <Login />}
            </Modal>
        </>
    )
})

const Nav = observer((props: { views: readonly View[] }) => {
    return (
        <div className='nav'>
            {props.views.map(({ name, icon }, index) => {
                const active = name === WindowObservables.hashState?.currentView

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
        </div>
    )
})
