// Danh mục hàm phải đủ: mọi hàm xuất ra ở src/domain, src/data, src/lib, scripts và mọi hàm máy chủ (sql/) đều có tên trong
// docs/ARCHITECTURE.md → trước khi viết hàm mới, tra danh mục là biết đã có chưa (tránh viết 2 hàm cùng việc).
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'fs'
import { join } from 'path'

const goc = join(import.meta.dirname, '..')
const doc = readFileSync(join(goc, 'docs/ARCHITECTURE.md'), 'utf8')
const tep = (thuMuc, duoi) => readdirSync(join(goc, thuMuc)).filter(t => duoi.test(t) && !t.includes('.test.')).map(t => join(thuMuc, t))
const coTrongDoc = ten => new RegExp(`\\b${ten}\\b`).test(doc)

describe('danh mục hàm trong docs/ARCHITECTURE.md', () => {
  it('mọi hàm / hằng xuất ra ở domain, data, lib, scripts', () => {
    const thieu = []
    for (const t of [...tep('src/domain', /\.js$/), ...tep('src/data', /\.js$/), ...tep('src/lib', /\.js$/), ...tep('scripts', /\.mjs$/)]) {
      const nd = readFileSync(join(goc, t), 'utf8')
      for (const [, ten] of nd.matchAll(/^export\s+(?:async\s+)?(?:function|const|let)\s+([A-Za-z_$][\w$]*)/gm)) {
        if (!coTrongDoc(ten)) thieu.push(`${t}: ${ten}`)
      }
    }
    expect(thieu, 'Thêm các tên này vào "Danh mục hàm"').toEqual([])
  })

  it('mọi hàm máy chủ trong sql/', () => {
    const ten = new Set()
    for (const t of tep('sql', /\.sql$/)) {
      for (const [, h] of readFileSync(join(goc, t), 'utf8').matchAll(/create or replace function public\.(\w+)/gi)) ten.add(h)
    }
    expect([...ten].filter(h => !coTrongDoc(h)), 'Thêm các hàm máy chủ này vào ARCHITECTURE.md').toEqual([])
  })
})
