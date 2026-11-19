// Service worker tối thiểu để điện thoại cho "Thêm vào màn hình chính".
// KHÔNG lưu đệm gì (dữ liệu ở máy chủ, máy bố mẹ có thể dùng chung) — mọi yêu cầu đi thẳng ra mạng.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()))
self.addEventListener('fetch', () => {})
