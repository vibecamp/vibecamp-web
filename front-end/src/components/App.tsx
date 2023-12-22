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
                [
                    'dcd441a2-0b4b-4e52-961c-b7860fa9977c',
                    '44f222b3-928e-41f1-93a7-c35e7fae29bc',
                    '2b8103ae-468a-4750-a07a-47125aef2cb0',
                    '82eafa98-3089-40e8-9d2b-0ee267844621',
                    'bd6c3734-91d9-486a-9924-c0acefb77c21',
                    'cf64358e-2b97-4472-a503-5e2aca1ba117',
                    '1d8e8b2d-c5a4-47d1-a30c-83f453dd84c5',
                    '6f65ca22-3cc1-4d41-9c69-7788ece76a7e'
                ].includes(Store.jwtPayload?.account_id ?? '')
                    ? {
                        name: 'Events',
                        icon: 'calendar_today' as const,
                        component: Events
                    }
                    : null,
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
