import { withDBConnection } from './utils/db.ts'

/**
 * Postgres column type -> TypeScript type
 */
const TYPE_MAP = {
  'boolean': 'boolean',
  'text': 'string',
  'uuid': 'string',
  'integer': 'number',
  'double precision': 'string',
  'point': 'unknown',
  'date': 'Date',
  'timestamp': 'Date',
  'timestamp without time zone': 'Date',
  'timestamp with time zone': 'Date',
} as const

/**
 * Possible postgres column type names
 */
type PostgresColumnType = keyof typeof TYPE_MAP

/**
 * The **entire contents** of these tables will be downloaded and written into
 * db-types.ts. This should only be done for "enum-like" tables that are
 * relatively small, and don't change very often!
 */
const TABLES_TO_DUMP: readonly string[] = [
  'volunteer_type',
  'diet',
  'event_type',
  'age_range',
]

await withDBConnection(async (db) => {
  const columns = (await db.queryObject<{
    table_name: string
    column_name: string
    data_type: PostgresColumnType
    is_nullable: 'YES' | 'NO'
    constraint_type: 'PRIMARY KEY' | 'FOREIGN KEY' | null
    referencing_table_name: string | null
    referencing_column_name: string | null
  }>`
        SELECT
            information_schema.columns.table_name,
            information_schema.columns.column_name,
            information_schema.columns.data_type,
            information_schema.columns.is_nullable,
            information_schema.table_constraints.constraint_type,
            information_schema.key_column_usage.table_name AS referencing_table_name,
            information_schema.key_column_usage.column_name AS referencing_column_name
        FROM information_schema.columns
        LEFT JOIN information_schema.tables ON information_schema.columns.table_name = information_schema.tables.table_name
        LEFT JOIN information_schema.constraint_column_usage ON information_schema.columns.column_name = information_schema.constraint_column_usage.column_name
        LEFT JOIN information_schema.table_constraints ON information_schema.constraint_column_usage.constraint_name = information_schema.table_constraints.constraint_name
        LEFT JOIN information_schema.key_column_usage ON information_schema.constraint_column_usage.constraint_name = information_schema.key_column_usage.constraint_name
        WHERE information_schema.tables.table_schema = 'public'
        ORDER BY information_schema.tables.table_name, information_schema.columns.column_name ASC
    `).rows

  const tableRows: Record<string, Array<unknown>> = Object.fromEntries(
    await Promise.all(
      TABLES_TO_DUMP
        .map(async (table_name) =>
          [table_name, await db.queryTable(table_name as any)] as const
        ),
    ),
  )

  const dbRowsStr = `export const TABLE_ROWS = {
${
    Object.entries(tableRows)
      .map(([tableName, rows]) =>
        `  ${tableName}: [
${
          rows
            .map((row) => `    ${JSON.stringify(row)},`)
            .toSorted()
            .join('\n')
        }
  ],`
      )
      .toSorted()
      .join('\n')
  }
} as const`

  // table schemas
  const tables: Record<string, Array<{ column_name: string; type: string }>> =
    {}
  const primaryKeyNominalTypes: string[] = []

  const justColumns = columns.reduce(
    (cols, row) => {
      const key = row.table_name + '__' + row.column_name
      if (!cols.has(key)) {
        const { table_name, column_name, data_type, is_nullable, ..._ } = row
        cols.set(key, { table_name, column_name, data_type, is_nullable })
      }

      return cols
    },
    new Map<
      string,
      Pick<
        (typeof columns)[number],
        'table_name' | 'column_name' | 'data_type' | 'is_nullable'
      >
    >(),
  )

  for (
    const { table_name, column_name, data_type, is_nullable } of justColumns
      .values()
  ) {
    const isPrimaryKey = column_name.endsWith('_id')

    const nominalTypeName = table_name + '__' + column_name + '_Type'

    // HACK
    if (isPrimaryKey) {
      primaryKeyNominalTypes.push(nominalTypeName)
    }

    if (tables[table_name] == null) {
      tables[table_name] = []
    }

    const isForeignKeyTo = columns.find((r) =>
      r.table_name !== table_name &&
      r.referencing_table_name === table_name &&
      r.referencing_column_name === column_name &&
      r.constraint_type === 'FOREIGN KEY'
    )

    tables[table_name]?.push({
      column_name,
      type: (
        isForeignKeyTo
          ? `Tables['${isForeignKeyTo.table_name}']['${isForeignKeyTo.column_name}']`
          : isPrimaryKey
          ? nominalTypeName
          : TYPE_MAP[data_type] ?? 'unknown'
      ) + (is_nullable === 'YES' ? ' | null' : ''),
    })
  }

  const headingComment = `/**
 * NOTE: This file is generated automatically by generate-db-types.ts, it
 * should not be modified manually!
 */`

  const nominalTypesStr =
    '// Nominal types for primary keys; explanation of this pattern: https://www.typescriptlang.org/play/typescript/language-extensions/nominal-typing.ts.html\n' +
    primaryKeyNominalTypes
      .map((t) =>
        `export const ${t}Symbol = Symbol('${t}'); export type ${t} = string & { [${t}Symbol]: undefined };`
      )
      .join('\n')

  const dbColumnsStr = `export const TABLE_COLUMNS = {
${
    Object.entries(tables).map(([tableName, columns]) =>
      `  ${tableName}: ${JSON.stringify(columns.map((c) => c.column_name))},`
    ).join('\n')
  }
} as const`

  const dbTypesStr = `export type Tables = {
${
    Object.entries(tables).map(([tableName, columns]) =>
      TABLES_TO_DUMP.includes(tableName)
        ? `  ${tableName}: (typeof TABLE_ROWS)['${tableName}'][number]`
        : `  ${tableName}: {
${
          columns.map(({ column_name, type }) => `    ${column_name}: ${type},`)
            .join('\n')
        }
  },`
    ).join('\n')
  }
}

export type TableName = keyof Tables`

  await Deno.writeTextFile(
    './types/db-types.ts',
    headingComment + '\n\n' + nominalTypesStr + '\n\n' + dbTypesStr + '\n\n' +
      dbRowsStr + '\n\n' + dbColumnsStr,
  )
})
