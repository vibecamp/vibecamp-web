import React from 'react'
import { observer } from 'mobx-react-lite'
import Store from '../Store'
import Modal from './core/Modal'
import Ticket from './Ticket'
import Spacer from './core/Spacer'
import Input from './core/Input'
import Button from './core/Button'

export default observer(() => {

    const purchasedTickets = [
        { name: '@brundolfsmith', ticketType: 'adult' },
        { name: 'Someone else', ticketType: 'child' },
    ] as const

    return (
        <>
            <h1>My tickets</h1>

            {purchasedTickets.map(t => <Ticket {...t} key={t.name} />)}

            <Button isPrimary onClick={() => Store.buyTicketsModalOpen = true}>
                Buy tickets
            </Button>

            <Modal title='Ticket purchase' isOpen={Store.buyTicketsModalOpen} onClose={() => Store.buyTicketsModalOpen = false}>
                You currently have:
                <div>
                    {purchasedTickets.filter(t => t.ticketType === 'adult').length} adult tickets, and
                </div>
                <div>
                    {purchasedTickets.filter(t => t.ticketType === 'child').length} child tickets
                </div>

                <Spacer size={20} />

                <Input label='Adult tickets to purchase' value='0' onChange={() => { }} />

                <Spacer size={10} />

                <Input label='Child tickets to purchase' value='0' onChange={() => { }} />

                <Spacer size={10} />

                <Button isPrimary>
                    Purchase
                </Button>
            </Modal>
        </>
    )
})