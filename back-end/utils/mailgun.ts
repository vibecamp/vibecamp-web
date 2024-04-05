import env from '../env.ts'
import { encode } from 'std/encoding/base64.ts'
import { Purchases } from '../types/route-types.ts'
import { Tables } from '../types/db-types.ts'
import { objectEntries, purchaseBreakdown, sum } from './misc.ts'
import { PASSWORD_RESET_SECRET_KEY } from './constants.ts'
import { withDBConnection } from './db.ts'

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

export const receiptEmail = async (account: Pick<Tables['account'], 'email_address' | 'account_id'>, purchases: Purchases, discounts: readonly Tables['discount'][]): Promise<Email> => {
    const allPurchaseTypes = await withDBConnection(db => db.queryTable('purchase_type'))
    const allFestivals = await withDBConnection(db => db.queryTable('festival'))

    const purchaseTypes = objectEntries(purchases)
        .filter(([_, count]) => count != null && count > 0)
        .map(([type, _]) => allPurchaseTypes.find(p => p.purchase_type_id === type))
    const festival = allFestivals.find(f => f.festival_id === purchaseTypes[0]?.festival_id)
    const now = new Date()

    const purchasesInfo = await purchaseBreakdown(purchases, discounts, allPurchaseTypes)

    const purchaseRows = purchasesInfo.map(({ purchaseType, count, basePrice, discountMultiplier, discountedPrice }) =>
        `<tr>
            <td>${allPurchaseTypes.find(p => p.purchase_type_id === purchaseType)!.description} x${count}</td>
            <td>
                ${discountMultiplier != null
            ? `<s>$${(basePrice / 100).toFixed(2)}<s> $${(discountedPrice / 100).toFixed(2)}`
            : `$${(basePrice / 100).toFixed(2)}`}
            </td>
        </tr>`)
        .join('\n')

    const totalCost = purchasesInfo
        .map(({ discountedPrice }) => discountedPrice / 100)
        .reduce(sum, 0)
        .toFixed(2)

    return {
        to: account.email_address,
        subject: 'Vibecamp purchase receipt',
        html: withContainer(`
            <img src="${festival?.email_banner_image}">

            <div class="container">
                <h1>You're going to ${festival?.festival_name}!</h1>
                <p>
                    This email is your receipt for your purchases. You can visit 
                    <a href="${env.FRONT_END_BASE_URL}">my.vibe.camp</a> to view your
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
        `)
    }
}

export const passwordResetEmail = (account: Pick<Tables['account'], 'email_address' | 'account_id'>, secret: string): Email => {
    const resetUrl = `${env.FRONT_END_BASE_URL}#${encodeURIComponent(JSON.stringify({ [PASSWORD_RESET_SECRET_KEY]: secret }))}`

    return {
        to: account.email_address,
        subject: 'Vibecamp password reset',
        html: withContainer(`
            <div class="container">
                <h1>Vibecamp password reset</h1>
                <p>
                    You've requested that your account password be reset. <b>
                    Nothing has happened yet</b>, you can click the link below
                    to set a new password on your my.vibe.camp account.
                </p>
                <p>
                    <a href=${resetUrl}>
                        ${resetUrl}
                    </a>
                </p>
                <p class="details">
                    Account ID: ${account.account_id}
                </p>
            </div>
        `)
    }
}

const withContainer = (content: string) => `
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
    ${content}
</body>
</html>`