import React from 'react'

import { observer } from '../mobx/misc'
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