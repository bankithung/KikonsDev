# 🚂 Railway Deployment Guide - FREE TRIAL

Deploy your Consultancy Management Application to Railway using the **$5 credit / 30 days free trial**.

![Railway Trial](C:/Users/Asus/.gemini/antigravity/brain/379a635f-f7eb-43b0-862e-e0956fa19977/uploaded_image_1764048994568.png)

---

## 📋 What You Need

- ✅ GitHub account
- ✅ Railway account (sign up at [railway.app](https://railway.app))
- ✅ Your code pushed to GitHub
- ✅ **$5 credit or 30 days** (free trial)

---

## 💰 Free Trial Details

Railway offers:
- **$5.00 in credits** OR **30 days** (whichever comes first)
- Perfect for testing and development
- Estimated usage for your app: ~$0.50-1.00/day
  - Backend service
  - Frontend service  
  - PostgreSQL database
  - Redis database

**You should get 5-10 days of free usage** with the trial credits.

---

## 🎯 Project Architecture

Your application will be deployed as:

```
┌─────────────────────────────────────┐
│         Railway Project             │
├─────────────────────────────────────┤
│                                     │
│  ┌──────────────┐  ┌─────────────┐ │
│  │   Backend    │  │  Frontend   │ │
│  │   (Django)   │◄─┤  (Next.js)  │ │
│  └──────┬───────┘  └─────────────┘ │
│         │                           │
│  ┌──────▼───────┐  ┌─────────────┐ │
│  │ PostgreSQL   │  │    Redis    │ │
│  │   Database   │  │   (Cache)   │ │
│  └──────────────┘  └─────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

---

## 📦 Part 1: Push Code to GitHub

### Step 1: Ensure All Files Are Ready

The following files have been created for you:
- ✅ `backend/Procfile` - Railway process configuration
- ✅ `backend/railway.toml` - Backend service config
- ✅ `backend/runtime.txt` - Python version
- ✅ `backend/.env.railway.example` - Environment variable template
- ✅ `consultancy-dev/railway.toml` - Frontend service config
- ✅ `consultancy-dev/env.railway.example` - Frontend env template

### Step 2: Push to GitHub

```powershell
cd c:\Users\Asus\Music\kikonsDev

# Add all files
git add .

# Commit
git commit -m "Add Railway deployment configuration"

# Push to GitHub (create repo first if you haven't)
git push origin main
```

If you don't have a GitHub repo yet:
1. Go to [github.com/new](https://github.com/new)
2. Create a new repository (e.g., `consultancy-app`)
3. Then run:
   ```powershell
   git remote add origin https://github.com/YOUR_USERNAME/consultancy-app.git
   git branch -M main
   git push -u origin main
   ```

---

## 🚀 Part 2: Deploy Backend to Railway

### Step 1: Create Railway Account

1. Go to [railway.app](https://railway.app)
2. Click **"Login"** and sign in with GitHub
3. Authorize Railway to access your repositories

### Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose your repository
4. Railway will detect your monorepo

### Step 3: Add PostgreSQL Database

1. In your Railway project, click **"+ New"**
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway will automatically:
   - Create the database
   - Generate `DATABASE_URL` environment variable
   - Link it to your services

### Step 4: Add Redis

1. Click **"+ New"** again
2. Select **"Database"** → **"Add Redis"**
3. Railway will automatically:
   - Create Redis instance
   - Generate `REDIS_URL` environment variable

### Step 5: Deploy Backend Service

1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository again
3. Configure the service:
   - **Service Name**: `backend`
   - **Root Directory**: `backend`
   - Railway will detect the `Procfile` automatically

4. Click **"Add variables"** and add these environment variables:

| Variable | Value |
|----------|-------|
| `SECRET_KEY` | *Generate using command below* |
| `DEBUG` | `False` |
| `ALLOWED_HOSTS` | `.railway.app` |
| `CORS_ALLOWED_ORIGINS` | `https://your-frontend.up.railway.app` |
| `DATABASE_URL` | *Auto-linked from PostgreSQL* |
| `REDIS_URL` | *Auto-linked from Redis* |

**Generate SECRET_KEY locally:**
```powershell
cd c:\Users\Asus\Music\kikonsDev\backend
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

5. Click **"Deploy"**

### Step 6: Get Backend URL

1. Once deployed, go to your backend service
2. Click **"Settings"** → **"Networking"**
3. Click **"Generate Domain"**
4. Copy the URL (e.g., `https://consultancy-backend.up.railway.app`)

---

## 🎨 Part 3: Deploy Frontend to Railway

### Step 1: Add Frontend Service

1. In the same Railway project, click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Configure:
   - **Service Name**: `frontend`
   - **Root Directory**: `consultancy-dev`
   - Railway will detect Next.js automatically

### Step 2: Add Environment Variables

Click **"Variables"** and add:

| Variable | Value |
|----------|-------|
| `NEXT_PUBLIC_API_URL` | `https://your-backend.up.railway.app/api` |
| `NEXT_PUBLIC_WS_URL` | `wss://your-backend.up.railway.app/ws` |
| `NEXT_PUBLIC_APP_URL` | *Will set after deployment* |

Replace `your-backend.up.railway.app` with your actual backend URL from Part 2, Step 6.

### Step 3: Deploy

1. Click **"Deploy"**
2. Wait 3-5 minutes for build

### Step 4: Generate Frontend Domain

1. Go to **"Settings"** → **"Networking"**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `https://consultancy-frontend.up.railway.app`)

### Step 5: Update Environment Variables

1. **Update Backend CORS**:
   - Go to backend service → Variables
   - Update `CORS_ALLOWED_ORIGINS` to your frontend URL
   - Add `ALLOWED_HOSTS` to include frontend domain

2. **Update Frontend URL**:
   - Go to frontend service → Variables  
   - Update `NEXT_PUBLIC_APP_URL` to your frontend URL
   - Redeploy frontend

---

## 🔧 Part 4: Create Django Superuser

### Step 1: Access Backend Shell

1. Go to your backend service in Railway
2. Click **"Deployments"** tab
3. Click on the latest successful deployment
4. Scroll down and click **"View Logs"**
5. At the bottom, there's a terminal icon - click it to open shell

### Step 2: Run Management Commands

In the Railway shell:
```bash
python manage.py createsuperuser
```

Follow the prompts to create your admin account.

---

## ✅ Part 5: Verify Deployment

### Test Backend

Open your browser and visit:
```
https://your-backend.up.railway.app/api/
```

You should see your API response!

Test admin panel:
```
https://your-backend.up.railway.app/admin/
```

### Test Frontend

Open your browser and visit:
```
https://your-frontend.up.railway.app
```

Your Next.js app should load!

### Test Full Flow

1. Sign up for a new account
2. Login  
3. Test API calls
4. Check WebSocket connections (if applicable)

---

## 📊 Monitor Your Usage

### Check Credit Usage

1. Go to Railway dashboard
2. Click your account (top right)
3. Select **"Usage"**
4. Monitor your daily spend

**Tips to save credits:**
- Delete unused deployments
- Use sleep mode for development
- Monitor database size

### View Logs

**Backend logs:**
1. Go to backend service
2. Click **"Deployments"**
3. Click latest deployment
4. View logs

**Frontend logs:**
1. Go to frontend service
2. Click **"Deployments"**  
3. Click latest deployment
4. View logs

---

## 🐛 Troubleshooting

### Build Failed

**Error: "No such file or directory: build.sh"**

Solution: Ensure line endings are LF (not CRLF):
1. Open `backend/Procfile` in VS Code
2. Bottom right, click "CRLF" → Select "LF"
3. Commit and push

**Error: "Module not found"**

Solution: Check `requirements.txt` or `package.json` for missing dependencies.

### Database Connection Error

1. Verify `DATABASE_URL` is linked in Variables
2. Check PostgreSQL service is running
3. View backend logs for specific error

### CORS Errors

1. Update `CORS_ALLOWED_ORIGINS` in backend to include frontend URL
2. Ensure no trailing slashes in URLs
3. Redeploy backend

### Frontend Can't Reach Backend

1. Verify `NEXT_PUBLIC_API_URL` is correct in frontend variables
2. Test backend URL directly in browser
3. Check backend logs for errors

---

## 🔄 Update Your Application

### Push Updates

```powershell
# Make changes to your code
git add .
git commit -m "Your update message"
git push
```

Railway will automatically detect the push and redeploy both services!

### Manual Redeploy

1. Go to service in Railway
2. Click **"Deployments"**
3. Click **"..."** on latest deployment
4. Click **"Redeploy"**

---

## 💡 Tips for Free Trial

### Maximize Your Credits

1. **Vertical Scaling**: Keep services at minimum resources
2. **Sleep Mode**: Delete/stop services when not testing
3. **Database Size**: Don't upload large files during trial
4. **Monitor Daily**: Check usage dashboard daily

### After Trial Ends

**Option 1: Upgrade to Hobby Plan** (~$5/month)
- Pay as you go
- No credit card required initially

**Option 2: Deploy to Free Alternatives**
- Render (free tier with limitations)
- Oracle Cloud (always free tier - 24GB RAM!)
- Your existing Oracle setup

**Option 3: Self-Host**
- Use your local machine
- Or a VPS provider

---

## 🎉 Success!

Your application should now be live on Railway:

- **Frontend**: `https://your-frontend.up.railway.app`
- **Backend API**: `https://your-backend.up.railway.app/api/`
- **Admin Panel**: `https://your-backend.up.railway.app/admin/`

---

## 📚 Additional Resources

- [Railway Documentation](https://docs.railway.app)
- [Railway Discord Community](https://discord.gg/railway)
- [Django Deployment Checklist](https://docs.djangoproject.com/en/stable/howto/deployment/checklist/)
- [Next.js Deployment Docs](https://nextjs.org/docs/deployment)

---

## 🆚 Comparison: Railway vs Render vs Oracle Cloud

| Feature | Railway (Trial) | Render (Free) | Oracle Cloud (Free) |
|---------|----------------|---------------|---------------------|
| **Duration** | 30 days / $5 | Unlimited | Unlimited |
| **Cold Starts** | No | Yes (15 min) | No |
| **RAM** | Scalable | 512 MB | 24 GB |
| **Database** | PostgreSQL | PostgreSQL (90 days) | Unlimited |
| **Setup Time** | 20 min | 30 min | 2 hours |
| **Best For** | Quick testing | Long-term free | Production |

**Recommendation**: 
- **Development/Testing**: Railway (easiest)
- **Long-term Free**: Oracle Cloud (most powerful)
- **Quick Prototype**: Render (simplest)

---

## 🎯 Quick Reference

### Environment Variables Checklist

**Backend:**
- [ ] SECRET_KEY
- [ ] DEBUG=False
- [ ] ALLOWED_HOSTS
- [ ] CORS_ALLOWED_ORIGINS
- [ ] DATABASE_URL (auto)
- [ ] REDIS_URL (auto)

**Frontend:**
- [ ] NEXT_PUBLIC_API_URL
- [ ] NEXT_PUBLIC_WS_URL
- [ ] NEXT_PUBLIC_APP_URL

### Deployment Checklist

- [ ] Code pushed to GitHub
- [ ] PostgreSQL added
- [ ] Redis added
- [ ] Backend deployed with env vars
- [ ] Frontend deployed with env vars
- [ ] Domains generated
- [ ] CORS configured
- [ ] Superuser created
- [ ] Application tested

---

**Need Help?** Check the troubleshooting section or refer to your existing Render deployment docs at [`RENDER_DEPLOYMENT.md`](file:///c:/Users/Asus/Music/kikonsDev/RENDER_DEPLOYMENT.md) for alternative free hosting.
