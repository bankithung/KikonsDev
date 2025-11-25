# 🚂 Railway Deployment - Quick Start Card

## 📦 Your Application
- **Backend**: Django 5.2.8 + REST API + WebSockets
- **Frontend**: Next.js 16.0.3 + React 19
- **Database**: PostgreSQL + Redis

## 💰 Free Trial
- **$5 credit** or **30 days** (whichever comes first)
- **Estimated usage**: 7-12 days of free deployment

---

## 🚀 Deploy in 6 Steps

### 1️⃣ Push to GitHub
```powershell
cd c:\Users\Asus\Music\kikonsDev
git add .
git commit -m "Add Railway deployment"
git push origin main
```

### 2️⃣ Create Railway Account
- Go to [railway.app](https://railway.app)
- Sign in with GitHub

### 3️⃣ Create Project & Add Databases
1. **New Project** → **Deploy from GitHub repo**
2. **+ New** → **PostgreSQL**
3. **+ New** → **Redis**

### 4️⃣ Deploy Backend
1. **+ New** → **GitHub Repo** → Select repo
2. **Root Directory**: `backend`
3. **Add Variables**:
   - `SECRET_KEY`: Generate with python command below
   - `DEBUG`: `False`
   - `ALLOWED_HOSTS`: `.railway.app`
   - `CORS_ALLOWED_ORIGINS`: *(add after frontend deployed)*
4. **Generate Domain**

```powershell
# Generate SECRET_KEY
cd backend
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

### 5️⃣ Deploy Frontend
1. **+ New** → **GitHub Repo** → Select repo
2. **Root Directory**: `consultancy-dev`
3. **Add Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://your-backend.up.railway.app/api`
   - `NEXT_PUBLIC_WS_URL`: `wss://your-backend.up.railway.app/ws`
   - `NEXT_PUBLIC_APP_URL`: *(add after domain generated)*
4. **Generate Domain**

### 6️⃣ Update CORS & Test
1. Update backend `CORS_ALLOWED_ORIGINS` with frontend URL
2. Update frontend `NEXT_PUBLIC_APP_URL` with its URL
3. Create superuser via Railway shell
4. Test your app!

---

## 📋 Files Created

✅ `backend/Procfile` - Process configuration  
✅ `backend/railway.toml` - Service config  
✅ `backend/runtime.txt` - Python version  
✅ `backend/.env.railway.example` - Env template  
✅ `consultancy-dev/railway.toml` - Frontend config  
✅ `consultancy-dev/env.railway.example` - Frontend env  
✅ `RAILWAY_DEPLOYMENT.md` - **Full guide (400+ lines)**

---

## 🆘 Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Build fails | Check logs, verify line endings (LF not CRLF) |
| Database error | Ensure `DATABASE_URL` is linked |
| CORS error | Update `CORS_ALLOWED_ORIGINS` in backend |
| Frontend blank | Check `NEXT_PUBLIC_API_URL` is correct |

---

## 📚 Need More Help?

**Full Guide**: [`RAILWAY_DEPLOYMENT.md`](file:///c:/Users/Asus/Music/kikonsDev/RAILWAY_DEPLOYMENT.md)

**Alternative Free Options**:
- **Render**: [`RENDER_DEPLOYMENT.md`](file:///c:/Users/Asus/Music/kikonsDev/RENDER_DEPLOYMENT.md) (unlimited free tier with cold starts)
- **Oracle Cloud**: [`DEPLOYMENT_GUIDE.md`](file:///c:/Users/Asus/Music/kikonsDev/DEPLOYMENT_GUIDE.md) (24GB RAM, no cold starts!)

---

## ✅ Checklist

Before deploying:
- [ ] Code pushed to GitHub
- [ ] Railway account created
- [ ] SECRET_KEY generated

During deployment:
- [ ] PostgreSQL added
- [ ] Redis added
- [ ] Backend deployed with env vars
- [ ] Frontend deployed with env vars
- [ ] Domains generated
- [ ] CORS updated
- [ ] Superuser created
- [ ] App tested

---

**Ready?** Open [`RAILWAY_DEPLOYMENT.md`](file:///c:/Users/Asus/Music/kikonsDev/RAILWAY_DEPLOYMENT.md) and let's deploy! 🚀
