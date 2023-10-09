import React, { CSSProperties } from 'react'
import { configure as configureMobx } from 'mobx'
import { observer } from 'mobx-react-lite'
import Login from './Login'
import Events from './Events'
import Map from './Map'
import Info from './Info'
import { useAutorun, windowSize } from '../mobx-utils'
import Store from '../Store'
import Spacer from './core/Spacer'
import Modal from './core/Modal'
import { VIEWS_ENTRIES } from '../views'

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
            <div className='stripes' style={{ transform: 'scale(-1) rotate(-20deg)', top: 'auto', left: 'auto', bottom: 50, right: '-100vw' }}>
                <div></div>
                <div></div>
                <div></div>
            </div>

            <div className='viewsWrapper' style={{ '--view-count': VIEWS_ENTRIES.length, '--current-view': VIEWS_ENTRIES.findIndex(e => e[0] === Store.currentView) } as CSSProperties}>
                <div>
                    {VIEWS_ENTRIES.map(([name, { component: Component }]) =>
                        <div key={name}>
                            <Component />
                        </div>)}
                </div>
            </div>

            <div className='nav'>
                {VIEWS_ENTRIES.map(([name, { icon }], index) => (
                    <button className={name === Store.currentView ? 'active' : undefined} onClick={Store.setCurrentView(name)} title={name} key={index}>
                        <span className="material-symbols-outlined">{icon}</span>
                        <Spacer size={4} />
                        <span style={{ fontSize: 8 }}>{name}</span>
                    </button>
                ))}
            </div>

            <Modal isOpen={!Store.loggedIn} side='left'>
                <Login />
            </Modal>
        </>
    )
})
