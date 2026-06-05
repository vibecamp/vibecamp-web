import { Router, Status } from 'oak'

import { withDBConnection } from '../utils/db.ts'
import { passwordResetSecrets } from './v1/account.ts'

// Test-only routes. Only registered when the ALLOW_TEST_HOOKS env var is set
// to '1'. Production deployments must NEVER set this env var; it would expose
// password-reset secrets and allow any caller to take over any account.
//
// The intended caller is the Playwright e2e suite, which needs to read the
// secret minted in the gift webhook in order to walk the recipient through
// the password-set flow (because we can't read their email inbox in tests).
export default function register(router: Router) {
  if (Deno.env.get('ALLOW_TEST_HOOKS') !== '1') return

  console.warn(
    '!!! ALLOW_TEST_HOOKS=1 — registering test-only routes. NEVER set this in production. !!!',
  )

  // Returns the most recent password-reset secret minted for the given email.
  // Used by tests to simulate "user clicks the password-reset link in their
  // email" without actually parsing email.
  router.get('/test-hooks/password-reset-secret/:email', async (ctx) => {
    const rawEmail = ctx.params.email ?? ''
    const email = decodeURIComponent(rawEmail).toLowerCase()

    const account = await withDBConnection((db) =>
      db.queryTable('account', { where: ['email_address', '=', email] })
    )
    const account_id = account[0]?.account_id

    if (account_id == null) {
      ctx.response.status = Status.NotFound
      ctx.response.body = JSON.stringify({ secret: null })
      ctx.response.type = 'json'
      return
    }

    let foundSecret: string | undefined
    for (const [secret, mappedAccountId] of passwordResetSecrets.entries()) {
      if (mappedAccountId === account_id) {
        foundSecret = secret
        break
      }
    }

    ctx.response.status = Status.OK
    ctx.response.body = JSON.stringify({ secret: foundSecret ?? null })
    ctx.response.type = 'json'
  })
}
