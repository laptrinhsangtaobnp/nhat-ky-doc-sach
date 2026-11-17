// Chạy một tệp SQL trên Neon (dùng NEON_DATABASE_URL trong .env).  node scripts/chay-sql.mjs sql/<tệp>.sql
// In trạng thái RLS các bảng sau khi chạy. Nhớ: Neon → Data API → Refresh schema cache.
import pg from 'pg'
import { readFileSync } from 'fs'
import { docEnv } from './docEnv.mjs'
const tep = process.argv[2]
if (!tep) { console.error('Cách dùng: node scripts/chay-sql.mjs sql/<tệp>.sql'); process.exit(1) }
const url = docEnv()('NEON_DATABASE_URL')
if (!url) { console.error('Thiếu NEON_DATABASE_URL trong .env'); process.exit(1) }
const c = new pg.Client({ connectionString: url.replace(/sslmode=require/, 'sslmode=verify-full') })
await c.connect()
try {
  await c.query(readFileSync(tep, 'utf8'))
  console.log('Đã chạy', tep)
  const rls = (await c.query(`select relname b, relrowsecurity bat from pg_class where relnamespace='public'::regnamespace and relkind='r' order by 1`)).rows
  for (const r of rls) console.log(`${r.bat ? 'RLS bật ' : '⚠ RLS TẮT'} ${r.b}`)
} finally { await c.end() }
