
import { assertEquals } from 'https://deno.land/std@0.152.0/testing/asserts.ts'
import { stub } from "https://deno.land/std@0.220.0/testing/mock.ts"

import { TABLE_ROWS, Tables } from '../types/db-types.ts'
import { PURCHASE_TYPES_BY_TYPE } from '../types/misc.ts'
import { purchaseBreakdown, purchaseTypeAvailableNow } from './misc.ts'

Deno.test({
    name: 'purchaseBreakdown()',
    fn() {
        assertEquals(
            purchaseBreakdown({
                ATTENDANCE_VIBECLIPSE_2024_OVER_16: 3,
                VIBECAMP_3_BASIC_TICKET: 2,
                VIBECAMP_3_BUS_TO_BALTIMORE_1130AM: 1
            }, TABLE_ROWS.discount.filter(r => r.discount_code === 'CABIN')),
            [
                {
                    basePrice: PURCHASE_TYPES_BY_TYPE.ATTENDANCE_VIBECLIPSE_2024_OVER_16.price_in_cents * 3,
                    count: 3,
                    discountMultiplier: 0.85,
                    discountedPrice: PURCHASE_TYPES_BY_TYPE.ATTENDANCE_VIBECLIPSE_2024_OVER_16.price_in_cents * 3 * 0.85,
                    purchaseType: "ATTENDANCE_VIBECLIPSE_2024_OVER_16",
                },
                {
                    basePrice: PURCHASE_TYPES_BY_TYPE.VIBECAMP_3_BASIC_TICKET.price_in_cents * 2,
                    count: 2,
                    discountMultiplier: undefined,
                    discountedPrice: PURCHASE_TYPES_BY_TYPE.VIBECAMP_3_BASIC_TICKET.price_in_cents * 2,
                    purchaseType: "VIBECAMP_3_BASIC_TICKET",
                },
                {
                    basePrice: PURCHASE_TYPES_BY_TYPE.VIBECAMP_3_BUS_TO_BALTIMORE_1130AM.price_in_cents,
                    count: 1,
                    discountMultiplier: undefined,
                    discountedPrice: PURCHASE_TYPES_BY_TYPE.VIBECAMP_3_BUS_TO_BALTIMORE_1130AM.price_in_cents,
                    purchaseType: "VIBECAMP_3_BUS_TO_BALTIMORE_1130AM",
                },
            ]
        )
    }
})

Deno.test({
    name: 'purchaseTypeAvailableNow()',
    fn() {
        const basePurchaseType = {
            "purchase_type_id": "",
            "price_in_cents": 100,
            "max_available": 100,
            "description": "",
            "max_per_account": null,
            "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6",
            "is_attendance_ticket": false
        }

        const now = '2024-06-01T00:00:00.000Z'

        const beforeNow = '2024-05-01T00:00:00.000Z'
        const afterNow = '2024-07-01T00:00:00.000Z'

        stub(Date, 'now', () => new Date(now).valueOf())

        assertEquals(
            purchaseTypeAvailableNow({
                ...basePurchaseType,
                "available_from": null,
                "available_to": null
            } as unknown as Tables['purchase_type']),
            true
        )

        assertEquals(
            purchaseTypeAvailableNow({
                ...basePurchaseType,
                "available_from": new Date(beforeNow).valueOf(),
                "available_to": null
            } as unknown as Tables['purchase_type']),
            true
        )

        assertEquals(
            purchaseTypeAvailableNow({
                ...basePurchaseType,
                "available_from": null,
                "available_to": new Date(afterNow).valueOf()
            } as unknown as Tables['purchase_type']),
            true
        )

        assertEquals(
            purchaseTypeAvailableNow({
                ...basePurchaseType,
                "available_from": new Date(beforeNow).valueOf(),
                "available_to": new Date(afterNow).valueOf()
            } as unknown as Tables['purchase_type']),
            true
        )

        assertEquals(
            purchaseTypeAvailableNow({
                ...basePurchaseType,
                "available_from": new Date(afterNow).valueOf(),
                "available_to": null
            } as unknown as Tables['purchase_type']),
            false
        )

        assertEquals(
            purchaseTypeAvailableNow({
                ...basePurchaseType,
                "available_from": null,
                "available_to": new Date(beforeNow).valueOf()
            } as unknown as Tables['purchase_type']),
            false
        )

        assertEquals(
            purchaseTypeAvailableNow({
                ...basePurchaseType,
                "available_from": new Date(afterNow).valueOf(),
                "available_to": new Date(beforeNow).valueOf()
            } as unknown as Tables['purchase_type']),
            false
        )
    }
})