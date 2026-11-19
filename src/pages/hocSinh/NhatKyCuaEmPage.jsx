// Nhật ký của em: mọi lần ghi (mới nhất trước), lọc cảm xúc, tìm chữ, sửa / xoá trong 7 ngày.
import { Link } from 'react-router-dom'
import { PenLine } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import DsNhatKy from '../../components/nhatKy/DsNhatKy'

export default function NhatKyCuaEmPage() {
  const { hoSo } = useAuth()
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-auto text-2xl font-bold">Nhật ký của em</h1>
        <Link to="/nhat-ky/ghi" className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 font-semibold text-white hover:bg-emerald-700">
          <PenLine size={18} aria-hidden /> Ghi nhật ký
        </Link>
      </div>
      <DsNhatKy hsId={hoSo?.id} choSua trong="Em chưa ghi nhật ký lần nào. Bấm “Ghi nhật ký” để bắt đầu nhé!" />
    </div>
  )
}
