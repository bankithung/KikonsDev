# Railway Deployment Guide

Complete guide to deploy your Django backend on Railway.

## Prerequisites

- GitHub account with the backend repository: https://github.com/bankithung/ConsultancyDevBackend.git
- Railway account (sign up at https://railway.app)

## Step 1: Create Railway Account

1. Go to https://railway.app
2. Click "Login" and sign in with GitHub
3. Authorize Railway to access your GitHub account

## Step 2: Create New Project

1. Click "New Project" on Railway dashboard
2. Select "Deploy from GitHub repo"
3. Choose `bankithung/ConsultancyDevBackend`
4. Railway will automatically detect it's a Django app

## Step 3: Add PostgreSQL Database

1. In your project, click "New" → "Database" → "Add PostgreSQL"
2. Railway will automatically:
   - Create a PostgreSQL instance
   - Set the `DATABASE_URL` environment variable
   - Link it to your backend service

## Step 4: Add Redis

1. In your project, click "New" → "Database" → "Add Redis"
2. Railway will automatically:
   - Create a Redis instance
   - Set the `REDIS_URL` environment variable
   - Link it to your backend service

## Step 5: Configure Environment Variables

1. Click on your backend service
2. Go to "Variables" tab
3. Add the following variables:

```bash
SECRET_KEY=your-super-secret-key-generate-a-new-one-here
DEBUG=False
ALLOWED_HOSTS=*.railway.app
CORS_ALLOWED_ORIGINS=https://your-frontend-url.vercel.app
```

**Generate a secure SECRET_KEY:**
```python
# Run this in Python to generate a new secret key
import secrets
print(secrets.token_urlsafe(50))
```

**Note:** `DATABASE_URL` and `REDIS_URL` are automatically set by Railway when you add the databases.

## Step 6: Deploy

1. Railway will automatically deploy when you push to GitHub
2. First deployment will:
   - Install dependencies from `requirements.txt`
   - Run migrations via `build.sh`
   - Start the server with Gunicorn

3. Monitor deployment in "Deployments" tab
4. Check logs for any errors

## Step 7: Verify DEV_ADMIN Creation

After first deployment, the build script automatically creates the DEV_ADMIN account:

1. **Check deployment logs:**
   - Go to "Deployments" → Select latest deployment → "View Logs"
   - Look for: `✓ Successfully created DEV_ADMIN account`

2. **Default credentials:**
   ```
   Username: dev_admin
   Email: dev@consultancydev.com
   Password: DevAdmin@2025
   ```

3. **Test login:**
   - Go to `https://your-app.railway.app/admin/`
   - Login with the credentials above
   - **IMPORTANT:** Change the password immediately!

> [!WARNING]
> **Security Notice:** The default password is public in the repository. You MUST change it after first login to secure your system.

### Change DEV_ADMIN Password

**Option 1: Via Django Admin**
1. Login to `https://your-app.railway.app/admin/`
2. Go to "Users" → Find "dev_admin"
3. Click "Change password"
4. Set a strong new password

**Option 2: Via Railway CLI**
```bash
railway run python manage.py changepassword dev_admin
```

## Step 8: Verify Deployment

1. **Get your backend URL:**
   - Go to your service → "Settings" → "Domains"
   - Copy the Railway-provided domain (e.g., `your-app.railway.app`)

2. **Test endpoints:**
   - Admin panel: `https://your-app.railway.app/admin/`
   - API root: `https://your-app.railway.app/api/`

3. **Check logs:**
   - Click "Deployments" → Select latest deployment → "View Logs"
   - Look for successful migration logs
   - Verify no errors

## Step 9: Update Frontend

Update your frontend to use the Railway backend URL:

1. Update `NEXT_PUBLIC_API_URL` in your frontend `.env`:
   ```bash
   NEXT_PUBLIC_API_URL=https://your-backend.railway.app
   ```

2. Update CORS settings in Railway:
   - Add your frontend URL to `CORS_ALLOWED_ORIGINS`
   - Example: `https://your-app.vercel.app`

## Troubleshooting

### Build Fails

**Check logs:**
- Go to "Deployments" → Select failed deployment → "View Logs"
- Look for error messages

**Common issues:**
- Missing dependencies in `requirements.txt`
- Python version mismatch (check `runtime.txt`)
- Environment variables not set

### Database Connection Errors

**Verify DATABASE_URL:**
```bash
railway variables
```

**Check if PostgreSQL is running:**
- Go to PostgreSQL service → "Metrics"
- Verify it's active

### Redis Connection Errors

**Verify REDIS_URL:**
```bash
railway variables
```

**Check if Redis is running:**
- Go to Redis service → "Metrics"
- Verify it's active

### Static Files Not Loading

**Collect static files:**
```bash
railway run python manage.py collectstatic --no-input
```

**Verify WhiteNoise is configured:**
- Check `settings.py` has WhiteNoise middleware
- Check `STATIC_ROOT` is set correctly

### CORS Errors

**Update CORS settings:**
1. Add frontend URL to `CORS_ALLOWED_ORIGINS`
2. Ensure `ALLOWED_HOSTS` includes Railway domain
3. Redeploy the service

## Monitoring & Maintenance

### View Logs
```bash
railway logs
```

### Run Django Commands
```bash
railway run python manage.py <command>
```

### Database Backup
1. Go to PostgreSQL service → "Data" → "Backups"
2. Railway automatically creates backups
3. You can also export manually

### Scaling
1. Go to service → "Settings" → "Resources"
2. Adjust memory and CPU as needed
3. Note: Higher resources = higher cost

## Cost Estimation

**Free Trial:**
- $5 credit (lasts ~1-2 months for small apps)

**After Trial (Hobby Plan - $5/month):**
- Includes $5 usage credit
- PostgreSQL: ~$1-2/month
- Redis: ~$1-2/month
- Web Service: ~$1-2/month
- **Total: ~$5-10/month** (depending on usage)

## Next Steps

1. ✅ Backend deployed on Railway
2. 🔄 Deploy frontend (Vercel recommended)
3. 🔄 Update frontend to use Railway backend URL
4. 🔄 Test full application flow
5. 🔄 Set up custom domain (optional)

## Support

- Railway Docs: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/bankithung/ConsultancyDevBackend/issues
