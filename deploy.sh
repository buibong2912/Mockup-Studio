#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🚀 Starting deployment...${NC}"

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Please run this script from the project root.${NC}"
    exit 1
fi

# Pull latest code
echo -e "${YELLOW}📥 Pulling latest code...${NC}"
git pull origin main || git pull origin master || {
    echo -e "${RED}❌ Failed to pull code${NC}"
    exit 1
}

# Install dependencies
echo -e "${YELLOW}📦 Installing dependencies...${NC}"
npm install || {
    echo -e "${RED}❌ Failed to install dependencies${NC}"
    exit 1
}

# Generate Prisma Client
echo -e "${YELLOW}🔧 Generating Prisma Client...${NC}"
npm run db:generate || npx prisma generate || {
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
}

# Run migrations (optional, won't fail if no migrations)
echo -e "${YELLOW}🗄️ Running database migrations...${NC}"
npm run db:migrate 2>/dev/null || npx prisma migrate deploy 2>/dev/null || {
    echo -e "${YELLOW}⚠️ No migrations to run or migration failed (continuing anyway)${NC}"
}

# Build application
echo -e "${YELLOW}🏗️ Building application...${NC}"
npm run build || {
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
}

# Restart application
echo -e "${YELLOW}🔄 Restarting application...${NC}"

# Try PM2 first
if command -v pm2 &> /dev/null; then
    if pm2 list | grep -q "mockup-studio"; then
        pm2 restart mockup-studio && echo -e "${GREEN}✅ Restarted with PM2${NC}"
    else
        echo -e "${YELLOW}⚠️ PM2 not running mockup-studio, starting it...${NC}"
        # Check if ecosystem.config.js exists
        if [ -f "ecosystem.config.js" ]; then
            pm2 start ecosystem.config.js && echo -e "${GREEN}✅ Started with PM2 (ecosystem)${NC}"
        else
            # Use standalone server for Next.js standalone mode
            pm2 start npm --name "mockup-studio" -- run start:prod && echo -e "${GREEN}✅ Started with PM2${NC}"
        fi
    fi
# Try systemd
elif systemctl is-active --quiet mockup-studio; then
    sudo systemctl restart mockup-studio && echo -e "${GREEN}✅ Restarted with systemd${NC}"
# Try Docker
elif [ -f "docker-compose.yml" ]; then
    docker-compose down && docker-compose up -d --build && echo -e "${GREEN}✅ Restarted with Docker${NC}"
else
    echo -e "${YELLOW}⚠️ No process manager found. Please restart manually:${NC}"
    echo -e "${YELLOW}   Run: npm start${NC}"
fi

echo -e "${GREEN}✅ Deployment completed!${NC}"
echo -e "${YELLOW}📋 Check logs with:${NC}"
echo -e "   - PM2: pm2 logs mockup-studio"
echo -e "   - Systemd: sudo journalctl -u mockup-studio -f"
echo -e "   - Docker: docker-compose logs -f"

