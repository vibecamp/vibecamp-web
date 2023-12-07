/* eslint-disable indent */
import React, { } from 'react'
import { observer } from 'mobx-react-lite'
import { useRequest } from '../mobx/hooks'
import Col from './core/Col'
import Store from "../Store.ts";
import {vibefetch} from "../vibefetch.ts";

export default observer(() => {
    const stats = useRequest(async () => {
        if (!Store.loggedIn) {
            return undefined
        }

        const { response } = await vibefetch(
            Store.jwt,
            '/stats',
            'get',
            undefined
        )

        return response ?? undefined
    })

    const purchases = stats.state.result ? stats.state.result?.purchases : {}
    const purchaseTable = Object.keys(purchases).length > 0 ? (
        <table>
            {Object.keys(purchases).map((key) => {
                return (
                    <tr key={key}>
                        <th style={{textAlign: 'left'}}>{key}</th>
                        <td>{purchases[key]}</td>
                    </tr>
                );
            })}
        </table>
    ) : <div>[loading]</div>

    return (
        <Col padding={20} pageLevel>
            <h1 style={{ fontSize: 24, alignSelf: 'flex-start' }}>
                Stats
            </h1>
            <div style={{marginTop: '20px'}}>
                Accounts Created: {stats.state.result?.accounts ?? 'loading'}
            </div>
            <div style={{marginTop: '20px'}}>
                {purchaseTable}
            </div>
        </Col>
    )
})
