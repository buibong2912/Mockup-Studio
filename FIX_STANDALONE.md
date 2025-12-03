# Fix: Standalone Mode với PM2

## Vấn đề

Khi chạy với `output: 'standalone'` trong `next.config.js`, bạn thấy cảnh báo:
```
⚠ "next start" does not work with "output: standalone" configuration. 
Use "node .next/standalone/server.js" instead.
```

Điều này khiến API không hoạt động đúng khi reload trang.

## Giải pháp nhanh

### Trên VPS, chạy các lệnh sau:

```bash
cd /var/www/Mockup-Studio

# 1. Dừng PM2 process hiện tại
pm2 stop mockup-studio
pm2 delete mockup-studio

# 2. Pull code mới (nếu chưa pull)
git pull origin main

# 3. Build lại (nếu cần)
npm run build

# 4. Chạy lại với standalone server
pm2 start ecosystem.config.js

# HOẶC nếu không có ecosystem.config.js:
pm2 start npm --name "mockup-studio" -- run start:prod

# 5. Kiểm tra
pm2 status
pm2 logs mockup-studio
```

## Kiểm tra đã fix

1. **Kiểm tra logs không còn cảnh báo:**
```bash
pm2 logs mockup-studio --lines 20
```

2. **Test API:**
```bash
curl http://localhost:3000/api/mockups
```

3. **Reload trang và kiểm tra mockups có load không**

## Lưu ý

- Sau khi fix, mỗi lần deploy chỉ cần: `pm2 restart mockup-studio`
- Không dùng `npm start` nữa, dùng `npm run start:prod` hoặc `ecosystem.config.js`

