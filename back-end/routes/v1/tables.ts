import { Router } from 'https://deno.land/x/oak@v11.1.0/router.ts'
import { defineRoute } from './_common.ts'
import { PUBLIC_TABLES, Routes } from '../../types/route-types.ts'
import { Status } from 'https://deno.land/std@0.152.0/http/http_status.ts'
import { withDBConnection } from '../../utils/db.ts'

export default function register(router: Router) {
  for (const table of PUBLIC_TABLES) {
    const endpoint = `/tables/${table}` as const

    defineRoute(router, {
      endpoint,
      method: 'get',
      handler: async () => {
        const rows = await withDBConnection((db) =>
          db.queryTable(table)
        ) as Routes[typeof endpoint]['response']
        return [rows, Status.OK]
      },
    })
  }
}
