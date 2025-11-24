#!/bin/bash

# Frontend Deployment Script for Oracle Cloud
# This script sets up and deploys the Next.js frontend

set -e  # Exit on error

echo "========================================="
echo "  Next.js Frontend Deployment Script"
echo "========================================="

# Configuration
APP_DIR="/home/ubuntu/consultancy-frontend"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}[1/7] Installing Node.js and npm...${NC}"
# Install Node.js 20.x (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version
npm --version

echo -e "${GREEN}[2/7] Installing PM2 process manager...${NC}"
sudo npm install -g pm2

echo -e "${GREEN}[3/7] Creating application directory...${NC}"
sudo mkdir -p $APP_DIR
sudo chown $USER:$USER $APP_DIR

echo -e "${GREEN}[4/7] Installing dependencies...${NC}"
cd $APP_DIR
npm ci --production=false

echo -e "${GREEN}[5/7] Setting up environment variables...${NC}"
if [ ! -f .env.production.local ]; then
    echo -e "${YELLOW}Creating .env.production.local from template...${NC}"
    if [ -f env.production.example ]; then
        cp env.production.example .env.production.local
        echo -e "${YELLOW}⚠️  Don't forget to update .env.production.local with your actual values!${NC}"
    else
        echo -e "${YELLOW}Warning: env.production.example not found${NC}"
    fi
fi

echo -e "${GREEN}[6/7] Building Next.js application...${NC}"
npm run build

echo -e "${GREEN}[7/7] Starting application with PM2...${NC}"
# Stop existing PM2 process if running
pm2 delete consultancy-frontend 2>/dev/null || true

# Start application with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME
pm2 save

# Show status
pm2 status

echo -e "\n${GREEN}=========================================${NC}"
echo -e "${GREEN}  Frontend deployment completed!${NC}"
echo -e "${GREEN}=========================================${NC}"
echo -e "Frontend is running on http://localhost:3000"
echo -e "\nPM2 Commands:"
echo -e "  View logs: pm2 logs consultancy-frontend"
echo -e "  Restart: pm2 restart consultancy-frontend"
echo -e "  Stop: pm2 stop consultancy-frontend"
echo -e "  Status: pm2 status"
echo -e "\nNext steps:"
echo -e "1. Configure Nginx (copy nginx_frontend.conf to /etc/nginx/sites-available/)"
echo -e "2. Update .env.production.local with your actual values"
echo -e "3. Restart: pm2 restart consultancy-frontend"
