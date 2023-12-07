/* eslint-disable indent */
import React, { } from 'react'
import { observer } from 'mobx-react-lite'
import { useRequest } from '../mobx/hooks'
import Col from './core/Col'
import Store from "../Store.ts";
import {vibefetch} from "../vibefetch.ts";
import LoadingDots from "./core/LoadingDots.tsx";
import {
    PURCHASE_TYPES_BY_TYPE,
    PurchaseCountMap,
    PurchaseType
} from "../../../back-end/types/misc.ts";
import {objectKeys} from "../../../back-end/utils/misc.ts";

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

        return response
    })

    const purchases = stats.state.result?.purchases ?? ({} as PurchaseCountMap)
    const purchaseTable = Object.keys(purchases).length > 0 ? (
        <table>
            {objectKeys<PurchaseCountMap>(purchases).map((key) => {
                return (
                    <tr key={key}>
                        <th style={{textAlign: 'left', fontWeight: "300"}}>{PURCHASE_TYPES_BY_TYPE[key].description}</th>
                        <td style={{fontWeight: "400"}}>{purchases[key]}</td>
                    </tr>
                );
            })}
        </table>
    ) : <div></div>

    return (
        <Col padding={20} pageLevel>
            <h1 style={{ fontSize: 24, alignSelf: 'flex-start' }}>
                Stats
            </h1>

            {stats.state.kind === 'loading' ? <LoadingDots size={80} color={"blue"}/> : (
                <>
                    <div style={{marginTop: '20px'}}>
                        Accounts Created: <span style={{fontWeight: "400"}}>{stats.state.result?.accounts}</span>
                    </div>
                    <div style={{marginTop: '20px'}}>
                        <h3>Purchases</h3>
                        {purchaseTable}
                    </div>
                </>
            )}
        </Col>
    )
})
