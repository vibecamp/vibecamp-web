import React from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './core/Spacer'

export default observer(() => {

    return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <div className='stripes'>
                <div></div>
                <div></div>
                <div></div>
            </div>

            <img src="vibecamp.png" className='logo' />

            <Spacer size={24} />

            <a className='loginWithTwitter' href='/home/announcements'>
                <img src="twitter.png" width={20} height={20} />
                <Spacer size={16} />
                Log in with Twitter
            </a>
        </div>
    )
})