/**
 * Script to clone production database to test database with anonymized data.
 *
 * Usage:
 *   deno run --allow-net --allow-env --allow-read clone-schema.ts <PROD_DB_URL> <TEST_DB_URL>
 *
 * Example:
 *   deno run --allow-net --allow-env --allow-read clone-schema.ts \
 *     "postgres://user:pass@prod-host:5432/prod_db" \
 *     "postgres://user:pass@test-host:5432/test_db"
 */

import { Pool } from 'postgres'
import { hash } from 'bcrypt'
import { Tables, TableName } from './types/db-types.ts'
import { extendDBClient, VibecampDBClient } from './utils/db.ts'

// ============================================================================
// Configuration
// ============================================================================

// Tables to skip entirely (leave empty in test DB)
const SKIP_TABLES: TableName[] = [
  'account_password_reset_secret',
  'application',
]

// Enum/static tables - these need to be cloned first if not already present
const ENUM_TABLES: TableName[] = [
  'age_range',
  'diet',
  'event_type',
  'volunteer_type',
]

// Tables with views that we shouldn't insert into
const VIEW_TABLES: TableName[] = [
  'purchase_sorted',
]

// Insertion order to respect foreign key constraints
// Tables listed earlier have no dependencies on tables listed later
const TABLE_ORDER: TableName[] = [
  // Enum/lookup tables (already exist, but listed for completeness)
  'age_range',
  'diet',
  'event_type',
  'volunteer_type',

  // Base tables with no foreign keys to other user tables
  'festival_site',
  'faq_node', // self-referential, but we can handle with deferred constraints
  'announcement',

  // Tables depending on festival_site
  'cabin',
  'event_site',
  'festival',

  // Tables depending on festival
  'purchase_type',

  // Account (depends on application, but we're skipping application)
  'account',

  // Tables depending on account
  'stored_image',
  'invite_code',
  'event',

  // Tables depending on account and event
  'event_bookmark',

  // Tables depending on account
  'attendee',

  // Tables depending on attendee and festival
  'badge_info',
  'attendee_cabin',

  // Tables depending on purchase_type and account
  'discount',
  'purchase',

  // Skipped tables (listed for completeness)
  'account_password_reset_secret',
  'application',

  // Views (not actual tables)
  'purchase_sorted',
]

// ============================================================================
// Anonymization utilities
// ============================================================================

const TEST_PASSWORD = 'password'

async function hashAndSaltPassword(password: string): Promise<{ password_hash: string; password_salt: string }> {
  const password_salt = crypto.randomUUID()
  const saltedPassword = password + password_salt
  const password_hash = await hash(saltedPassword)
  return { password_hash, password_salt }
}

function randomDigits(length: number): string {
  let result = ''
  for (let i = 0; i < length; i++) {
    result += Math.floor(Math.random() * 10).toString()
  }
  return result
}

function randomAlphanumeric(length: number): string {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789'
  let result = ''
  for (let i = 0; i < length; i++) {
    result += chars[Math.floor(Math.random() * chars.length)]
  }
  return result
}

function randomName(): string {
  const firstNames = ['Alex', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn', 'Avery', 'Blake', 'Cameron']
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore']
  return `${firstNames[Math.floor(Math.random() * firstNames.length)]} ${lastNames[Math.floor(Math.random() * lastNames.length)]}`
}

function randomHandle(): string {
  return `user_${randomAlphanumeric(8)}`
}

function randomPhoneNumber(original: string | null): string | null {
  if (original == null) return null
  // Preserve the general format - count digits
  const digitCount = (original.match(/\d/g) || []).length
  return randomDigits(digitCount)
}

function randomEmail(): string {
  return `${randomAlphanumeric(10)}@example.com`
}

function randomBio(original: string | null): string | null {
  if (original == null) return null
  // Generate roughly similar length lorem ipsum
  const words = ['lorem', 'ipsum', 'dolor', 'sit', 'amet', 'consectetur', 'adipiscing', 'elit', 'sed', 'do', 'eiusmod', 'tempor']
  const wordCount = Math.max(1, Math.ceil(original.length / 6))
  const result: string[] = []
  for (let i = 0; i < wordCount; i++) {
    result.push(words[Math.floor(Math.random() * words.length)]!)
  }
  return result.join(' ')
}

function randomLocation(original: string | null): string | null {
  if (original == null) return null
  const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'Austin']
  return cities[Math.floor(Math.random() * cities.length)]!
}

function randomImageUrl(original: string | null): string | null {
  if (original == null) return null
  return `https://example.com/images/${randomAlphanumeric(16)}.jpg`
}

