import { Tables } from './db-types.ts'

export type VibeJWTPayload = {
  iss?: string
  sub?: string
  aud?: string[] | string
  exp?: number
  nbf?: number
  iat?: number
  jti?: string
  [key: string]: unknown
  account_id: Tables['account']['account_id']
}

export type FullAccountInfo =
  & Pick<
    Tables['account'],
    'account_id' | 'email_address' | 'is_team_member' | 'is_low_income'
  >
  & {
    application_status: 'unsubmitted' | 'pending' | 'accepted' | 'rejected'
    // allowed_to_purchase: boolean,
    attendees: Array<Tables['attendee']>
    purchases: Array<Tables['purchase']>
    // inviteCodes: Array<Tables['invite_code'] & {
    //     used_by: string | null
    // }>
    cabins: Array<{
      cabin_name: Tables['cabin']['name']
      attendee_id: Tables['attendee']['attendee_id']
      festival_id: Tables['festival']['festival_id']
    }>
  }

export type AttendeeInfo =
  & Omit<Tables['attendee'], 'attendee_id' | 'notes' | 'associated_account_id'>
  & {
    attendee_id?: Tables['attendee']['attendee_id']
  }

export type UnknownObject = Record<string | number | symbol, unknown>

export type Maybe<T> = T | null | undefined
