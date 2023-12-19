import { configure as configureMobx } from 'mobx'
import React, { FC } from 'react'

import { useAutorun } from '../mobx/hooks'
import { observer } from '../mobx/misc'
import WindowObservables from '../mobx/WindowObservables'
import Store from '../stores/Store'
import { VIEWS_ARRAY } from '../views'
import Icon from './core/Icon'
import Modal from './core/Modal'
import MultiView from './core/MultiView'
import Spacer from './core/Spacer'
import Stripes from './core/Stripes'
import Login from './Login'

// eslint-disable-next-line no-console
console.log(Store)

configureMobx({
    enforceActions: 'never',
})

if (WindowObservables.hashState?.currentView == null) {
    WindowObservables.assignHashState({ currentView: 'Tickets' })
}

export default observer(() => {
    useAutorun(() => {
        const root = document.getElementById('root')
        if (root != null) {
            root.style.height = WindowObservables.height + 'px'
        }
    })

    return (
        <>
            <Stripes position='bottom-right' />

            <MultiView
                views={VIEWS_ARRAY.map(({ name, component: Component }) =>
                    ({ name, content: <Component /> }))}
                currentView={WindowObservables.hashState?.currentView}
            />

            <Nav />

            <Modal isOpen={!Store.loggedIn} side='left'>
                {() => <Login />}
            </Modal>
        </>
    )
})

const Nav: FC = observer(() => {
    return (
        <div className='nav'>
            {VIEWS_ARRAY.map(({ name, icon }, index) => (
                <button
                    className={name === WindowObservables.hashState?.currentView ? 'active' : undefined}
                    onClick={() => WindowObservables.assignHashState({ currentView: name })}
                    title={name}
                    key={index}
                >
                    <Icon name={icon} />
                    <Spacer size={4} />
                    <span style={{ fontSize: 8 }}>{name}</span>
                </button>
            ))}
        </div>
    )
})
