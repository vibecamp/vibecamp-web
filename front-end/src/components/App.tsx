import React, { FC } from 'react'
import { configure as configureMobx } from 'mobx'
import { observer } from 'mobx-react-lite'
import Login from './Login'
import Store from '../Store'
import Spacer from './core/Spacer'
import Modal from './core/Modal'
import { VIEWS_ARRAY } from '../views'
import MultiView from './core/MultiView'
import Stripes from './core/Stripes'
import { windowSize } from '../mobx/browser'
import { useAutorun } from '../mobx/hooks'

console.log(Store)

configureMobx({
    enforceActions: 'never',
})

export default observer(() => {
    useAutorun(() => {
        const root = document.getElementById('root')
        if (root != null) {
            root.style.height = windowSize.get().height + 'px'
        }
    })

    return (
        <>
            <Stripes position='bottom-right' />

            <MultiView
                views={VIEWS_ARRAY.map(({ name, component: Component }) =>
                    ({ name, content: <Component /> }))}
                currentView={Store.currentView}
            />

            <Nav />

            <Modal isOpen={!Store.loggedIn} side='left'>
                <Login />
            </Modal>
        </>
    )
})

const Nav: FC = observer(() => {
    return (
        <div className='nav'>
            {VIEWS_ARRAY.map(({ name, icon }, index) => (
                <button className={name === Store.currentView ? 'active' : undefined} onClick={Store.setCurrentView(name)} title={name} key={index}>
                    <span className="material-symbols-outlined">{icon}</span>
                    <Spacer size={4} />
                    <span style={{ fontSize: 8 }}>{name}</span>
                </button>
            ))}
        </div>
    )
})
