import { fill } from '@/copy/fill'
import { t } from '@/copy/t'
import type { Tables } from '@/db/types'
import { env } from '@/env'
import { escapeHtml, objectEntries } from '@/lib/misc'

const FROM = `Vibecamp <support@${env.MAILGUN_DOMAIN}>`
const REPLY_TO = 'support@vibe.camp'

export type Email = {
    readonly to: string
    readonly subject: string
    readonly html: string
}

export async function sendMail(email: Email) {
    const allFields = [...objectEntries(email), ['from', FROM], ['h:Reply-To', REPLY_TO]] as const

    const body = allFields.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')

    if (!env.MAILGUN_API_KEY) {
        console.warn(
            "MAILGUN_API_KEY is unset in the environment, so this email wasn't sent:\n",
            JSON.stringify({ to: email.to, subject: email.subject }, null, 2),
        )
        return
    }

    const res = await fetch(`https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`, {
        method: 'post',
        body,
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${Buffer.from(`api:${env.MAILGUN_API_KEY}`).toString('base64')}`,
        },
    })

    if (!res.ok) {
        const { html: _, ...rest } = email
        throw new Error(`Failed to send mailgun email: ${JSON.stringify(rest)}`)
    }
}

export const avNeedsEmail = (
    event: {
        name: string
        description: string
        start_datetime: Date
        end_datetime: Date | null
        av_needs: string
    },
    creator: { name: string | null; email_address: string },
    eventSiteName: string | null,
): Email => {
    const fmtDate = (d: Date | null) => (d == null ? t('email.avNeeds.noDate') : d.toUTCString())
    const bold = (line: string) => line.replace(/^([^:]+:)/, '<b>$1</b>')

    return {
        to: env.AV_NEEDS_EMAIL,
        subject: fill(t('email.avNeeds.subject'), { eventName: event.name }),
        html: withContainer(`
            <div class="container">
                <h1>${t('email.avNeeds.heading')}</h1>
                <h2>${escapeHtml(event.name)}</h2>
                <p>${bold(
                    escapeHtml(
                        fill(t('email.avNeeds.host'), {
                            name: creator.name ?? t('email.avNeeds.unnamed'),
                            email: creator.email_address,
                        }),
                    ),
                )}</p>
                <p>${bold(escapeHtml(fill(t('email.avNeeds.site'), { siteName: eventSiteName ?? t('email.avNeeds.unknownSite') })))}</p>
                <p>${bold(escapeHtml(fill(t('email.avNeeds.start'), { start: fmtDate(event.start_datetime) })))}</p>
                <p>${bold(escapeHtml(fill(t('email.avNeeds.end'), { end: fmtDate(event.end_datetime) })))}</p>
                <h3>${t('eventEditor.descriptionLabel')}</h3>
                <p>${escapeHtml(event.description).replaceAll('\n', '<br>')}</p>
                <h3>${t('email.avNeeds.needsHeading')}</h3>
                <p>${escapeHtml(event.av_needs).replaceAll('\n', '<br>')}</p>
            </div>
        `),
    }
}

export const passwordResetEmail = (
    account: Pick<Tables['account'], 'email_address' | 'account_id'>,
    secret: string,
): Email => {
    const resetUrl = `${env.APP_BASE_URL}/reset-password?secret=${encodeURIComponent(secret)}`
    const body = t('email.passwordReset.body').replace(
        'Nothing has happened yet',
        '<b>Nothing has happened yet</b>',
    )

    return {
        to: account.email_address,
        subject: t('email.passwordReset.subject'),
        html: withContainer(`
            <div class="container">
                <h1>${t('email.passwordReset.subject')}</h1>
                <p>${body}</p>
                <p>
                    <a href="${resetUrl}">
                        ${resetUrl}
                    </a>
                </p>
                <p class="details">
                    ${fill(t('email.receipt.accountId'), { accountId: account.account_id })}
                </p>
            </div>
        `),
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

        .cta {
            display: block;
            color: rgba(255, 255, 255, 0.9);
            background: rgb(79, 176, 229);
            text-decoration: none;
            font-size: 16px;
            margin: 16px auto;
            padding: 10px 20px;
            text-align: center;
            border-radius: 8px;
            cursor: pointer;
            border: 1px solid rgba(0, 0, 0, 0.3);
        }

        body {
            margin: 0;
            background: rgb(38, 37, 48);
            color: rgba(255, 255, 255, 0.9);
            font-family: sans-serif;
        }

        .container {
            padding: 40px 20px;
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

export function orderReceiptEmail(
    account: Pick<Tables['account'], 'email_address'>,
    quote: import('@/lib/cart').Quote,
): Email {
    return {
        to: account.email_address,
        subject: t('email.receipt.subject'),
        html: withContainer(
            `<div class="container"><table>${quote.units.map((u) => `<tr><td>${escapeHtml(u.name)}</td><td>$${(u.net_cents / 100).toFixed(2)}</td></tr>`).join('')}<tr><td>${escapeHtml(t('purchase.contributionLabel'))}</td><td>$${(quote.contribution_cents / 100).toFixed(2)}</td></tr><tr><td>${escapeHtml(t('purchase.totalRow'))}</td><td>$${(quote.total_cents / 100).toFixed(2)}</td></tr></table></div>`,
        ),
    }
}
