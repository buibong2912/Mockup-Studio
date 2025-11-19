# Hướng dẫn sửa lỗi Production: Mockup trả về array rỗng

## Vấn đề
Khi upload mockup trong production, dữ liệu được lưu vào database nhưng khi load lại trang thì API trả về array rỗng.

## Nguyên nhân có thể
1. **Schema Prisma không khớp với database thực tế**: Schema đang dùng PostgreSQL nhưng có thể database chưa được migrate
2. **Prisma Client chưa được generate đúng cách** trong production build
3. **Database connection issue**: Có thể có vấn đề với connection pooling hoặc DATABASE_URL

## Giải pháp

### Bước 1: Kiểm tra DATABASE_URL
Đảm bảo file `.env` trên VPS có DATABASE_URL đúng:
```env
DATABASE_URL=postgresql://user:password@localhost:5432/mockup_studio?schema=public
```

### Bước 2: Chạy migrations
Trên VPS, chạy:
```bash
cd mockup-studio
npx prisma migrate deploy
# Hoặc nếu chưa có migrations:
npx prisma db push
```

### Bước 3: Generate Prisma Client
```bash
npx prisma generate
```

### Bước 4: Rebuild ứng dụng
```bash
npm run build
# Hoặc nếu dùng Docker:
docker-compose down
docker-compose up -d --build
```

### Bước 5: Kiểm tra debug endpoint
Truy cập: `http://your-vps-ip:3000/api/mockups/debug`

Endpoint này sẽ hiển thị:
- Tổng số mockups trong database
- 10 mockups gần nhất
- Thông tin database connection
- Lỗi chi tiết nếu có

### Bước 6: Kiểm tra logs
```bash
# Nếu dùng Docker:
docker-compose logs -f app

# Hoặc nếu chạy trực tiếp:
# Xem logs của Next.js để thấy các log messages:
# - [GET /api/mockups] Found X mockups
# - [POST /api/mockups/upload] Created mockup: ...
```

## Kiểm tra nhanh

1. **Kiểm tra database connection:**
   ```bash
   curl http://your-vps-ip:3000/api/health
   ```

2. **Kiểm tra mockups API:**
   ```bash
   curl http://your-vps-ip:3000/api/mockups
   ```

3. **Kiểm tra debug endpoint:**
   ```bash
   curl http://your-vps-ip:3000/api/mockups/debug
   ```

## Nếu vẫn không hoạt động

### Kiểm tra database trực tiếp
```bash
# Nếu dùng Docker với PostgreSQL:
docker-compose exec postgres psql -U mockup -d mockup_studio -c "SELECT COUNT(*) FROM \"Mockup\";"
docker-compose exec postgres psql -U mockup -d mockup_studio -c "SELECT id, name, \"imageUrl\" FROM \"Mockup\" LIMIT 5;"
```

### Kiểm tra Prisma Client
```bash
# Trong container hoặc trên server:
node -e "const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.mockup.count().then(c => console.log('Count:', c)).catch(e => console.error('Error:', e));"
```

## Lưu ý quan trọng

1. **Schema đã được cập nhật** để sử dụng PostgreSQL và DATABASE_URL từ environment variable
2. **Build script đã được cập nhật** để tự động generate Prisma Client trước khi build
3. **Đã thêm logging** để dễ debug trong production
4. **Đã thêm debug endpoint** tại `/api/mockups/debug` để kiểm tra trạng thái

## Nếu muốn dùng SQLite cho development

Nếu bạn muốn giữ SQLite cho development, tạo file `.env.local`:
```env
DATABASE_URL="file:./dev.db"
```

Và tạm thời đổi schema về SQLite khi develop, nhưng **phải dùng PostgreSQL trong production**.

