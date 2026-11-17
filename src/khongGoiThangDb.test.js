// Giữ quy tắc 3 tầng: CHỈ src/data/ (và src/lib/) được dùng supabase.from / rpc / auth / functions.
// Trang, thành phần, hook gọi hàm có tên trong src/data/. Viết thêm chỗ gọi thẳng → kiểm tra này đỏ, kèm tên tệp + dòng.
import { describe, it, expect } from 'vitest'
import { readdirSync, readFileSync, statSync } from 'fs'
import { join, relative } from 'path'

const moiTep = d => readdirSync(d).flatMap(t => (statSync(join(d, t)).isDirectory() ? moiTep(join(d, t)) : [join(d, t)]))

describe('3 tầng', () => {
  it('ngoài src/data và src/lib không ai dùng supabase trực tiếp', () => {
    const viPham = []
    for (const p of moiTep('src')) {
      const r = relative('src', p).replace(/\\/g, '/')
      if (!/\.(js|jsx)$/.test(r) || /\.test\.jsx?$/.test(r) || r.startsWith('data/') || r.startsWith('lib/')) continue
      readFileSync(p, 'utf8').split('\n').forEach((l, i) => {
        if (/lib\/supabase/.test(l) || /\bsupabase\s*\./.test(l)) viPham.push(`${r}:${i + 1}`)
      })
    }
    expect(viPham).toEqual([])
  })

  it('src/domain không gọi mạng, không dùng giao diện', () => {
    const viPham = []
    for (const p of moiTep('src/domain')) {
      if (/\.test\.js$/.test(p)) continue
      const s = readFileSync(p, 'utf8')
      if (/from ['"](react|\.\.\/data|\.\.\/lib)|fetch\(/.test(s)) viPham.push(p)
    }
    expect(viPham).toEqual([])
  })

  it('không tệp giao diện nào quá 400 dòng', () => {
    const dai = moiTep('src')
      .filter(p => /\.(js|jsx)$/.test(p) && !/\.test\./.test(p))
      .map(p => [p, readFileSync(p, 'utf8').split('\n').length])
      .filter(([, n]) => n > 400)
    expect(dai).toEqual([])
  })
})
