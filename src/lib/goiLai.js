// Gọi lại khi Neon chưa nhận thẻ đăng nhập. Neon đôi khi bỏ mất thẻ ở lần gọi đầu trên kết nối mới (nhiều nhất lúc vừa
// "thức dậy"); máy chủ khi đó báo lỗi 'chua_nhan_dien' (hàm public.toi()) thay vì trả "không có gì". Gọi lại vài lần, chờ tăng dần.
// Chỉ gọi lại đúng lỗi này — quyền vẫn do máy chủ quyết định. Dùng cho client Neon (src/lib/supabase.js) và test thật.

export const MA_CHUA_NHAN_DIEN = 'chua_nhan_dien'

export function fetchGoiLai(fetchGoc = (...a) => fetch(...a), { soLan = 5, cho = 150 } = {}) {
  return async (dau, init) => {
    for (let lan = 1; ; lan++) {
      const r = await fetchGoc(dau, init)
      if (r.ok || lan >= soLan) return r
      const chu = await r.clone().text().catch(() => '')
      if (!chu.includes(MA_CHUA_NHAN_DIEN)) return r
      await new Promise(xong => setTimeout(xong, cho * lan))
    }
  }
}
