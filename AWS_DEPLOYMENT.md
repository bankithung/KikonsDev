# ☁️ AWS Free Tier Deployment Guide

This guide details how to host your full-stack application on AWS **for free** (using the 12-month Free Tier for new accounts).

## 🏗️ Architecture Overview

To maximize the Free Tier limits and ensure performance:

*   **Frontend (Next.js)**: **AWS Amplify** (Fully managed, free tier eligible).
*   **Backend (Django)**: **Amazon EC2** (t2.micro or t3.micro instance).
*   **Database (PostgreSQL)**: **Amazon RDS** (db.t3.micro or db.t4g.micro).
*   **Cache (Redis)**: **Install on EC2** (Running on the same EC2 instance is free and sufficient for this scale; Amazon ElastiCache is also free for 12 months but adds complexity).

---

## ✅ Prerequisites

1.  **AWS Account**: [Sign up here](https://aws.amazon.com/free/). (Requires a credit card for identity verification, but you won't be charged if you stay within limits).
2.  **GitHub Repository**: Your code must be pushed to GitHub.
3.  **SSH Client**: Terminal (Mac/Linux) or PowerShell/PuTTY (Windows).

---

## 📦 Step 1: Database (Amazon RDS)

1.  Log in to the **AWS Console** and search for **RDS**.
2.  Click **Create database**.
3.  **Choose a database creation method**: Standard create.
4.  **Engine options**: PostgreSQL.
5.  **Templates**: Select **Free tier**.
6.  **Settings**:
    *   **DB instance identifier**: `consultancy-db`
    *   **Master username**: `postgres`
    *   **Master password**: Create a strong password (save this!).
7.  **Instance configuration**: `db.t3.micro` or `db.t4g.micro`.
8.  **Storage**: 20 GiB (General Purpose SSD gp2 or gp3).
9.  **Connectivity**:
    *   **Public access**: **Yes** (Easier for initial setup/debugging, can restrict later) OR **No** (More secure, but requires EC2 to be in the same VPC/Security Group). *Recommendation for beginners: Yes, but restrict security group to your IP and the EC2 instance IP.*
    *   **VPC Security Group**: Create new (e.g., `rds-sg`).
10. Click **Create database**.
11. Once created, note the **Endpoint** (e.g., `consultancy-db.xxxx.us-east-1.rds.amazonaws.com`).

---

## 🖥️ Step 2: Backend (Amazon EC2)

### 2.1 Launch Instance
1.  Search for **EC2** in AWS Console.
2.  Click **Launch Instance**.
3.  **Name**: `consultancy-backend`.
4.  **OS Image**: **Ubuntu Server 24.04 LTS** (Free tier eligible).
5.  **Instance Type**: **t2.micro** or **t3.micro** (Check which is labeled "Free tier eligible" in your region).
6.  **Key pair**: Create a new key pair (`consultancy-key`), download the `.pem` file.
7.  **Network settings**:
    *   Allow SSH traffic from **Anywhere** (0.0.0.0/0) or **My IP**.
    *   Allow HTTP traffic from the internet.
    *   Allow HTTPS traffic from the internet.
8.  Click **Launch instance**.

### 2.2 Connect to Instance
1.  Open your terminal/PowerShell.
2.  Move the `.pem` key to a safe folder.
3.  Connect (replace path and IP):
    ```bash
    ssh -i "path/to/consultancy-key.pem" ubuntu@YOUR_EC2_PUBLIC_IP
    ```

### 2.3 Setup Server (Run these commands on EC2)
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python, Pip, Redis, Nginx, Git
sudo apt install python3-pip python3-venv redis-server nginx git -y

# Start Redis
sudo systemctl enable redis-server
sudo systemctl start redis-server

# Clone your repository
git clone https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPO_NAME.git project
cd project/backend
```

### 2.4 Configure Backend
```bash
# Create Virtual Environment
python3 -m venv venv
source venv/bin/activate

# Install Dependencies
pip install -r requirements.txt
pip install daphne  # Required for WebSockets/ASGI

# Create .env file
nano .env
```
**Paste the following into `.env` (adjust values):**
```env
DEBUG=False
SECRET_KEY=your_generated_secret_key
DATABASE_URL=postgres://postgres:YOUR_DB_PASSWORD@YOUR_RDS_ENDPOINT:5432/postgres
REDIS_URL=redis://127.0.0.1:6379/1
ALLOWED_HOSTS=YOUR_EC2_PUBLIC_IP,localhost
CORS_ALLOWED_ORIGINS=http://localhost:3000
```
*Save: Ctrl+O, Enter, Ctrl+X*

### 2.5 Run Migrations
```bash
python manage.py migrate
python manage.py collectstatic --noinput
python manage.py createsuperuser
```

### 2.6 Setup Systemd (Keep App Running)
Create a service file:
```bash
sudo nano /etc/systemd/system/django.service
```
**Content:**
```ini
[Unit]
Description=Django Daphne Service
After=network.target

[Service]
User=ubuntu
Group=www-data
WorkingDirectory=/home/ubuntu/project/backend
ExecStart=/home/ubuntu/project/backend/venv/bin/daphne -b 0.0.0.0 -p 8000 config.asgi:application
Restart=always

[Install]
WantedBy=multi-user.target
```
*Save and Exit.*

Start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl start django
sudo systemctl enable django
```

### 2.7 Configure Nginx (Reverse Proxy)
```bash
sudo nano /etc/nginx/sites-available/consultancy
```
**Content:**
```nginx
server {
    listen 80;
    server_name YOUR_EC2_PUBLIC_IP;

    location /static/ {
        root /home/ubuntu/project/backend;
    }

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```
*Save and Exit.*

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/consultancy /etc/nginx/sites-enabled
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

**Your Backend is now live at `http://YOUR_EC2_PUBLIC_IP`!**

---

## 🚀 Step 3: Frontend (AWS Amplify)

1.  Search for **AWS Amplify** in Console.
2.  Click **Create new app** -> **Gen 1** (or Gen 2, both work, Gen 1 is simpler for UI).
3.  Select **GitHub**.
4.  Authorize AWS to access your repo.
5.  Select Repository and Branch (`main`).
6.  **Build settings**:
    *   Amplify usually auto-detects Next.js.
    *   Ensure `baseDirectory` is set to `consultancy-dev` (since it's a monorepo).
    *   **Edit** the build settings (yaml):
        ```yaml
        version: 1
        applications:
          - frontend:
              phases:
                preBuild:
                  commands:
                    - npm ci
                build:
                  commands:
                    - npm run build
              artifacts:
                baseDirectory: .next
                files:
                  - '**/*'
              cache:
                paths:
                  - node_modules/**/*
            appRoot: consultancy-dev
        ```
7.  **Environment Variables**:
    *   `NEXT_PUBLIC_API_URL`: `http://YOUR_EC2_PUBLIC_IP/api` (Note: If using HTTP backend, frontend might complain about Mixed Content if Amplify uses HTTPS. You may need to set up SSL for EC2 using Certbot/Let's Encrypt - see below).
    *   `NEXT_PUBLIC_WS_URL`: `ws://YOUR_EC2_PUBLIC_IP/ws`
8.  Click **Save and Deploy**.

---

## 🔒 Step 4: SSL (Important)

Amplify provides HTTPS by default. Your EC2 backend is currently HTTP. Browsers block HTTP requests from HTTPS sites ("Mixed Content").

**To fix this on EC2 (Free):**
1.  Get a domain name (or use a free one like DuckDNS, or just buy a cheap .com).
2.  Point the domain's A record to your EC2 IP.
3.  On EC2, install Certbot:
    ```bash
    sudo apt install certbot python3-certbot-nginx
    ```
4.  Run Certbot:
    ```bash
    sudo certbot --nginx -d yourdomain.com
    ```
5.  Update Frontend Env Vars to use `https://yourdomain.com/api`.

---

## 💰 Cost Analysis (Free Tier)

| Service | Free Tier Limit | Your Usage (Est.) | Status |
| :--- | :--- | :--- | :--- |
| **EC2** | 750 hrs/mo | 744 hrs (1 instance) | ✅ Free |
| **RDS** | 750 hrs/mo | 744 hrs (1 DB) | ✅ Free |
| **Amplify** | 15GB served/mo | < 1GB | ✅ Free |
| **Data Transfer**| 100GB/mo | < 1GB | ✅ Free |
| **Redis** | (On EC2) | 0 (Included in EC2) | ✅ Free |

**Total Cost: $0.00 / month** (for first 12 months).
