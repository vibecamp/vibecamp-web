import env from '../env.ts'
import { encode } from 'std/encoding/base64.ts'
import { Purchases } from '../types/route-types.ts'
import { Tables } from '../types/db-types.ts'
import { objectEntries, sum } from './misc.ts'
import { PURCHASE_TYPES_BY_TYPE } from '../types/misc.ts'

const MAILGUN_DOMAIN = 'mail.vibe.camp'
const FROM = `Vibecamp <support@${MAILGUN_DOMAIN}>`

export type Email = {
    to: string,
    subject: string,
    html: string,
}

export async function sendMail(email: Email) {
    const opts = {
        method: 'post',
        body: `from=${FROM}&` + Object.entries(email).map(([key, value]) => `${key}=${value}`).join('&'),
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
        console.error('Failed to send mailgun email', res)
        throw Error('Failed to send mailgun email')
    }
}

export const receiptEmail = (account: Pick<Tables['account'], 'email_address'>, purchases: Purchases): Email => ({
    to: account.email_address,
    subject: 'Purchase receipt',
    html: `
        <h1>
            Welcome to Vibecamp!
        </h1>

        <h2>
            Purchases:
        </h2>

        <table>
        ${objectEntries(purchases).map(([key, count]) =>
        `<tr>
            <td>${PURCHASE_TYPES_BY_TYPE[key].description}</td>
            <td>x${count}</td>
            <td>$${(PURCHASE_TYPES_BY_TYPE[key].price_in_cents * count! / 100).toFixed(2)}</td>
        </tr>`).join('\n')}
        </table>

        <div>
            Total: ${objectEntries(purchases).map(([key, count]) => PURCHASE_TYPES_BY_TYPE[key].price_in_cents * count! / 100).reduce(sum, 0)}
        </div>
    `
})
