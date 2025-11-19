# Hướng dẫn sửa lỗi 404 khi load ảnh trong Production

## Vấn đề
Khi upload file lên production VPS, file ảnh không hiển thị được và bị lỗi 404.

## Nguyên nhân
Trong Next.js standalone mode, `process.cwd()` có thể trỏ đến `.next/standalone` thay vì root directory, khiến không tìm thấy thư mục `public`.

## Giải pháp đã áp dụng

### 1. Tạo helper function `getPublicPath()`
Function này tự động tìm đúng đường dẫn đến thư mục `public` trong cả development và production.

### 2. Cải thiện API route `/api/uploads/[...path]`
- Sử dụng `getPublicFilePath()` để tìm đúng đường dẫn file
- Thêm logging chi tiết để debug
- Xử lý lỗi tốt hơn

### 3. Cải thiện upload route
- Thêm logging để biết file được lưu ở đâu
- Sử dụng helper function để đảm bảo đường dẫn đúng

## Kiểm tra trên VPS

### 1. Kiểm tra logs khi upload
```bash
# Xem logs khi upload file
docker-compose logs -f app | grep "POST /api/mockups/upload"
```

Bạn sẽ thấy:
```
[POST /api/mockups/upload] Upload directory: /path/to/public/uploads/mockups
[POST /api/mockups/upload] process.cwd(): /path/to
[POST /api/mockups/upload] Saving file to: /path/to/public/uploads/mockups/filename.jpg
[POST /api/mockups/upload] File saved successfully: /path/to/public/uploads/mockups/filename.jpg
```

### 2. Kiểm tra logs khi load ảnh
```bash
# Xem logs khi request ảnh
docker-compose logs -f app | grep "GET /api/uploads"
```

Bạn sẽ thấy:
```
[GET /api/uploads] Requested path: mockups/filename.jpg
[GET /api/uploads] Looking for file at: /path/to/public/uploads/mockups/filename.jpg
[GET /api/uploads] process.cwd(): /path/to
[GET /api/uploads] Serving file: /path/to/public/uploads/mockups/filename.jpg
```

### 3. Kiểm tra file có tồn tại không
```bash
# Vào container
docker-compose exec app sh

# Kiểm tra thư mục public
ls -la /app/public/uploads/mockups/

# Hoặc nếu file ở nơi khác
find /app -name "filename.jpg" 2>/dev/null
```

### 4. Kiểm tra quyền truy cập file
```bash
# Đảm bảo file có quyền đọc
docker-compose exec app chmod -R 644 /app/public/uploads/
docker-compose exec app chmod -R 755 /app/public/uploads/
```

## Nếu vẫn bị 404

### Kiểm tra rewrite rules
Đảm bảo `next.config.js` có rewrite rules:
```javascript
async rewrites() {
  return [
    {
      source: '/uploads/:path*',
      destination: '/api/uploads/:path*',
    },
  ]
}
```

### Kiểm tra đường dẫn trong database
```bash
# Kiểm tra imageUrl trong database
docker-compose exec postgres psql -U mockup -d mockup_studio -c "SELECT id, name, \"imageUrl\" FROM \"Mockup\" LIMIT 5;"
```

Đảm bảo `imageUrl` có format: `/uploads/mockups/filename.jpg`

### Test API route trực tiếp
```bash
# Test API route
curl -I http://localhost:3000/api/uploads/mockups/filename.jpg

# Hoặc test với rewrite
curl -I http://localhost:3000/uploads/mockups/filename.jpg
```

### Kiểm tra environment variable (nếu cần)
Nếu thư mục public ở vị trí đặc biệt, có thể set:
```env
PUBLIC_DIR=/custom/path
```

## Debug endpoint

Truy cập để xem thông tin chi tiết:
```
http://your-vps-ip:3000/api/mockups/debug
```

## Lưu ý quan trọng

1. **Trong Docker**: Đảm bảo volume mount đúng:
   ```yaml
   volumes:
     - ./public/uploads:/app/public/uploads
     - ./public/outputs:/app/public/outputs
   ```

2. **Standalone mode**: Next.js không tự động copy `public` folder vào `.next/standalone`, cần mount volume hoặc copy thủ công.

3. **Quyền truy cập**: Đảm bảo ứng dụng có quyền đọc/ghi vào thư mục `public/uploads`.

## Sau khi fix

1. Rebuild ứng dụng:
   ```bash
   git pull
   npm run build
   # Hoặc với Docker:
   docker-compose up -d --build
   ```

2. Kiểm tra lại:
   - Upload một file mới
   - Xem logs để đảm bảo file được lưu đúng
   - Thử load ảnh và xem logs để đảm bảo tìm thấy file

