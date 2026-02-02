#!/bin/bash

# ==============================================================================
# Full Stack Deployment Script for AWS Ubuntu (Django + Next.js)
# ==============================================================================
# usage: ./deploy_fullstack.sh
# Run this script from the root of your cloned repository (e.g., ~/kikonsDev)

set -e  # Exit on error

# Configuration
REPO_DIR=$(pwd)
BACKEND_SRC="$REPO_DIR/backend"
FRONTEND_SRC="$REPO_DIR/consultancy-dev"

BACKEND_DEST="/home/ubuntu/consultancy-backend"
FRONTEND_DEST="/home/ubuntu/consultancy-frontend"

VENV_DIR="$BACKEND_DEST/venv"
LOG_DIR="/var/log/gunicorn"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}Starting Full Stack Deployment...${NC}"

# ==============================================================================
# 1. System Setup
# ==============================================================================
echo -e "\n${GREEN}[1/6] Updating System & Installing Dependencies...${NC}"
sudo apt-get update
sudo apt-get upgrade -y
sudo apt-get install -y python3-pip python3-venv python3-dev \
    build-essential libpq-dev nginx redis-server \
    supervisor git curl acl rsync

# Install Node.js 20.x
if ! command -v node &> /dev/null; then
    echo "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
sudo npm install -g pm2

# ==============================================================================
# 2. Database (PostgreSQL) - Optional Setup on same server
# ==============================================================================
# Note: If you use RDS, skip this. If you want local DB:
# sudo apt-get install -y postgresql postgresql-contrib
# ... setup user/db ...

# ==============================================================================
# 3. Backend Deployment (Django)
# ==============================================================================
echo -e "\n${GREEN}[2/6] Deploying Backend...${NC}"

# Create Directory & Copy Files
sudo mkdir -p $BACKEND_DEST
sudo chown -R $USER:$USER $BACKEND_DEST
echo "Copying backend files..."
rsync -av --exclude 'venv' --exclude '__pycache__' --exclude 'db.sqlite3' $BACKEND_SRC/ $BACKEND_DEST/

# Virtual Env & Requirements
cd $BACKEND_DEST
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi
source venv/bin/activate
echo "Installing python requirements..."
pip install --upgrade pip
pip install -r requirements.txt
pip install daphne gunicorn psycopg2-binary

# Env File
if [ ! -f .env ]; then
    echo -e "${YELLOW}Creating .env file from template...${NC}"
    # Try to find a template or use production example
    if [ -f .env.production ]; then
        cp .env.production .env
    elif [ -f .env.example ]; then
        cp .env.example .env
    else
        echo "Creating basic .env"
        touch .env
    fi
    echo -e "${RED}IMPORTANT: Please edit $BACKEND_DEST/.env with your secrets!${NC}"
fi

# Migrations & Static
echo "Running migrations..."
python manage.py migrate
echo "Collecting static files..."
python manage.py collectstatic --noinput

# Systemd: Gunicorn
echo "Setting up Systemd for Gunicorn..."
sudo bash -c "cat > /etc/systemd/system/gunicorn.service <<EOF
[Unit]
Description=gunicorn daemon
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=$BACKEND_DEST
Environment=\"PATH=$VENV_DIR/bin\"
ExecStart=$VENV_DIR/bin/gunicorn config.wsgi:application --workers 3 --bind 127.0.0.1:8000
Restart=always

[Install]
WantedBy=multi-user.target
EOF"

# Systemd: Daphne
echo "Setting up Systemd for Daphne..."
sudo bash -c "cat > /etc/systemd/system/daphne.service <<EOF
[Unit]
Description=daphne daemon
After=network.target

[Service]
User=$USER
Group=www-data
WorkingDirectory=$BACKEND_DEST
Environment=\"PATH=$VENV_DIR/bin\"
ExecStart=$VENV_DIR/bin/daphne -b 127.0.0.1 -p 8001 config.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
EOF"

# ==============================================================================
# 4. Frontend Deployment (Next.js)
# ==============================================================================
echo -e "\n${GREEN}[3/6] Deploying Frontend...${NC}"

sudo mkdir -p $FRONTEND_DEST
sudo chown -R $USER:$USER $FRONTEND_DEST
echo "Copying frontend files..."
rsync -av --exclude 'node_modules' --exclude '.next' $FRONTEND_SRC/ $FRONTEND_DEST/

cd $FRONTEND_DEST
echo "Installing node dependencies..."
npm ci --legacy-peer-deps

# Env File
if [ ! -f .env.production.local ]; then
    echo -e "${YELLOW}Creating .env.production.local...${NC}"
    if [ -f env.production.example ]; then
        cp env.production.example .env.production.local
    else
        touch .env.production.local
    fi
fi

echo "Building Next.js app..."
npm run build

echo "Starting with PM2..."
pm2 delete consultancy-frontend 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
# Ensure PM2 starts on boot (might need user interaction on first run, but typically safe)
# sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true

# ==============================================================================
# 5. Nginx Setup
# ==============================================================================
echo -e "\n${GREEN}[4/6] Configuring Nginx...${NC}"

# Check for nginx_fullstack.conf in repo root
if [ -f "$REPO_DIR/nginx_fullstack.conf" ]; then
    sudo cp "$REPO_DIR/nginx_fullstack.conf" /etc/nginx/sites-available/consultancy-fullstack
else
    echo -e "${RED}Error: nginx_fullstack.conf not found in $REPO_DIR${NC}"
    exit 1
fi

# Enable site
sudo ln -sf /etc/nginx/sites-available/consultancy-fullstack /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

echo "Testing Nginx config..."
sudo nginx -t

# ==============================================================================
# 6. Final Restart
# ==============================================================================
echo -e "\n${GREEN}[5/6] Restarting Services...${NC}"

sudo systemctl daemon-reload
sudo systemctl enable gunicorn daphne
sudo systemctl restart gunicorn daphne
sudo systemctl restart nginx
sudo systemctl enable redis-server
sudo systemctl start redis-server

echo -e "\n${GREEN}==============================================${NC}"
echo -e "${GREEN}  DEPLOYMENT COMPLETE!  ${NC}"
echo -e "${GREEN}==============================================${NC}"
echo -e "1. Edit Backend Env:  nano $BACKEND_DEST/.env"
echo -e "   - Update DATABASE_URL, SECRET_KEY, ALLOWED_HOSTS"
echo -e "2. Edit Frontend Env: nano $FRONTEND_DEST/.env.production.local"
echo -e "   - Update NEXT_PUBLIC_API_URL to http://YOUR_EC_IP/api"
echo -e "3. Restart services if you changed envs:"
echo -e "   sudo systemctl restart gunicorn daphne"
echo -e "   pm2 restart consultancy-frontend"
echo -e "=============================================="
