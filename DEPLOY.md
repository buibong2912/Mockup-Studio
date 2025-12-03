# Hướng dẫn Deploy trên VPS

## Các bước deploy sau khi pull code

### 1. SSH vào VPS
```bash
ssh user@your-vps-ip
```

### 2. Di chuyển vào thư mục project
```bash
cd /var/www/Mockup-Studio
# hoặc đường dẫn project của bạn
```

### 3. Pull code mới nhất
```bash
git pull origin main
# hoặc git pull origin master (tùy branch)
```

### 4. Cài đặt dependencies (nếu có package mới)
```bash
npm install
```

### 5. Generate Prisma Client
```bash
npm run db:generate
# hoặc
npx prisma generate
```

### 6. Chạy database migrations (nếu có thay đổi schema)
```bash
npm run db:migrate
# hoặc
npx prisma migrate deploy
```

### 7. Build ứng dụng
```bash
npm run build
```

### 8. Restart ứng dụng

#### Nếu dùng PM2:

**⚠️ QUAN TRỌNG:** Với `output: 'standalone'` trong `next.config.js`, bạn PHẢI chạy standalone server, không dùng `npm start`.

**Cách 1: Dùng ecosystem.config.js (Khuyến nghị)**
```bash
# Lần đầu tiên:
pm2 start ecosystem.config.js

# Các lần sau:
pm2 restart mockup-studio
```

**Cách 2: Chạy trực tiếp standalone server**
```bash
# Lần đầu tiên:
pm2 start npm --name "mockup-studio" -- run start:prod

# Các lần sau:
pm2 restart mockup-studio
```

**Cách 3: Chạy trực tiếp (không dùng PM2)**
```bash
node .next/standalone/server.js
```

#### Nếu dùng systemd:
```bash
sudo systemctl restart mockup-studio
```

#### Nếu dùng Docker:
```bash
docker-compose down
docker-compose up -d --build
```

#### Nếu chạy trực tiếp (không dùng PM2):
```bash
# Dừng process hiện tại (Ctrl+C hoặc kill process)
# Sau đó chạy lại với standalone server:
node .next/standalone/server.js

# HOẶC dùng script:
npm run start:prod
```

**⚠️ LƯU Ý:** Không dùng `npm start` vì nó chạy `next start` không tương thích với standalone mode.

## Script deploy nhanh (One-liner)

Tạo file `deploy.sh` trong thư mục project:

```bash
#!/bin/bash

echo "🚀 Starting deployment..."

# Pull latest code
echo "📥 Pulling latest code..."
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Generate Prisma Client
echo "🔧 Generating Prisma Client..."
npm run db:generate

# Run migrations
echo "🗄️ Running database migrations..."
npm run db:migrate || echo "⚠️ No migrations to run"

# Build application
echo "🏗️ Building application..."
npm run build

# Restart application
echo "🔄 Restarting application..."
pm2 restart mockup-studio || npm start

echo "✅ Deployment completed!"
```

Cho phép chạy script:
```bash
chmod +x deploy.sh
```

Chạy deploy:
```bash
./deploy.sh
```

## Kiểm tra sau khi deploy

### 1. Kiểm tra ứng dụng chạy
```bash
# Nếu dùng PM2
pm2 status
pm2 logs mockup-studio --lines 50

# Nếu dùng systemd
sudo systemctl status mockup-studio
sudo journalctl -u mockup-studio -n 50

# Nếu dùng Docker
docker-compose ps
docker-compose logs -f --tail=50
```

### 2. Kiểm tra API health
```bash
curl http://localhost:3000/api/health
```

### 3. Kiểm tra debug endpoint
```bash
curl http://localhost:3000/api/mockups/debug
```

### 4. Kiểm tra logs
```bash
# PM2
pm2 logs mockup-studio

# Systemd
sudo journalctl -u mockup-studio -f

# Docker
docker-compose logs -f
```

## ⚠️ QUAN TRỌNG: Standalone Mode

Project này sử dụng `output: 'standalone'` trong `next.config.js`. Điều này có nghĩa:

- ✅ **ĐÚNG:** `node .next/standalone/server.js` hoặc `npm run start:prod`
- ❌ **SAI:** `npm start` hoặc `next start` (sẽ có cảnh báo và không hoạt động đúng)

Nếu bạn thấy cảnh báo:
```
⚠ "next start" does not work with "output: standalone" configuration. 
Use "node .next/standalone/server.js" instead.
```

Hãy sửa PM2 config để chạy đúng command.

## Xử lý lỗi thường gặp

### Lỗi: Prisma Client chưa được generate
```bash
npm run db:generate
npm run build
```

### Lỗi: Database connection failed
- Kiểm tra file `.env` có `DATABASE_URL` đúng không
- Kiểm tra database đang chạy
- Kiểm tra firewall/network

### Lỗi: Port đã được sử dụng
```bash
# Tìm process đang dùng port 3000
lsof -i :3000
# hoặc
netstat -tulpn | grep :3000

# Kill process
kill -9 <PID>
```

### Lỗi: Build failed
```bash
# Xóa .next và node_modules, build lại
rm -rf .next node_modules
npm install
npm run build
```

### Lỗi: "next start" does not work with "output: standalone"
**Nguyên nhân:** PM2 đang chạy `npm start` thay vì standalone server.

**Giải pháp:**
```bash
# Dừng PM2 process hiện tại
pm2 stop mockup-studio
pm2 delete mockup-studio

# Chạy lại với standalone server
pm2 start ecosystem.config.js
# HOẶC
pm2 start npm --name "mockup-studio" -- run start:prod
```

## Cấu trúc thư mục quan trọng

```
/var/www/Mockup-Studio/
├── .env                    # Environment variables (DATABASE_URL, etc.)
├── .next/                  # Build output (tự động tạo)
├── public/                 # Static files
│   ├── uploads/           # Uploaded files
│   └── outputs/           # Generated outputs
├── prisma/
│   └── schema.prisma      # Database schema
└── package.json           # Dependencies và scripts
```

## Environment Variables cần thiết

Đảm bảo file `.env` có các biến sau:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/mockup_studio?schema=public
NODE_ENV=production
```

## Lưu ý

1. **Backup database** trước khi chạy migrations:
```bash
pg_dump -U user -d mockup_studio > backup_$(date +%Y%m%d_%H%M%S).sql
```

2. **Kiểm tra disk space** trước khi build:
```bash
df -h
```

3. **Kiểm tra memory** khi build:
```bash
free -h
```

4. **Nếu build fail do memory**, tăng swap hoặc build với:
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

## Quick Reference

| Task | Command |
|------|---------|
| Pull code | `git pull origin main` |
| Install deps | `npm install` |
| Generate Prisma | `npm run db:generate` |
| Run migrations | `npm run db:migrate` |
| Build | `npm run build` |
| Start | `npm run start:prod` hoặc `pm2 start ecosystem.config.js` |
| Restart | `pm2 restart mockup-studio` |
| View logs | `pm2 logs mockup-studio` |
| Check status | `pm2 status` |

