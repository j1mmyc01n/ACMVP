import { getDatabase } from '@netlify/database'

let _db = null

/**
 * Returns the singleton Netlify Database client. Use `db.sql\`...\`` for
 * parameterised queries and `db.pool` for transactions.
 */
export function db() {
  if (!_db) _db = getDatabase()
  return _db
}
