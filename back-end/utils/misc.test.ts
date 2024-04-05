
import { assertEquals } from 'https://deno.land/std@0.152.0/testing/asserts.ts'
import { stub } from "https://deno.land/std@0.220.0/testing/mock.ts"

import { Tables } from '../types/db-types.ts'
import { purchaseBreakdown, purchaseTypeAvailableNow } from './misc.ts'

Deno.test({
    name: 'purchaseBreakdown()',
    fn() {
        assertEquals(
            purchaseBreakdown({
                ATTENDANCE_VIBECLIPSE_2024_OVER_16: 3,
                VIBECAMP_3_BASIC_TICKET: 2,
                VIBECAMP_3_BUS_TO_BALTIMORE_1130AM: 1
            }, [
                { "discount_id": "08405402-9089-4b84-be11-f6e5676b614e", "discount_code": "CABIN", "purchase_type_id": "ATTENDANCE_VIBECLIPSE_2024_OVER_16", "price_multiplier": "0.85" },
                { "discount_id": "25f9622a-5994-4924-8109-0e6d2f49c63a", "discount_code": "CABIN", "purchase_type_id": "ATTENDANCE_VIBECLIPSE_2024_2_TO_5", "price_multiplier": "0.85" },
                { "discount_id": "8b903634-7b4c-4508-9811-34d5142ee981", "discount_code": "CABIN", "purchase_type_id": "ATTENDANCE_VIBECLIPSE_2024_10_TO_16", "price_multiplier": "0.85" },
                { "discount_id": "eae4716a-fb3e-4832-9b5f-91572a818d48", "discount_code": "CABIN", "purchase_type_id": "ATTENDANCE_VIBECLIPSE_2024_5_TO_10", "price_multiplier": "0.85" },
            ], [
                { "purchase_type_id": "ATTENDANCE_VIBECLIPSE_2024_10_TO_16", "price_in_cents": 33000, "max_available": null, "description": "Ticket (ages 10 to 16)", "max_per_account": 5, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": true, "available_from": null, "available_to": null },
                { "purchase_type_id": "ATTENDANCE_VIBECLIPSE_2024_2_TO_5", "price_in_cents": 10000, "max_available": null, "description": "Ticket (ages 2 to 5)", "max_per_account": 5, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": true, "available_from": null, "available_to": null },
                { "purchase_type_id": "ATTENDANCE_VIBECLIPSE_2024_5_TO_10", "price_in_cents": 20000, "max_available": null, "description": "Ticket (ages 5 to 10)", "max_per_account": 5, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": true, "available_from": null, "available_to": null },
                { "purchase_type_id": "ATTENDANCE_VIBECLIPSE_2024_DAY_PASS", "price_in_cents": 25000, "max_available": null, "description": "Day pass to Vibeclipse 2024", "max_per_account": 5, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": true, "available_from": null, "available_to": null },
                { "purchase_type_id": "ATTENDANCE_VIBECLIPSE_2024_OVER_16", "price_in_cents": 55000, "max_available": 600, "description": "Ticket (16 or older)", "max_per_account": 2, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": true, "available_from": null, "available_to": null },
                { "purchase_type_id": "BUS_330PM_VIBECLIPSE_2024", "price_in_cents": 6000, "max_available": null, "description": "Bus leaving AUS at 3:30 PM CST (meet at 3:00)", "max_per_account": null, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": false, "available_from": null, "available_to": new Date("2024-04-02T05:00:00.000Z") },
                { "purchase_type_id": "BUS_430PM_VIBECLIPSE_2024", "price_in_cents": 6000, "max_available": null, "description": "Bus leaving AUS at 4:30 PM CST (meet at 4:00)", "max_per_account": null, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": false, "available_from": null, "available_to": new Date("2024-04-02T05:00:00.000Z") },
                { "purchase_type_id": "BUS_730PM_VIBECLIPSE_2024", "price_in_cents": 6000, "max_available": 50, "description": "Bus leaving AUS at 7:30 PM CST (meet at 7:15, 50 available)", "max_per_account": null, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": false, "available_from": null, "available_to": new Date("2024-04-02T05:00:00.000Z") },
                { "purchase_type_id": "BUS_830PM_VIBECLIPSE_2024", "price_in_cents": 6000, "max_available": 50, "description": "Bus leaving AUS at 8:30 PM CST (meet at 8:15, 50 available)", "max_per_account": null, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": false, "available_from": null, "available_to": new Date("2024-04-02T05:00:00.000Z") },
                { "purchase_type_id": "PILLOW_WITH_CASE_VIBECLIPSE_2024", "price_in_cents": 2000, "max_available": null, "description": "Pillow (with pillowcase)", "max_per_account": null, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": false, "available_from": null, "available_to": new Date("2024-03-26T05:00:00.000Z") },
                { "purchase_type_id": "SLEEPING_BAG_VIBECLIPSE_2024", "price_in_cents": 3500, "max_available": null, "description": "Sleeping bag", "max_per_account": null, "festival_id": "a1fe0c91-5087-48d6-87b9-bdc1ef3716a6", "is_attendance_ticket": false, "available_from": null, "available_to": new Date("2024-03-26T05:00:00.000Z") },
                { "purchase_type_id": "VIBECAMP_3_BASIC_TICKET", "price_in_cents": 42000, "max_available": null, "description": "Basic ticket", "max_per_account": 2, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": true, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_BASIC_TICKET_UNDER_8", "price_in_cents": 21000, "max_available": null, "description": "Basic ticket (under 8 years old)", "max_per_account": 5, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": true, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_BUS_FROM_BALTIMORE_1PM", "price_in_cents": 2700, "max_available": 100, "description": "Bus ticket - BWI (Baltimore Airport) to Ramblewood - 1pm", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_BUS_FROM_BALTIMORE_4PM", "price_in_cents": 2700, "max_available": 100, "description": "Bus ticket - BWI (Baltimore Airport) to Ramblewood - 4pm", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_BUS_FROM_PHILADELPHIA_1PM", "price_in_cents": 3600, "max_available": 100, "description": "Bus ticket - PHL (Philadelphia Airport) to Ramblewood - 1pm", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_BUS_FROM_PHILADELPHIA_415PM", "price_in_cents": 3600, "max_available": 100, "description": "Bus ticket - PHL (Philadelphia Airport) to Ramblewood - 4:15pm", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_BUS_TO_BALTIMORE_1130AM", "price_in_cents": 2700, "max_available": 100, "description": "Bus ticket - Ramblewood to BWI (Baltimore Airport) - 11:30am", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_BUS_TO_BALTIMORE_230PM", "price_in_cents": 2700, "max_available": 100, "description": "Bus ticket - Ramblewood to BWI (Baltimore Airport) - 2:30pm", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_BUS_TO_PHILADELPHIA_1115AM", "price_in_cents": 3600, "max_available": 100, "description": "Bus ticket - Ramblewood to PHL (Philadelphia Airport) - 11:15am", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_BUS_TO_PHILADELPHIA_215PM", "price_in_cents": 3600, "max_available": 100, "description": "Bus ticket - Ramblewood to PHL (Philadelphia Airport) - 2:15pm", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_CABIN_TICKET", "price_in_cents": 59000, "max_available": null, "description": "Cabin ticket", "max_per_account": 2, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": true, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_CABIN_TICKET_UNDER_8", "price_in_cents": 38000, "max_available": null, "description": "Cabin ticket (under 8 years old)", "max_per_account": 5, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": true, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_PILLOW", "price_in_cents": 1500, "max_available": null, "description": "Pillow (including pillowcase)", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_SHEETS_AND_BLANKET", "price_in_cents": 4500, "max_available": null, "description": "Fitted and flat sheet and light cotton blanket combo", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
                { "purchase_type_id": "VIBECAMP_3_SLEEPING_BAG", "price_in_cents": 2500, "max_available": null, "description": "Sleeping bag", "max_per_account": null, "festival_id": "4821bd6a-9e16-4944-b9a1-afe3256ff18d", "is_attendance_ticket": false, "available_from": null, "available_to": null },
            ]),
            [
                {
                    basePrice: 55000 * 3,
                    count: 3,
                    discountMultiplier: 0.85,
                    discountedPrice: 55000 * 3 * 0.85,
                    purchaseType: "ATTENDANCE_VIBECLIPSE_2024_OVER_16",
                },
                {
                    basePrice: 42000 * 2,
                    count: 2,
                    discountMultiplier: undefined,
                    discountedPrice: 42000 * 2,
                    purchaseType: "VIBECAMP_3_BASIC_TICKET",
                },
                {
                    basePrice: 2700,
                    count: 1,
                    discountMultiplier: undefined,
                    discountedPrice: 2700,
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