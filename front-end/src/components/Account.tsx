import React, { FC } from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './core/Spacer'
import Button from './core/Button'
import Store from '../Store'

export default observer(() => {

    return (
        <>
            <h1>My account</h1>

            <Spacer size={16} />

            {/* <Input
                label='Dietary restrictions'
                value={eventBeingEdited.name}
                onChange={val => eventBeingEdited.name = val}
            /> */}

            <Button isDanger isPrimary onClick={() => Store.jwt = null}>
                Log out
            </Button>

            <Spacer size={16} />
        </>
    )
})
