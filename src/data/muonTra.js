// Mượn – trả (bảng luot_muon, Neon). Không ghi thẳng bảng: mọi thao tác qua hàm máy chủ (kiểm vai trò, tối đa, còn bản).
// Các hàm thao tác ném lỗi nếu máy chủ từ chối → giao diện dùng loiMuonTra(loi) để báo.
import { supabase } from '../lib/supabase'

export const MUON_MOI_TRANG = 50

async function goi(ham, thamSo) {
  const { data, error } = await supabase.rpc(ham, thamSo)
  if (error) throw error
  return data
}

// ── Học sinh ──
/** Đặt trước 1 cuốn; nguon 'tim_sach' | 'goi_y'. Trả { id }. */
export const datTruoc = (sachId, nguon = 'tim_sach') => goi('dat_truoc', { p_sach_id: sachId, p_nguon: nguon })
/** Huỷ đặt trước (em: khi cô chưa soạn; nhân viên: cả sách đã soạn → cất lại). */
export const huyDatTruoc = id => goi('huy_dat_truoc', { p_id: id })
/** Các lượt của em: đang dùng trước, rồi lịch sử gần nhất (≤ 50). */
export const layMuonCuaToi = () => goi('muon_cua_toi')
/** Tình trạng 1 cuốn: { so_ban, con_ban, hang_cho, em_dang_giu, toi_da, cua_em } (null nếu không xem được). */
export const layTinhTrangSach = sachId => goi('tinh_trang_sach', { p_sach_id: sachId })

// ── Thủ thư / quản trị ──
export const soanSach = id => goi('soan_sach', { p_id: id })
export const choMuon = id => goi('cho_muon', { p_id: id })
export const choMuonTrucTiep = (hocSinhId, sachId) => goi('cho_muon_truc_tiep', { p_hoc_sinh_id: hocSinhId, p_sach_id: sachId })
export const ghiTra = id => goi('ghi_tra', { p_id: id })
export const baoMat = id => goi('bao_mat', { p_id: id })
/** Danh sách theo loại can_soan | da_soan | dang_muon | lich_su, tìm theo sách / tên HS / lớp, 50 dòng / trang. */
export const layDsMuon = ({ loai, tuKhoa = '', trang = 0 }) => goi('ds_muon', { p_loai: loai, p_tu_khoa: tuKhoa, p_trang: trang })
/** Số đếm cho các thẻ: { can_soan, da_soan, qua_han_giu, dang_muon, qua_han }. */
export const demMuon = () => goi('dem_muon')
