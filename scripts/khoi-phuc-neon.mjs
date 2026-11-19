// Khôi phục bảng dữ liệu (public) từ một bản sao lưu vào một cơ sở dữ liệu Neon ĐÍCH.
//   node scripts/khoi-phuc-neon.mjs SaoLuu/neon_2026-11-20_2100 "postgresql://...nhanh-thu..."            → chạy thử, không ghi
//   node scripts/khoi-phuc-neon.mjs SaoLuu/neon_2026-11-20_2100 "postgresql://...nhanh-thu..." --that-su  → ghi thật
// Nên khôi phục vào một NHÁNH Neon mới (Neon → Branches → Create branch) để kiểm tra trước, không ghi đè bản đang chạy.
// Đích phải đã có cấu trúc bảng (chạy các tệp sql/ trước, hoặc dùng nhánh tạo từ bản chính).
// Tài khoản đăng nhập (auth.*) nằm ở Supabase: tệp auth.users.json.gz chỉ để đối chiếu / nhờ hỗ trợ khôi phục khi cần.
import pg from 'pg'
import { readFileSync, existsSync } from 'fs'
import { gunzipSync } from 'zlib'
import { join } from 'path'

const [thuMuc, dich] = process.argv.slice(2)
const THAT = process.argv.includes('--that-su')
if (!thuMuc || !dich || !existsSync(join(thuMuc, 'kiem-tra.json'))) {
  console.error('Cách dùng: node scripts/khoi-phuc-neon.mjs <thư mục sao lưu> <chuỗi kết nối Neon đích> [--that-su]')
  process.exit(1)
}

// Thứ tự: bảng được trỏ tới trước (cha trước con). Bảng mới thêm ở giai đoạn sau → bổ sung vào đây.
const THU_TU = ['lop', 'cai_dat', 'ho_so', 'chu_de', 'sach', 'sach_chu_de', 'luot_muon', 'nhat_ky', 'doc_xong', 'moc_dat', 'tuy_chon_hs', 'thu_gui_minh', 'pin_hs', 'lop_sai_pin', 'review']

const kt = JSON.parse(readFileSync(join(thuMuc, 'kiem-tra.json'), 'utf8'))
const coTrongBan = kt.bang.filter(b => b.bang?.startsWith('public.')).map(b => b.bang.slice(7))
const thieuThuTu = coTrongBan.filter(b => !THU_TU.includes(b))
if (thieuThuTu.length) { console.error('Bảng chưa có trong THU_TU:', thieuThuTu.join(', ')); process.exit(1) }

const c = new pg.Client({ connectionString: dich })
await c.connect()
await c.query('begin')
try {
  // Xoá theo thứ tự ngược (con trước), rồi chèn theo thứ tự xuôi
  for (const b of [...THU_TU].reverse().filter(b => coTrongBan.includes(b))) await c.query(`delete from public."${b}"`)
  for (const b of THU_TU.filter(b => coTrongBan.includes(b))) {
    const dong = JSON.parse(gunzipSync(readFileSync(join(thuMuc, `public.${b}.json.gz`))).toString())
    // Bỏ cột máy chủ tự tính (generated, ví dụ sach.tim) — chèn vào sẽ lỗi, máy chủ tự tính lại
    const cot = (await c.query(`select column_name from information_schema.columns
      where table_schema='public' and table_name=$1 and is_generated='NEVER' order by ordinal_position`, [b])).rows
      .map(r => `"${r.column_name}"`).join(', ')
    for (let i = 0; i < dong.length; i += 500) {
      await c.query(`insert into public."${b}" (${cot}) overriding system value
        select ${cot} from jsonb_populate_recordset(null::public."${b}", $1::jsonb)`, [JSON.stringify(dong.slice(i, i + 500))])
    }
    const [{ n }] = (await c.query(`select count(*)::int n from public."${b}"`)).rows
    console.log(`${n === dong.length ? 'OK  ' : 'LỆCH'} ${b}: ${n}/${dong.length} dòng`)
    if (n !== dong.length) throw new Error(`Lệch số dòng ở ${b}`)
  }
  // Cho cột tự tăng chạy tiếp sau số lớn nhất đã khôi phục
  const tuTang = (await c.query(`select table_name b, column_name c from information_schema.columns
    where table_schema='public' and is_identity='YES'`)).rows
  for (const { b, c: cot } of tuTang) {
    await c.query(`select setval(pg_get_serial_sequence('public."${b}"', '${cot}'), coalesce((select max("${cot}") from public."${b}"), 0) + 1, false)`)
  }
  if (THAT) { await c.query('commit'); console.log('\nĐã khôi phục xong.') }
  else { await c.query('rollback'); console.log('\nChạy thử thành công (chưa ghi gì). Thêm --that-su để ghi thật.') }
} catch (e) {
  await c.query('rollback')
  console.error('LỖI, đã huỷ toàn bộ:', e.message)
  process.exitCode = 1
} finally {
  await c.end()
}
