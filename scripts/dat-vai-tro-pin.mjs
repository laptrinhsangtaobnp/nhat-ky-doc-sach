// Đặt (hoặc đổi) mật khẩu cho vai trò Neon `dang_nhap_pin` (tạo trong sql/2026-11-19_dang_nhap_pin.sql) và ghi
// NEON_PIN_URL vào .env. KHÔNG in mật khẩu. Sau đó đưa lên Supabase:
//   npx supabase secrets set NEON_PIN_URL=<giá trị trong .env> --project-ref <ref>   (hoặc để Claude chạy)
// Chạy: node scripts/dat-vai-tro-pin.mjs
import { randomBytes } from 'crypto'
import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'
import pg from 'pg'
import { docEnv, GOC_DU_AN } from './docEnv.mjs'

const lay = docEnv()
const goc = lay('NEON_DATABASE_URL')
if (!goc) { console.error('Thiếu NEON_DATABASE_URL trong .env'); process.exit(1) }

const mk = randomBytes(24).toString('base64url')                  // ~190 bit, chỉ chữ / số / - _
const c = new pg.Client({ connectionString: goc })
await c.connect()
try {
  await c.query(`alter role dang_nhap_pin with login password '${mk}'`)
} finally { await c.end() }

const u = new URL(goc)
u.username = 'dang_nhap_pin'
u.password = mk
const tep = join(GOC_DU_AN, '.env')
const cu = readFileSync(tep, 'utf8')
const dong = `NEON_PIN_URL=${u.toString()}`
writeFileSync(tep, /^NEON_PIN_URL=.*$/m.test(cu) ? cu.replace(/^NEON_PIN_URL=.*$/m, dong) : cu.replace(/\n?$/, '\n') + dong + '\n')

// thử đăng nhập bằng vai trò mới: chỉ gọi được 2 hàm, không đọc được bảng
const t = new pg.Client({ connectionString: u.toString() })
await t.connect()
try {
  await t.query('select public.ds_ten_theo_ma($1)', ['XXXXXX'])
  const bang = await t.query('select 1 from public.ho_so limit 1').then(() => 'ĐỌC ĐƯỢC (SAI!)', () => 'bị chặn (đúng)')
  console.log('Đã đặt mật khẩu, ghi NEON_PIN_URL vào .env. Gọi hàm: được. Đọc bảng ho_so:', bang)
} finally { await t.end() }