async function hashEmail(email: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(email.toLowerCase())
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return `${hashHex.substring(0, 16)}@gmail.com`
}

// Convert PostgreSQL point type (returned as {x, y} object) back to string format for insertion
function convertPoint(point: unknown): string | null {
  if (point == null) return null
  if (typeof point === 'object' && 'x' in point && 'y' in point) {
    const p = point as { x: string; y: string }
    return `(${p.x},${p.y})`
  }
  return String(point)
}

// ============================================================================
// Row transformation functions
// ============================================================================

async function transformAccountRow(row: Tables['account']): Promise<Tables['account']> {
  const { password_hash, password_salt } = await hashAndSaltPassword(TEST_PASSWORD)

  // Use account_id in the hash to guarantee uniqueness
  const hashedEmail = await hashEmail(row.account_id + row.email_address)

  return {
    ...row,
    email_address: hashedEmail,
    password_hash,
    password_salt,
    notes: '',
    // Clear application_id since we're not copying applications
    application_id: null,
  }
}

function transformAttendeeRow(row: Tables['attendee']): Tables['attendee'] {
  return {
    ...row,
    name: randomName(),
    discord_handle: row.discord_handle ? randomHandle() : null,
    twitter_handle: row.twitter_handle ? randomHandle() : null,
    phone_number: randomPhoneNumber(row.phone_number),
    email_address: row.email_address ? randomEmail() : null,
    notes: '',
  }
}

function transformBadgeInfoRow(row: Tables['badge_info']): Tables['badge_info'] {
  return {
    ...row,
    badge_name: randomName(),
    badge_username: row.badge_username ? randomHandle() : null,
    badge_bio: randomBio(row.badge_bio),
    badge_location: randomLocation(row.badge_location),
    badge_picture_url: randomImageUrl(row.badge_picture_url),
  }
}

function transformFestivalSiteRow(row: Tables['festival_site']): Tables['festival_site'] {
  return {
    ...row,
    location: convertPoint(row.location) as unknown,
  }
}

function transformEventSiteRow(row: Tables['event_site']): Tables['event_site'] {
  return {
    ...row,
    location: convertPoint(row.location) as unknown,
  }
}

// ============================================================================
// Database connection helpers
// ============================================================================

function createPool(dbUrl: string): Pool {
  const url = new URL(dbUrl)
  return new Pool({
    database: url.pathname.split('/')[1],
    hostname: url.hostname,
    password: url.password,
    port: url.port ? Number(url.port) : 5432,
    user: url.username,
  }, 1)
}

// ============================================================================
// Batch insertion helpers
// ============================================================================

const BATCH_SIZE = 100

// Build a batch INSERT query with quoted column names and ON CONFLICT DO NOTHING
function buildBatchInsertQuery(
  tableName: string,
  rows: Record<string, unknown>[],
): { query: string; values: unknown[] } {
  if (rows.length === 0) {
    return { query: '', values: [] }
  }

  // Get column names from first row
  const columns = Object.keys(rows[0]!)
  const columnNames = columns.map(col => `"${col}"`).join(', ')

  const values: unknown[] = []
  const valuePlaceholders: string[] = []

  for (let rowIdx = 0; rowIdx < rows.length; rowIdx++) {
    const row = rows[rowIdx]!
    const rowPlaceholders: string[] = []
    for (let colIdx = 0; colIdx < columns.length; colIdx++) {
      values.push(row[columns[colIdx]!])
      rowPlaceholders.push(`$${values.length}`)
    }
    valuePlaceholders.push(`(${rowPlaceholders.join(', ')})`)
  }

  const query = `INSERT INTO "${tableName}" (${columnNames}) VALUES ${valuePlaceholders.join(', ')} ON CONFLICT DO NOTHING`
  return { query, values }
}

// Insert rows in batches, returns count of rows actually inserted
async function batchInsert(
  db: VibecampDBClient,
  tableName: string,
  rows: Record<string, unknown>[],
): Promise<{ inserted: number; skipped: number }> {
  if (rows.length === 0) {
    return { inserted: 0, skipped: 0 }
  }

  let totalInserted = 0

  const totalBatches = Math.ceil(rows.length / BATCH_SIZE)
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batchNum = Math.floor(i / BATCH_SIZE) + 1
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { query, values } = buildBatchInsertQuery(tableName, batch)

    if (query) {
      try {
        const result = await db.queryObject(query, values)
        // rowCount tells us how many were actually inserted (not skipped due to conflict)
        const inserted = result.rowCount ?? batch.length
        totalInserted += inserted
        if (totalBatches > 1) {
          console.log(`    Batch ${batchNum}/${totalBatches}: inserted ${inserted}/${batch.length}`)
        }
      } catch (error) {
        console.error(`  Error in batch ${batchNum}/${totalBatches}:`, error)
        console.error(`  First row in failing batch:`, JSON.stringify(batch[0], null, 2))
        throw error
      }
    }
  }

  const skipped = rows.length - totalInserted
  return { inserted: totalInserted, skipped }
}

