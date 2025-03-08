export const REFERRAL_MAXES = [
  5, // seed people
  3, // 1 degrees of separation
] as const

export const ONE_SECOND_MS = 1_000
export const ONE_MINUTE_MS = 60 * ONE_SECOND_MS
export const ONE_HOUR_MS = 60 * ONE_MINUTE_MS
export const ONE_DAY_MS = 24 * ONE_HOUR_MS
export const ONE_WEEK_MS = 7 * ONE_DAY_MS
export const ONE_YEAR_MS = 365 * ONE_DAY_MS

export const PASSWORD_RESET_SECRET_KEY = 'passwordResetSecret'
