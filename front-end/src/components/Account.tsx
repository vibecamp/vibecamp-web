import React from 'react'
import { observer } from 'mobx-react-lite'
import Spacer from './core/Spacer'
import Button from './core/Button'
import Store from '../Store'
import Col from './core/Col'

export default observer(() => {

    return (
        <Col padding={20}>
            <h1 style={{ fontSize: 24 }}>My account</h1>

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
        </Col>
    )
})