// ============================================================================
// Main cloning logic
// ============================================================================

async function cloneTable<T extends TableName>(
  tableName: T,
  prodDb: VibecampDBClient,
  testDb: VibecampDBClient,
  transform?: (row: Tables[T]) => Tables[T] | Promise<Tables[T]>,
): Promise<{ inserted: number; skipped: number }> {
  console.log(`  Querying ${tableName}...`)
  const rows = await prodDb.queryTable(tableName)
  console.log(`  Found ${rows.length} rows`)

  if (rows.length === 0) {
    return { inserted: 0, skipped: 0 }
  }

  // Transform all rows first
  console.log(`  Transforming rows...`)
  const transformedRows: Record<string, unknown>[] = []
  for (const row of rows) {
    const transformed = transform ? await transform(row as Tables[T]) : row
    transformedRows.push(transformed as Record<string, unknown>)
  }

  // Batch insert
  console.log(`  Inserting in batches of ${BATCH_SIZE}...`)
  return await batchInsert(testDb, tableName, transformedRows)
}

// Tables in reverse order for deletion (to respect foreign key constraints)
const DELETE_ORDER: TableName[] = [...TABLE_ORDER].reverse().filter(
  t => !VIEW_TABLES.includes(t) && !SKIP_TABLES.includes(t)
)

async function main() {
  const prodDbUrl = 'postgres://vibecamp_db_u5bt_user_readonly:9787823429399062@dpg-cjl6ggfv9s6c73bi6g2g-a.oregon-postgres.render.com/vibecamp_db_u5bt'
  const testDbUrl = 'postgresql://vibecamp_db_test_user:xcbhZsCpem3G9dW5XW3vBnM2flWHr25o@dpg-d59ahrm3jp1c73busoi0-a.oregon-postgres.render.com/vibecamp_db_test'

  console.log('Connecting to databases...')
  const prodPool = createPool(prodDbUrl)
  const testPool = createPool(testDbUrl)

  const prodClient = extendDBClient(await prodPool.connect())
  const testClient = extendDBClient(await testPool.connect())

  try {
    // First, delete all rows from test database in reverse order
    console.log('Clearing test database...\n')
    for (const tableName of DELETE_ORDER) {
      console.log(`  Deleting from ${tableName}...`)
      await testClient.queryObject(`DELETE FROM "${tableName}"`)
    }

    console.log('\nStarting database clone with anonymization...\n')

    for (const tableName of TABLE_ORDER) {

      // Skip tables we don't want to copy
      if (SKIP_TABLES.includes(tableName)) {
        console.log(`Skipping ${tableName} (excluded)`)
        continue
      }

      // Skip views
      if (VIEW_TABLES.includes(tableName)) {
        console.log(`Skipping ${tableName} (view)`)
        continue
      }

      console.log(`\nProcessing ${tableName}...`)

      let result: { inserted: number; skipped: number }

      switch (tableName) {
        case 'account':
          result = await cloneTable('account', prodClient, testClient, transformAccountRow)
          break
        case 'attendee':
          result = await cloneTable('attendee', prodClient, testClient, transformAttendeeRow)
          break
        case 'badge_info':
          result = await cloneTable('badge_info', prodClient, testClient, transformBadgeInfoRow)
          break
        case 'festival_site':
          result = await cloneTable('festival_site', prodClient, testClient, transformFestivalSiteRow)
          break
        case 'event_site':
          result = await cloneTable('event_site', prodClient, testClient, transformEventSiteRow)
          break
        default:
          result = await cloneTable(tableName, prodClient, testClient)
      }

      const skipMsg = result.skipped > 0 ? ` (${result.skipped} skipped - already exist)` : ''
      console.log(`  Inserted ${result.inserted} rows into ${tableName}${skipMsg}`)
    }

    console.log('\n✓ Database clone completed successfully!')

  } catch (error) {
    console.error('\n✗ Error during clone:', error)
    Deno.exit(1)
  } finally {
    prodClient.release()
    testClient.release()
    await prodPool.end()
    await testPool.end()
  }
}

main()
