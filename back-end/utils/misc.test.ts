
import { assertEquals } from 'https://deno.land/std@0.152.0/testing/asserts.ts'
import { TABLE_ROWS } from '../types/db-types.ts'
import { PURCHASE_TYPES_BY_TYPE } from '../types/misc.ts'
import { purchaseBreakdown } from './misc.ts'

Deno.test({
    name: 'Purchase breakdown',
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