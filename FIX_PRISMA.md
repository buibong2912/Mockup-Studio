# Fix Prisma Client Error

## Vấn đề
Prisma Client đang sử dụng schema cũ (có `mockupId` trong Job), nhưng schema mới đã bỏ field này.

## Giải pháp

### Bước 1: Dừng Dev Server
Nhấn `Ctrl+C` trong terminal đang chạy `npm run dev`

### Bước 2: Regenerate Prisma Client
Chạy lệnh sau:

```bash
npx prisma generate
```

Nếu vẫn lỗi, thử:

```bash
# Xóa cache và regenerate
rm -rf node_modules/.prisma
npx prisma generate
```

Hoặc trên Windows PowerShell:
```powershell
Remove-Item -Recurse -Force node_modules\.prisma
npx prisma generate
```

### Bước 3: Restart Dev Server
```bash
npm run dev
```

## Hoặc sử dụng script có sẵn:

```bash
npm run db:reset
```

Sau đó restart dev server.

## Lưu ý
- Database đã được reset (data cũ đã mất)
- Bạn cần upload lại mockups và designs
- Schema mới hỗ trợ multi-mockup selection


