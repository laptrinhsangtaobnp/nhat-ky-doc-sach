// Thử quyền THẬT cho danh mục sách: người lạ / học sinh không ghi được; HS không thấy sách ẩn; nhập lại không tạo trùng.
// Thủ thư thử tạo 1 sách + 1 chủ đề mang tên "THU-QUYEN" rồi xoá ở cuối (không để lại dữ liệu).
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { DU, nguoiLa, vao } from './_chung.js'

const MA = 'THU-QUYEN-01', CD = 'Thử quyền (tự xoá)'

describe.skipIf(!DU)('quyền danh mục sách thật', () => {
  let la, hs, tt, sachId
  beforeAll(async () => {
    la = nguoiLa()
    ;[hs, tt] = await Promise.all([vao('THU_HS1'), vao('THU_THU_THU')])
    const { error } = await tt.db.rpc('nhap_danh_muc', { p_ds: [{ ma_sach: MA, ten: 'Sách thử quyền', chu_de: [CD], khoi_tu: 3, khoi_den: 4 }] })
    if (error) throw new Error('thủ thư không nhập được: ' + error.message)
    sachId = (await tt.db.from('sach').select('id').eq('ma_sach', MA).single()).data.id
  })
  afterAll(async () => {
    await tt?.db.from('sach').delete().eq('ma_sach', MA)
    await tt?.db.from('chu_de').delete().eq('ten', CD)
  })

  it('người lạ không đọc được sách, chủ đề', async () => {
    for (const bang of ['sach', 'chu_de', 'sach_chu_de']) {
      const { data } = await la.from(bang).select('*').limit(5)
      expect(data ?? [], bang).toEqual([])
    }
  })

  it('nhập lại cùng mã → cập nhật, không tạo bản trùng', async () => {
    const { data, error } = await tt.db.rpc('nhap_danh_muc', { p_ds: [{ ma_sach: MA.toLowerCase(), ten: 'Sách thử quyền (sửa)', chu_de: [CD] }] })
    expect(error).toBeNull()
    expect(data).toEqual({ them: 0, sua: 1 })
    const { data: ds } = await tt.db.from('sach').select('id, ten').eq('ma_sach', MA)
    expect(ds).toHaveLength(1)
    expect(ds[0].ten).toBe('Sách thử quyền (sửa)')
  })

  it('máy chủ chặn quá 2 chủ đề / sách', async () => {
    const { error } = await tt.db.rpc('nhap_danh_muc', { p_ds: [{ ma_sach: MA, ten: 'x', chu_de: ['A', 'B', 'C'] }] })
    expect(error).toBeTruthy()
  })

  it('học sinh thấy sách thường, KHÔNG thấy sách ẩn', async () => {
    expect((await hs.db.from('sach').select('id').eq('id', sachId)).data).toHaveLength(1)
    const { error } = await tt.db.from('sach').update({ an: true }).eq('id', sachId)
    expect(error).toBeNull()
    expect((await hs.db.from('sach').select('id').eq('id', sachId)).data).toEqual([])
    expect((await tt.db.from('sach').select('id').eq('id', sachId)).data).toHaveLength(1)
    await tt.db.from('sach').update({ an: false }).eq('id', sachId)
  })

  it('học sinh không nhập / sửa / xoá sách, chủ đề được', async () => {
    expect((await hs.db.rpc('nhap_danh_muc', { p_ds: [{ ma_sach: 'HACK1', ten: 'x' }] })).error).toBeTruthy()
    expect((await hs.db.rpc('dat_chu_de_sach', { p_sach_id: sachId, p_chu_de_ids: [] })).error).toBeTruthy()
    expect((await hs.db.from('chu_de').insert({ ten: 'Hack' }).select()).error).toBeTruthy()
    const { data: sua } = await hs.db.from('sach').update({ an: true, so_ban: 0 }).eq('id', sachId).select()
    expect(sua ?? []).toEqual([])
    await hs.db.from('sach').delete().eq('id', sachId)
    await hs.db.from('sach_chu_de').delete().eq('sach_id', sachId)
    const { data } = await tt.db.from('sach').select('an, so_ban, sach_chu_de(chu_de_id)').eq('id', sachId).single()
    expect(data).toMatchObject({ an: false, so_ban: 1 })
    expect(data.sach_chu_de).toHaveLength(1)
  })

  it('không ai sửa được cột tự tính / mã sách qua cập nhật thẳng', async () => {
    const { error } = await tt.db.from('sach').update({ ma_sach: 'DOI-MA' }).eq('id', sachId)
    expect(error).toBeTruthy()
  })
})
