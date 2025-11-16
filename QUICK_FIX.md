# Quick Fix - Prisma Client Error

## Vấn đề
Lỗi: `Argument 'mockup' is missing` - Prisma Client đang dùng schema cũ.

## Giải pháp nhanh:

### 1. Dừng Dev Server
Nhấn `Ctrl+C` trong terminal đang chạy `npm run dev`

### 2. Chạy lệnh này:
```bash
npx prisma generate
```

### 3. Restart Dev Server
```bash
npm run dev
```

## Nếu vẫn lỗi:

Xóa cache Prisma và regenerate:

**Windows PowerShell:**
```powershell
Remove-Item -Recurse -Force node_modules\.prisma -ErrorAction SilentlyContinue
npx prisma generate
```

**Hoặc dùng script:**
```bash
npm run db:reset
```

Sau đó restart dev server.

---

**Lưu ý:** Database đã được reset, bạn cần upload lại mockups và designs.


