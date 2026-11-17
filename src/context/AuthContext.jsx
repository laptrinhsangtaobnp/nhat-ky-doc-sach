// Ai đang đăng nhập + hồ sơ (vai trò, lớp). Chỉ để giao diện hiển thị đúng — quyền thật do máy chủ kiểm.
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import toast from 'react-hot-toast'
import { dangNhap, dangXuat, layPhien, theoDoiDangNhap } from '../data/dangNhap'
import { layHoSo } from '../data/hoSo'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [hoSo, setHoSo] = useState(null)
  const [dangTai, setDangTai] = useState(true)
  const daVao = useRef(false)          // đã vào xong 1 lần → lần làm mới thẻ sau không hiện màn chờ

  useEffect(() => {
    async function napHoSo(userId) {
      let kq = { data: null, error: null }
      for (let lan = 0; lan < 3; lan++) {               // Neon vừa thức dậy có thể lỗi tạm → thử lại
        kq = await layHoSo(userId)
        if (!kq.error) break
        await new Promise(r => setTimeout(r, 1200 * (lan + 1)))
      }
      if (kq.error || !kq.data || kq.data.hoat_dong === false) {
        daVao.current = false
        await dangXuat()
        setHoSo(null)
        if (kq.error) toast.error('Máy chủ đang bận, chờ ít phút rồi đăng nhập lại nhé.')
        else toast.error('Tài khoản chưa sẵn sàng hoặc đã bị khoá. Hãy hỏi thầy cô thư viện.')
      } else {
        daVao.current = true
        setHoSo(kq.data)
      }
      setDangTai(false)
    }

    layPhien()
      .then(p => (p?.user ? napHoSo(p.user.id) : setDangTai(false)))
      .catch(() => setDangTai(false))

    return theoDoiDangNhap((suKien, phien) => {
      if (!phien?.user) { daVao.current = false; setHoSo(null); setDangTai(false); return }
      if (suKien === 'SIGNED_IN' && !daVao.current) { setDangTai(true); napHoSo(phien.user.id) }
    })
  }, [])

  return (
    <AuthContext.Provider value={{ hoSo, dangTai, dangNhap, dangXuat }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
