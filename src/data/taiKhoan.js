// Tài khoản đăng nhập: gọi Edge Function ở Supabase (máy chủ kiểm người gọi là nhân viên).
import { supabase } from '../lib/supabase'

async function goi(ten, body) {
  const { data, error } = await supabase.functions.invoke(ten, { body })
  if (error) {
    let thongBao = error.message
    try { thongBao = (await error.context.json()).error || thongBao } catch { /* giữ thông báo gốc */ }
    throw new Error(thongBao)
  }
  return data
}

/** Tạo nhiều tài khoản, chia mỗi lần 40 người; trả mảng { ten_dang_nhap, ok, loi }. moiLan(daXong) báo tiến độ. */
export async function taoTaiKhoan(ds, moiLan = () => {}) {
  const kq = []
  for (let i = 0; i < ds.length; i += 40) {
    const { kq: phan } = await goi('tao-tai-khoan', { ds: ds.slice(i, i + 40) })
    kq.push(...phan)
    moiLan(kq.length)
  }
  return kq
}

/** Đặt lại mật khẩu cho 1 tài khoản. */
export const datLaiMatKhau = (id, mat_khau) => goi('sua-tai-khoan', { id, mat_khau })

/** Xoá hẳn tài khoản (chỉ quản trị). */
export const xoaTaiKhoan = id => goi('xoa-tai-khoan', { id })
