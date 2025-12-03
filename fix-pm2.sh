#!/bin/bash

# Script để fix PM2 chạy standalone server đúng cách

echo "🔧 Fixing PM2 configuration for standalone mode..."

# Dừng và xóa process cũ
echo "📛 Stopping old PM2 process..."
pm2 stop mockup-studio 2>/dev/null
pm2 delete mockup-studio 2>/dev/null

# Kiểm tra xem có ecosystem.config.js không
if [ -f "ecosystem.config.js" ]; then
    echo "✅ Found ecosystem.config.js, using it..."
    pm2 start ecosystem.config.js
    echo "✅ Started with ecosystem.config.js"
else
    echo "⚠️ ecosystem.config.js not found, using direct command..."
    # Chạy với standalone server
    pm2 start npm --name "mockup-studio" -- run start:prod
    echo "✅ Started with standalone server command"
fi

# Kiểm tra status
echo ""
echo "📊 PM2 Status:"
pm2 status

echo ""
echo "✅ Done! Check logs with: pm2 logs mockup-studio"
echo "🔍 Verify no more warnings about 'next start'"

