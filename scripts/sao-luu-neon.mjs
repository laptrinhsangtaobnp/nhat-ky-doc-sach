// Sao lưu toàn bộ dữ liệu về máy (gói miễn phí Neon chỉ khôi phục được vài giờ gần nhất → phải tự sao lưu).
//   npm run sao-luu      → SaoLuu/neon_<ngày-giờ>/  (giữ 8 bản gần nhất)
// Bảng dữ liệu (public) lấy từ Neon; tài khoản đăng nhập (auth.users, auth.identities) lấy từ Supabase.
// Mỗi bảng 1 tệp .json.gz + cau-truc.json (bảng, hàm, RLS) + kiem-tra.json (số dòng đã đối chiếu).
// Cần trong .env: NEON_DATABASE_URL, SUPABASE_PAT, VITE_SUPABASE_URL. Khôi phục: scripts/khoi-phuc-neon.mjs
// ⚠ SaoLuu/ chứa dữ liệu học sinh và mật khẩu đã mã hoá: giữ riêng tư, KHÔNG đưa lên Git (đã chặn trong .gitignore).
import pg from 'pg'
import { readFileSync, writeFileSync, mkdirSync, readdirSync, rmSync } from 'fs'
import { gzipSync } from 'zlib'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const GOC = join(dirname(fileURLToPath(import.meta.url)), '..')
const GIU_LAI = 8

const env = readFileSync(join(GOC, '.env'), 'utf8')
const lay = k => env.match(new RegExp(`^\\s*${k}\\s*=\\s*['"]?([^'"\\s]+)`, 'm'))?.[1]
const NEON_URL = lay('NEON_DATABASE_URL'), PAT = lay('SUPABASE_PAT')
const REF = lay('VITE_SUPABASE_URL')?.match(/https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1]
if (!NEON_URL || !PAT || !REF) { console.error('Thiếu NEON_DATABASE_URL, SUPABASE_PAT hoặc VITE_SUPABASE_URL trong .env'); process.exit(1) }

const c = new pg.Client({ connectionString: NEON_URL })
await c.connect()
const nx = async s => (await c.query(s)).rows

async function sb(query) {
  const r = await fetch(`https://api.supabase.com/v1/projects/${REF}/database/query`, {
    method: 'POST', headers: { Authorization: `Bearer ${PAT}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ query }),
  })
  const j = await r.json()
  if (!r.ok || j.message) throw new Error(j.message || `HTTP ${r.status}`)
  return j
}

const cauTruc = {
  cot: await nx(`select table_name b, column_name ten, data_type kieu from information_schema.columns where table_schema='public' order by table_name, ordinal_position`),
  ham: await nx(`select p.proname ten, pg_get_functiondef(p.oid) d from pg_proc p where p.pronamespace='public'::regnamespace and p.prokind='f' order by 1`),
  rls: await nx(`select tablename b, policyname ten, cmd, qual, with_check from pg_policies where schemaname='public' order by 1, 2`),
  rls_bat: await nx(`select relname b, relrowsecurity bat from pg_class where relnamespace='public'::regnamespace and relkind='r' order by 1`),
}

const bd = new Date()
const d2 = n => String(n).padStart(2, '0')
const gocSaoLuu = join(GOC, 'SaoLuu')
const thuMuc = join(gocSaoLuu, `neon_${bd.getFullYear()}-${d2(bd.getMonth() + 1)}-${d2(bd.getDate())}_${d2(bd.getHours())}${d2(bd.getMinutes())}`)
mkdirSync(thuMuc, { recursive: true })
writeFileSync(join(thuMuc, 'cau-truc.json'), JSON.stringify(cauTruc, null, 1))

const ketQua = []
let loi = 0
function ghi(bang, dong, n) {
  const tep = `${bang}.json.gz`
  writeFileSync(join(thuMuc, tep), gzipSync(JSON.stringify(dong)))
  const kq = { bang, tep, da_luu: dong.length, trong_db: n, khop: dong.length === n }
  ketQua.push(kq)
  console.log(`${kq.khop ? 'OK  ' : 'LỆCH'} ${bang}: ${dong.length}/${n} dòng`)
  if (!kq.khop) loi++
}

// Toàn bộ bảng public đọc trong CÙNG một giao dịch → ảnh chụp nhất quán dù có người đang ghi
await c.query('begin isolation level repeatable read read only')
const bangs = (await nx(`select table_name b from information_schema.tables where table_schema='public' and table_type='BASE TABLE' order by 1`)).map(r => r.b)
for (const b of bangs) {
  try {
    const dong = (await c.query(`select to_jsonb(t) r from public."${b}" t`)).rows.map(x => x.r)
    const [{ n }] = (await c.query(`select count(*)::int n from public."${b}"`)).rows
    ghi(`public.${b}`, dong, n)
  } catch (e) {
    loi++; ketQua.push({ bang: `public.${b}`, loi: e.message }); console.log(`LỖI public.${b}: ${e.message}`)
  }
}
await c.query('commit')
await c.end()

for (const b of ['users', 'identities']) {
  try {
    const dong = []
    for (let o = 0; ; o += 500) {
      const trang = await sb(`select to_jsonb(t) r from auth."${b}" t order by t.id limit 500 offset ${o}`)
      dong.push(...trang.map(x => x.r))
      if (trang.length < 500) break
    }
    const [{ n }] = await sb(`select count(*)::int n from auth."${b}"`)
    ghi(`auth.${b}`, dong, n)
  } catch (e) {
    loi++; ketQua.push({ bang: `auth.${b}`, loi: e.message }); console.log(`LỖI auth.${b}: ${e.message}`)
  }
}

writeFileSync(join(thuMuc, 'kiem-tra.json'), JSON.stringify({ bat_dau: bd.toISOString(), ket_thuc: new Date().toISOString(), so_loi: loi, bang: ketQua }, null, 1))
console.log(`\nXong: ${ketQua.length} bảng, ${ketQua.reduce((x, k) => x + (k.da_luu || 0), 0)} dòng, ${loi} lỗi → ${thuMuc}`)
if (loi) { console.log('⚠ Bản này chưa trọn vẹn, xem kiem-tra.json và chạy lại.'); process.exit(1) }
const cu = readdirSync(gocSaoLuu).filter(t => /^neon_\d{4}-\d{2}-\d{2}_\d{4}$/.test(t)).sort().reverse().slice(GIU_LAI)
for (const t of cu) { rmSync(join(gocSaoLuu, t), { recursive: true }); console.log('Đã xoá bản cũ:', t) }
