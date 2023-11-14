import { assertEquals } from 'https://deno.land/std@0.160.0/testing/asserts.ts'
import { queryTableQuery, insertTableQuery, updateTableQuery } from './db-inner.ts'

Deno.test({
    name: 'Query table query 1',
    fn() {
        const [query, params] = queryTableQuery(
            'account'
        )

        assertEquals(
            normalizeQuery(query),
            normalizeQuery(`
          SELECT * FROM account
        `)
        )

        assertEquals(
            params,
            []
        )
    }
})

Deno.test({
    name: 'Query table query 2',
    fn() {
        const [query, params] = queryTableQuery(
            'account',
            { where: ['email_address', '=', 'foo@bar.com'] }
        )

        assertEquals(
            normalizeQuery(query),
            normalizeQuery(`
          SELECT * FROM account WHERE email_address = $1
        `)
        )

        assertEquals(
            params,
            ['foo@bar.com']
        )
    }
})

Deno.test({
    name: 'Insert table query',
    fn() {
        const [query, params] = insertTableQuery(
            'account',
            { email_address: 'foo@bar.com', is_seed_account: true }
        )

        assertEquals(
            normalizeQuery(query),
            normalizeQuery(`
          INSERT INTO account
            (email_address, is_seed_account)
            VALUES ($1, $2)
          RETURNING *
        `)
        )

        assertEquals(
            params,
            ['foo@bar.com', true]
        )
    }
})

Deno.test({
    name: 'Update table query',
    fn() {
        const [query, params] = updateTableQuery(
            'account',
            { email_address: 'foo@bar.com', is_seed_account: true },
            [
                ['password_hash', '=', '1234'],
                ['password_salt', '=', '4567']
            ]
        )

        assertEquals(
            normalizeQuery(query),
            normalizeQuery(`
            UPDATE account
            SET (email_address, is_seed_account) = ($1, $2)
            WHERE password_hash = $3 AND password_salt = $4
            RETURNING *
        `)
        )

        assertEquals(
            params,
            ['foo@bar.com', true, '1234', '4567']
        )
    }
})

const normalizeQuery = (query: string) => (' ' + query + ' ').replace(/[\s]+/g, ' ')
