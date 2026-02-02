# ☁️ AWS Ubuntu Full Stack Deployment Guide

This guide explains how to host your Django Backend and Next.js Frontend on a single AWS EC2 Ubuntu server using Termius.

## ✅ Prerequisites

1.  **AWS Account**: [console.aws.amazon.com](https://console.aws.amazon.com)
2.  **Termius**: Installed on your computer.
3.  **GitHub Repo**: Ensure your code (including the new `deploy_fullstack.sh` and `nginx_fullstack.conf` files) is pushed to GitHub.

---

## 🚀 Step 1: Launch EC2 Instance

1.  Log in to **AWS Console** > **EC2** > **Launch Instance**.
2.  **Name**: `consultancy-server`.
3.  **OS Image**: **Ubuntu Server 24.04 LTS** (Free tier eligible).
4.  **Instance Type**: `t2.medium` (Recommended for Next.js build) or `t2.micro` (Free tier, but might run out of RAM during build. If using micro, you may need swap memory).
    > **Tip**: If sticking to Free Tier (`t2.micro`), you MUST enable Swap Memory (instructions included in script usually, but if build fails, upgrade to medium).
5.  **Key Pair**: Create new (e.g., `consultancy-key`). Download the `.pem` file.
6.  **Network Settings**:
    *   **Allow SSH traffic** from Anywhere (0.0.0.0/0).
    *   **Allow HTTP traffic** from the internet.
    *   **Allow HTTPS traffic** from the internet.
7.  Launch Instance.

---

## 🔑 Step 2: Connect via Termius

1.  Open **Termius**.
2.  Click **New Host**.
3.  **Address**: Your EC2 Public IP (e.g., `54.123.45.67`).
4.  **Username**: `ubuntu`.
5.  **Key**: Click "Keys" -> "Import Key" -> Select the `.pem` file you downloaded from AWS.
6.  Double-click the host to connect.

---

## ⚙️ Step 3: Deploy

Once connected to the terminal in Termius, run the following commands:

### 1. Clone Your Repository
Replace the URL with your actual GitHub repository URL.
```bash
git clone https://github.com/YOUR_USERNAME/kikonsDev.git app
cd app
```

### 2. Run the Deployment Script
I have prepared an automated script that handles everything (Node, Python, Nginx, Database, PM2).
```bash
# Make script executable
chmod +x deploy_fullstack.sh

# Run it
./deploy_fullstack.sh
```

> **Note**: This process takes 5-10 minutes.

---

## 📝 Step 4: Configure Environment Variables

The script created `.env` files for you, but they have dummy values. You must update them.

### 1. Backend Configuration
```bash
nano /home/ubuntu/consultancy-backend/.env
```
*   Set `DEBUG=False`
*   Set `ALLOWED_HOSTS=YOUR_EC2_IP`
*   Set `DATABASE_URL` (if using RDS) or ensure local SQLite/Postgres settings are correct.
*   *Save: Ctrl+O, Enter, Ctrl+X*

### 2. Frontend Configuration
```bash
nano /home/ubuntu/consultancy-frontend/.env.production.local
```
*   Set `NEXT_PUBLIC_API_URL=http://YOUR_EC2_IP/api`
*   Set `NEXT_PUBLIC_WS_URL=ws://YOUR_EC2_IP/ws`
*   *Save: Ctrl+O, Enter, Ctrl+X*

### 3. Apply Changes
Restart services to apply new variables:
```bash
sudo systemctl restart gunicorn daphne
pm2 restart consultancy-frontend
```

---

## 🌐 Step 5: Verify

Open your browser and visit: `http://YOUR_EC2_IP`

*   **Frontend**: Should load the homepage.
*   **Backend API**: `http://YOUR_EC2_IP/api/`
*   **Admin**: `http://YOUR_EC2_IP/admin/`

---

## 🔧 Troubleshooting

*   **Build Fails (RAM issues)**: If `npm run build` crashes on t2.micro:
    ```bash
    # Create 2GB Swap file
    sudo fallocate -l 2G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
    ```
    Then try running the script or build again.
*   **Permissions**: Ensure `chmod +x deploy_fullstack.sh` was run.
*   **Logs**:
    *   Backend: `sudo journalctl -u gunicorn -n 50`
    *   Frontend: `pm2 logs consultancy-frontend`
    *   Nginx: `sudo tail -f /var/log/nginx/error.log`
