import { observer } from 'mobx-react-lite'
import React from 'react'
import Store from '../Store'
import Button from './core/Button'
import LoadingDots from './core/LoadingDots'
import Modal from './core/Modal'
import Spacer from './core/Spacer'
import Ticket from './tickets/Ticket'



export default observer(() => {


    return (
        <>
            <h1>Announcements</h1>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <Spacer size={500} />
                {/* <LoadingDots /> */}
                <Ticket name="@brundolfsmith" ticketType='adult' />
                <Ticket name="Someone else" ticketType='child' />

            </div>
        </>
    )
})