// Nhập danh mục sách từ Excel: chọn tệp → xem trước (báo dòng lỗi, chủ đề mới) → gửi máy chủ → kết quả.
// Nhập lại cùng tệp không tạo sách trùng: máy chủ cập nhật theo mã sách.
import { useState } from 'react'
import HopThoai from '../ui/HopThoai'
import { docTepExcel } from '../../data/tepExcel'
import { nhapDanhMuc } from '../../data/sach'
import { chuKhoi, docBangSach } from '../../domain/danhMuc'

const LOI_MAY_CHU = {
  forbidden: 'Bạn không có quyền nhập danh mục',
  qua_nhieu_chu_de: 'Tổng số chủ đề vượt quá 30. Gộp bớt chủ đề trong tệp rồi nhập lại.',
  qua_2_chu_de: 'Có sách nhiều hơn 2 chủ đề',
}
const loiMayChu = e => Object.entries(LOI_MAY_CHU).find(([k]) => e?.message?.includes(k))?.[1] ?? `Lỗi máy chủ: ${e?.message ?? 'không rõ'}`

export default function NhapSachModal({ chuDe, onDong }) {
  const [buoc, setBuoc] = useState('chon')          // chon → xem → dang_nhap → xong
  const [doc, setDoc] = useState({ sach: [], loi: [], chuDeMoi: [] })
  const [tienDo, setTienDo] = useState(0)
  const [ketQua, setKetQua] = useState(null)
  const [loi, setLoi] = useState('')

  async function chonTep(e) {
    const tep = e.target.files?.[0]
    if (!tep) return
    setLoi('')
    try {
      setDoc(docBangSach(await docTepExcel(tep), chuDe.map(c => c.ten)))
      setBuoc('xem')
    } catch (err) {
      setLoi(err.message || 'Không đọc được tệp')
    }
  }

  async function nhap() {
    setBuoc('dang_nhap')
    setLoi('')
    try {
      setKetQua(await nhapDanhMuc(doc.sach, setTienDo))
      setBuoc('xong')
    } catch (err) {
      setLoi(loiMayChu(err))
      setBuoc('xem')
    }
  }

  return (
    <HopThoai tieuDe="Nhập danh mục sách từ Excel" onDong={() => onDong(buoc === 'xong')} rong="max-w-4xl">
      {loi && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700" role="alert">{loi}</p>}

      {buoc === 'chon' && <>
        <div className="space-y-1 text-sm text-stone-600">
          <p>Tệp <b>.xlsx</b>, dòng tiêu đề có cột <b>Mã sách</b> và <b>Tên sách</b>. Các cột khác (có thì app tự nhận):</p>
          <p><b>Tác giả</b> · <b>NXB - năm</b> (ví dụ “Kim Đồng, 2020”, hoặc 2 cột <b>NXB</b>, <b>Năm</b>) · <b>Chủ đề</b> (tối đa 2, cách nhau bằng dấu ;)
            · <b>Khối</b> (3 hoặc 3-4; trống = mọi khối) · <b>Số bản</b> · <b>Vị trí</b> · <b>Giới thiệu</b> · <b>Số trang</b>
            · <b>Câu hỏi</b> (câu bố mẹ hỏi con; nhiều câu thì xuống dòng trong ô hoặc cách nhau bằng dấu ;)</p>
          <p>Nhập lại tệp đã sửa không tạo sách trùng: sách cùng mã được cập nhật, ô để trống giữ nội dung cũ.</p>
          <a href="/mau-danh-muc-sach.xlsx" download className="inline-block font-semibold text-emerald-700 underline">Tải tệp mẫu (.xlsx)</a>
        </div>
        <input type="file" accept=".xlsx" onChange={chonTep} className="block w-full text-sm" aria-label="Chọn tệp Excel" />
      </>}

      {buoc === 'xem' && <>
        <p><b className="text-emerald-700">{doc.sach.length}</b> sách hợp lệ{doc.loi.length > 0 && <>, <b className="text-red-600">{doc.loi.length}</b> dòng lỗi (sẽ bỏ qua — sửa trong Excel rồi nhập lại)</>}.</p>
        {doc.loi.length > 0 && (
          <ul className="max-h-32 overflow-y-auto rounded-lg bg-red-50 p-3 text-sm text-red-700">
            {doc.loi.map(l => <li key={`${l.dong}-${l.ly_do}`}>Dòng {l.dong}: {l.ly_do}</li>)}
          </ul>
        )}
        {doc.chuDeMoi.length > 0 && (
          <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            Sẽ tạo <b>{doc.chuDeMoi.length}</b> chủ đề mới: {doc.chuDeMoi.join(', ')}. Nếu là gõ nhầm tên chủ đề đã có, hãy sửa trong Excel trước.
          </p>
        )}
        <div className="max-h-72 overflow-auto rounded-lg border border-stone-200">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-stone-50 text-left">
              <tr><th className="p-2">Dòng</th><th>Mã</th><th>Tên sách</th><th>Tác giả</th><th>Chủ đề</th><th>Khối</th><th>Bản</th></tr>
            </thead>
            <tbody>{doc.sach.slice(0, 300).map(s => (
              <tr key={s.dong} className="border-t border-stone-100">
                <td className="p-2 text-stone-400">{s.dong}</td><td className="font-mono">{s.ma_sach}</td><td>{s.ten}</td>
                <td>{s.tac_gia}</td><td>{s.chu_de.join(', ')}</td><td className="whitespace-nowrap">{chuKhoi(s.khoi_tu, s.khoi_den)}</td><td>{s.so_ban}</td>
              </tr>
            ))}</tbody>
          </table>
          {doc.sach.length > 300 && <p className="p-2 text-center text-xs text-stone-500">… và {doc.sach.length - 300} sách nữa</p>}
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={() => setBuoc('chon')} className="rounded-lg border px-3 py-2 text-sm">Chọn tệp khác</button>
          <button disabled={doc.sach.length === 0} onClick={nhap} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
            Nhập {doc.sach.length} sách
          </button>
        </div>
      </>}

      {buoc === 'dang_nhap' && <p role="status">Đang nhập… {tienDo}/{doc.sach.length}. Đừng đóng trang.</p>}

      {buoc === 'xong' && ketQua && <>
        <p>Xong: thêm mới <b className="text-emerald-700">{ketQua.them}</b> sách, cập nhật <b>{ketQua.sua}</b> sách đã có.</p>
        <button onClick={() => onDong(true)} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">Xem danh mục</button>
      </>}
    </HopThoai>
  )
}
