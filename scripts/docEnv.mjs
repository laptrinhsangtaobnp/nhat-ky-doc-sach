// Đọc biến trong tệp .env ở thư mục gốc dự án — NƠI DUY NHẤT làm việc này (scripts/ và tests/that/ đều dùng).
//   import { docEnv } from './docEnv.mjs';  const lay = docEnv();  lay('NEON_DATABASE_URL')
// Chấp nhận dấu cách quanh "=", giá trị có hoặc không có dấu nháy. Không có tệp .env → mọi biến là undefined.
import { readFileSync, existsSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

export const GOC_DU_AN = join(dirname(fileURLToPath(import.meta.url)), '..')

export function docEnv(tep = join(GOC_DU_AN, '.env')) {
  const env = existsSync(tep) ? readFileSync(tep, 'utf8') : ''
  return k => env.match(new RegExp(`^\\s*${k}\\s*=\\s*['"]?([^'"\\s]+)`, 'm'))?.[1]
}
