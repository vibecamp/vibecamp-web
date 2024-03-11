import { TABLE_ROWS } from '../types/db-types.ts'

export const REFERRAL_MAXES = [
    5, // seed people
    3  // 1 degrees of separation
] as const

export const ONE_SECOND_MS = 1_000
export const ONE_MINUTE_MS = 60 * ONE_SECOND_MS
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS
export const ONE_DAY_MS = 24 * ONE_HOUR_MS

export const FESTIVALS_WITH_SALES_OPEN = TABLE_ROWS.festival.filter(f => f.sales_are_open)

export const PASSWORD_RESET_SECRET_KEY = 'password_reset_secret'