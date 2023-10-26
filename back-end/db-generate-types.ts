
import { withDBConnection } from "./db.ts";

type DataType =
    | 'boolean'
    | 'text'
    | 'integer'
    | 'timestamp with time zone'
    | 'date'
    | 'point'
    | 'uuid'

await withDBConnection(async db => {

    const columns = (await db.queryObject<{
        table_name: string,
        column_name: string,
        data_type: DataType,
        is_nullable: 'YES' | 'NO'
    }>`
    SELECT information_schema.tables.table_name, column_name, data_type, is_nullable
    FROM information_schema.tables, information_schema.columns
    WHERE information_schema.tables.table_schema = 'public' AND information_schema.tables.table_name = information_schema.columns.table_name
    ORDER BY information_schema.tables.table_name, information_schema.columns.column_name ASC
`).rows

    // dumped table content
    const tableRowsToDump: readonly string[] = [
        'purchase_type',
        'volunteer_type',
        'age_group',
        'diet'
    ]

    const tableRows: Record<string, Array<unknown>> = Object.fromEntries(await Promise.all(
        tableRowsToDump
            .map(async table_name =>
                [table_name, await db.queryTable(table_name as any)] as const)
    ))

    const dbRowsStr =
        `export const TABLE_ROWS = {
${Object.entries(tableRows).map(([tableName, rows]) =>
            `  ${tableName}: [
${rows.map(row => `    ${JSON.stringify(row)},`).join('\n')}
  ],`).join('\n')}
} as const`

    // table schemas
    const tables: Record<string, Array<{ column_name: string, type: string }>> = {}

    /**
     * Postgres column type -> TypeScript type
     */
    const TYPE_MAP: Record<DataType, string> = {
        'boolean': 'boolean',
        'text': 'string',
        'uuid': 'string',
        'integer': 'number',
        'point': 'unknown',
        'date': 'Date',
        'timestamp with time zone': 'unknown'
    }

    for (const { table_name, column_name, data_type, is_nullable } of columns) {
        if (tables[table_name] == null) {
            tables[table_name] = []
        }

        tables[table_name]?.push({
            column_name,
            type: TYPE_MAP[data_type] + (is_nullable === 'YES' ? ' | null' : '')
        })
    }

    const dbTypesStr =
        `export type Tables = {
${Object.entries(tables).map(([tableName, columns]) =>
            tableRowsToDump.includes(tableName)
                ? `  ${tableName}: (typeof TABLE_ROWS)['${tableName}'][number]`
                : `  ${tableName}: {
${columns.map(({ column_name, type }) => `    ${column_name}: ${type},`).join('\n')}
  },`).join('\n')}
}

export type TableName = keyof Tables`

    await Deno.writeTextFile('./db-types.ts', dbTypesStr + '\n\n' + dbRowsStr)
})