import { TableName, Tables } from '../types/db-types.ts'
import { objectEntries } from './misc.ts'


export const queryTableQuery =
    <
        TTableName extends TableName,
        TColumnName extends keyof Tables[TTableName],
    >(
        table: TTableName,
        { where }: { where?: WhereClause<TTableName, TColumnName> } = {}
    ): [string, unknown[]] => {
        if (where != null) {
            const [column, op, value] = where

            return [
                `SELECT * FROM ${table} WHERE ${column as string} ${op} $1`,
                [value]
            ]
        } else {
            return [
                `SELECT * FROM ${table}`,
                []
            ]
        }
    }


export const insertTableQuery =
    <
        TTableName extends TableName
    >(
        table: TTableName,
        row: Partial<Tables[TableName]>
    ): [string, unknown[]] => {

        const rowEntries = objectEntries(row)

        const columnNames = rowEntries.map(([columnName]) => columnName).join(', ')
        const columnValues = rowEntries.map(([_, value]) => value)
        const columnNumbers = rowEntries.map((_, index) => `$${index + 1}`).join(', ')

        return [
            `
      INSERT INTO ${table}
        (${columnNames})
        VALUES (${columnNumbers})
      RETURNING *
    `,
            columnValues
        ]
    }

export const updateTableQuery = <
    TTableName extends TableName,
    TColumnNames extends Array<keyof Tables[TTableName]>
>(
    table: TTableName,
    row: Partial<Tables[TableName]>,
    where: WhereClause<TTableName, TColumnNames[number]>[]
): [string, unknown[]] => {
    const rowEntries = objectEntries(row)

    const columns = rowEntries.map(([column]) => column).join(', ')
    const columnPlaceholders = rowEntries.map((_, index) => `$${index + 1}`).join(', ')
    const columnValues = rowEntries.map(([_, value]) => value)

    const whereClauses = where.map(([column, op], index) => `${column as string} ${op} $${rowEntries.length + index + 1}`).join(' AND ')
    const whereValues = where.map(([_column, _op, value]) => value)

    return [
        `
      UPDATE ${table}
        SET
          (${columns}) = (${columnPlaceholders})
        WHERE
          ${whereClauses}
        RETURNING *
    `,
        [...columnValues, ...whereValues]
    ]
}

export type WhereClause<
    TTableName extends TableName,
    TColumnName extends keyof Tables[TTableName],
> = [TColumnName, '=' | '<' | '>', Tables[TTableName][TColumnName]]
