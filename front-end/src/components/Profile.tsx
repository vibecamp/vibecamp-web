import React, { FC } from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './core/Spacer'

export default observer(() => {

    return (
        <>
            <h1>Tickets and profile</h1>

            <Spacer size={16} />

            {/* <Input
                label='Dietary restrictions'
                value={eventBeingEdited.name}
                onChange={val => eventBeingEdited.name = val}
            /> */}

            <Spacer size={16} />
        </>
    )
})

const Ticket: FC = observer(() => {

    return (
        <div className='ticket'>

        </div>
    )
})