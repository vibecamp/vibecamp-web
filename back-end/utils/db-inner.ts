import { TABLE_COLUMNS, TableName, Tables } from '../types/db-types.ts'
import { objectEntries, objectKeys } from './misc.ts'

export const queryTableQuery = <
  TTableName extends TableName,
  TColumnName extends keyof Tables[TTableName],
>(
  table: TTableName,
  { where }: { where?: WhereClause<TTableName, TColumnName> } = {},
): [string, unknown[]] => {
  if (where != null) {
    const [column, op, value] = where

    return [
      `SELECT * FROM ${table} WHERE ${column as string} ${op} $1`,
      [value],
    ]
  } else {
    return [
      `SELECT * FROM ${table}`,
      [],
    ]
  }
}

export const insertTableQuery = <
  TTableName extends TableName,
>(
  table: TTableName,
  row: Partial<Tables[TableName]>,
): [string, unknown[]] => {
  const sanitizedRow = stripUnknownColumns(table, row)

  const rowEntries = objectEntries(sanitizedRow)

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
    columnValues,
  ]
}

export const updateTableQuery = <
  TTableName extends TableName,
  TColumnNames extends Array<keyof Tables[TTableName]>,
>(
  table: TTableName,
  row: Partial<Tables[TableName]>,
  where: WhereClause<TTableName, TColumnNames[number]>[],
): [string, unknown[]] => {
  const sanitizedRow = stripUnknownColumns(table, row)

  const rowEntries = objectEntries(sanitizedRow)

  const columns = rowEntries.map(([column]) => column).join(', ')
  const columnPlaceholders = rowEntries.map((_, index) => `$${index + 1}`).join(
    ', ',
  )
  const columnValues = rowEntries.map(([_, value]) => value)

  const whereClauses = where.map(([column, op], index) =>
    `${column as string} ${op} $${rowEntries.length + index + 1}`
  ).join(' AND ')
  const whereValues = where.map(([_column, _op, value]) => value)

  const setClause = rowEntries.length > 1
    ? `(${columns}) = (${columnPlaceholders})`
    : `${columns} = ${columnPlaceholders}`

  return [
    `
      UPDATE ${table}
        SET
          ${setClause}
        WHERE
          ${whereClauses}
        RETURNING *
    `,
    [...columnValues, ...whereValues],
  ]
}

/**
 * When extraneous columns appear in the query, the query will error. This has
 * caused a couple of production bugs, and there's no way to guard against it
 * with types because TypeScript doesn't enforce the absence of object keys.
 * So instead, we strip any extra columns out at runtime.
 */
const stripUnknownColumns = <
  TTableName extends TableName,
>(
  table: TTableName,
  row: Partial<Tables[TableName]>,
): Partial<Tables[TableName]> => {
  const knownColumns = new Set<string>(TABLE_COLUMNS[table])
  const newRow: Partial<Tables[TableName]> = {}

  for (const column of objectKeys(row)) {
    if (knownColumns.has(column)) {
      newRow[column] = row[column]
    } else {
      console.warn(
        `WARNING: Tried to send a query to table ${table} with unknown column ${column}`,
      )
    }
  }

  return newRow
}

export const deleteTableQuery = <
  TTableName extends TableName,
  TColumnNames extends Array<keyof Tables[TTableName]>,
>(
  table: TTableName,
  where: WhereClause<TTableName, TColumnNames[number]>[],
): [string, unknown[]] => {
  if (where.length === 0) {
    throw Error(
      `Must supply a where clause to delete, or it will clear the whole ${table} table!`,
    )
  }

  const whereClauses = where.map(([column, op], index) =>
    `${column as string} ${op} $${index + 1}`
  ).join(' AND ')
  const whereValues = where.map(([_column, _op, value]) => value)

  return [
    `
      DELETE FROM ${table}
      WHERE ${whereClauses}
    `,
    [...whereValues],
  ]
}

export type WhereClause<
  TTableName extends TableName,
  TColumnName extends keyof Tables[TTableName],
> = [TColumnName, '=' | '<' | '>', Tables[TTableName][TColumnName]]
