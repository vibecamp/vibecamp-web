import { Router } from 'oak'

import v1_auth from './v1/auth.ts'
import v1_account from './v1/account.ts'
import v1_event from './v1/event.ts'
import v1_purchase from './v1/purchase.ts'
import v1_misc from './v1/misc.ts'
import v1_tables from './v1/tables.ts'

export const router = new Router()

// Every routes file in this directory should have its register function
// imported and then called here!
v1_auth(router)
v1_account(router)
v1_event(router)
v1_misc(router)
v1_purchase(router)
v1_tables(router)

router.get('/', (ctx) => {
  ctx.response.body = 'OK'
})
