# Quick Deploy Guide - Hướng dẫn nhanh

## Trên VPS, chạy các lệnh sau:

### 1. Cài đặt Docker (nếu chưa có)
```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
# Đăng xuất và đăng nhập lại
```

### 2. Clone và cấu hình
```bash
git clone <your-repo-url> mockup-studio
cd mockup-studio

# Tạo file .env
cat > .env << EOF
DATABASE_URL=postgresql://mockup:YOUR_PASSWORD@postgres:5432/mockup_studio?schema=public
POSTGRES_USER=mockup
POSTGRES_PASSWORD=YOUR_PASSWORD
POSTGRES_DB=mockup_studio
POSTGRES_PORT=5432
APP_PORT=3000
NODE_ENV=production
NEXT_PUBLIC_APP_URL=http://your-domain.com
EOF

# Chỉnh sửa mật khẩu trong .env
nano .env
```

### 3. Deploy
```bash
chmod +x deploy.sh
./deploy.sh
```

### 4. Cấu hình Nginx (tùy chọn)
```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/mockup-studio
```

Thêm nội dung:
```nginx
server {
    listen 80;
    server_name your-domain.com;
    client_max_body_size 50M;
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mockup-studio /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 5. SSL (tùy chọn)
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d your-domain.com
```

## Các lệnh quản lý thường dùng

```bash
# Xem logs
docker-compose logs -f

# Dừng
docker-compose down

# Khởi động lại
docker-compose restart

# Cập nhật
git pull && docker-compose up -d --build
```

Xem file `DEPLOY.md` để biết chi tiết đầy đủ.

