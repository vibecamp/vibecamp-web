import env from '../env.ts'
import { encode } from 'std/encoding/base64.ts'
import { Purchases } from '../types/route-types.ts'
import { TABLE_ROWS, Tables } from '../types/db-types.ts'
import { objectEntries, sum } from './misc.ts'
import { PURCHASE_TYPES_BY_TYPE } from '../types/misc.ts'

const MAILGUN_DOMAIN = 'mail.vibe.camp'
const FROM = `Vibecamp <support@${MAILGUN_DOMAIN}>`
const REPLY_TO = 'support@vibe.camp'

export type Email = {
    readonly to: string,
    readonly subject: string,
    readonly html: string,
}

export async function sendMail(email: Email) {
    const allFields = [
        ...objectEntries(email),
        ['from', FROM],
        ['h:Reply-To', REPLY_TO]
    ] as const

    const opts = {
        method: 'post',
        body: allFields
            .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
            .join('&'),
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${encode('api:' + env.MAILGUN_API_KEY)}`
        }
    }

    const res = await fetch(
        `https://api.mailgun.net/v3/${MAILGUN_DOMAIN}/messages`,
        opts
    )

    if (!res.ok) {
        const { html: _, ...rest } = email
        throw Error(`Failed to send mailgun email: ${JSON.stringify(rest)}`)
    }
}

export const receiptEmail = (account: Pick<Tables['account'], 'email_address' | 'account_id'>, purchases: Purchases): Email => {
    const purchaseTypes = objectEntries(purchases).filter(([type, count]) => count != null && count > 0).map(([type]) => PURCHASE_TYPES_BY_TYPE[type])
    const festival = TABLE_ROWS.festival.find(f => f.festival_id === purchaseTypes[0]?.festival_id)
    const now = new Date()
    const purchaseRows = objectEntries(purchases)
        .map(([key, count]) =>
            `<tr>
                <td>${PURCHASE_TYPES_BY_TYPE[key].description} x${count}</td>
                <td>$${(PURCHASE_TYPES_BY_TYPE[key].price_in_cents * count! / 100).toFixed(2)}</td>
            </tr>`)
        .join('\n')
    const totalCost = objectEntries(purchases)
        .map(([key, count]) => PURCHASE_TYPES_BY_TYPE[key].price_in_cents * count! / 100)
        .reduce(sum, 0)
        .toFixed(2)

    return {
        to: account.email_address,
        subject: 'Vibecamp purchase receipt',
        html: `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <style>
                img {
                    width: 100%;
                }

                a {
                    color: rgba(255, 255, 255, 0.9);
                }

                body {
                    margin: 0;
                    /* background: rgb(7, 3, 24); */
                    background: rgb(38, 37, 48);
                    color: rgba(255, 255, 255, 0.9);
                    font-family: sans-serif;
                }

                .container {
                    padding: 20px;
                    margin: 0 auto;
                    max-width: 400px;
                }
                
                table {
                    width: 100%;
                }

                td {
                    vertical-align: baseline;
                }

                td:nth-child(2) {
                    text-align: right;
                }

                tr:last-of-type {
                    font-weight: bold;
                }

                tr:last-of-type>td {
                    padding-top: 10px;
                }

                .details {
                    text-align: right;
                    color: rgba(255, 255, 255, 0.7);
                }
            </style>
        </head>

        <body>
            <img src="${festival?.email_banner_image}">

            <div class="container">
                <h1>You're going to ${festival?.festival_name}!</h1>
                <p>
                    This email is your receipt for your purchases. You can visit 
                    <a href="https://my.vibe.camp">my.vibe.camp</a> to view your
                    tickets or purchase anything else you need. The app will also
                    be updated as the festival approaches with things like an event 
                    schedule, a site map, and more, so be sure to check back!
                </p>
                <h2>Purchases:</h2>
                <table>
                    ${purchaseRows}
                    
                    <tr>
                        <td>Total:</td>
                        <td>$${totalCost}</td>
                    </tr>
                </table>
                <p class="details">
                    Purchased on ${now.toDateString()} ${now.toTimeString()}
                </p>
                <p class="details">
                    Account ID: ${account.account_id}
                </p>
            </div>
        </body>
        </html>
    `
    }
}
