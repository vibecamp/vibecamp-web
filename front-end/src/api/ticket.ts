import { vibeFetch } from './_common'


export async function createTicketPurchaseIntent(jwt: string | null, amounts: { adultTickets: number, childTickets: number }): Promise<string> {
    const { stripeClientSecret } = await vibeFetch<{ stripeClientSecret: string }>(
        '/ticket/create-purchase-intent', 
        jwt, 
        { 
            method: 'POST', 
            body: JSON.stringify(amounts)
        }
    )
    return stripeClientSecret
}