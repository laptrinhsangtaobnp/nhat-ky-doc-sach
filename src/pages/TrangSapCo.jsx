// Trang tạm cho các phần sẽ làm ở giai đoạn sau.
import { useAuth } from '../context/AuthContext'

export default function TrangSapCo({ tieuDe, viec }) {
  const { hoSo } = useAuth()
  return (
    <div className="space-y-3">
      <h1 className="text-2xl font-bold">{tieuDe}</h1>
      <p className="text-stone-600">Xin chào {hoSo?.ho_ten}! Phần này đang được xây dựng:</p>
      <ul className="list-disc space-y-1 pl-6 text-stone-700">
        {viec.map(v => <li key={v}>{v}</li>)}
      </ul>
    </div>
  )
}
