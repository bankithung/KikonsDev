# Django Consultancy Backend

Django REST API backend for consultancy management system with student registration, enrollment, and document management.

## Features

- 🔐 JWT Authentication
- 👥 User Management (Admin, Employee roles)
- 📝 Enquiry & Registration Management
- 🎓 Enrollment & Course Management
- 📄 Document Management & Transfer
- 💰 Payment Tracking
- 🔔 Real-time Notifications (WebSocket)
- 📊 Approval Workflow System

## User Roles & Hierarchy

The system has a hierarchical user structure:

1. **DEV_ADMIN** (System Administrator)
   - Highest level access
   - Not tied to any company
   - Full system permissions
   - Created automatically during deployment

2. **COMPANY_ADMIN** (Company Administrator)
   - Manages a specific company
   - Can create managers and employees
   - Full access to company data

3. **MANAGER** (Company Manager)
   - Manages company operations
   - Can approve/reject requests
   - Limited administrative access

4. **EMPLOYEE** (Company Employee)
   - Basic operational access
   - Creates enquiries, registrations
   - Submits approval requests

### Default DEV_ADMIN Credentials

After deployment, a DEV_ADMIN account is automatically created:

- **Username:** `dev_admin`
- **Email:** `dev@consultancydev.com`
- **Password:** `DevAdmin@2025`

> [!WARNING]
> **IMPORTANT:** Change the default password immediately after first login!

## Tech Stack

- **Framework**: Django 5.2.8
- **API**: Django REST Framework
- **Database**: PostgreSQL
- **Cache/WebSocket**: Redis (Django Channels)
- **Authentication**: JWT (Simple JWT)
- **Server**: Gunicorn + Daphne

## Local Development

### Prerequisites

- Python 3.11+
- PostgreSQL
- Redis

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/bankithung/ConsultancyDevBackend.git
   cd ConsultancyDevBackend
   ```

2. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set up environment variables**
   ```bash
   cp .env.railway.example .env
   # Edit .env with your local settings
   ```

5. **Run migrations**
   ```bash
   python manage.py migrate
   ```

6. **Create superuser**
   ```bash
   python manage.py createsuperuser
   ```

7. **Run development server**
   ```bash
   python manage.py runserver
   ```

## Railway Deployment

### Quick Deploy

1. **Install Railway CLI**
   ```bash
   npm install -g @railway/cli
   ```

2. **Login to Railway**
   ```bash
   railway login
   ```

3. **Initialize project**
   ```bash
   railway init
   ```

4. **Add PostgreSQL**
   ```bash
   railway add --plugin postgresql
   ```

5. **Add Redis**
   ```bash
   railway add --plugin redis
   ```

6. **Set environment variables**
   ```bash
   railway variables set SECRET_KEY=your-secret-key-here
   railway variables set DEBUG=False
   railway variables set ALLOWED_HOSTS=your-app.railway.app
   ```

7. **Deploy**
   ```bash
   railway up
   ```

### Environment Variables

Required environment variables for Railway:

- `SECRET_KEY` - Django secret key (generate new one)
- `DEBUG` - Set to `False` in production
- `ALLOWED_HOSTS` - Your Railway domain
- `CORS_ALLOWED_ORIGINS` - Frontend URL
- `DATABASE_URL` - Auto-set by Railway PostgreSQL plugin
- `REDIS_URL` - Auto-set by Railway Redis plugin

### Post-Deployment

1. **Run migrations**
   ```bash
   railway run python manage.py migrate
   ```

2. **Create superuser**
   ```bash
   railway run python manage.py createsuperuser
   ```

3. **Collect static files** (if needed)
   ```bash
   railway run python manage.py collectstatic --no-input
   ```

## Project Structure

```
backend/
├── config/              # Django project settings
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── core/                # Main application
│   ├── models.py        # Database models
│   ├── views.py         # API views
│   ├── serializers.py   # DRF serializers
│   ├── urls.py          # URL routing
│   └── management/      # Custom commands
├── media/               # User uploaded files
├── staticfiles/         # Collected static files
├── requirements.txt     # Python dependencies
├── railway.toml         # Railway configuration
├── runtime.txt          # Python version
├── build.sh             # Build script
└── manage.py            # Django management
```

## API Endpoints

### Authentication
- `POST /api/auth/signup/` - User registration
- `POST /api/auth/login/` - User login
- `POST /api/auth/token/refresh/` - Refresh JWT token

### Core Resources
- `/api/enquiries/` - Enquiry management
- `/api/registrations/` - Registration management
- `/api/enrollments/` - Enrollment management
- `/api/courses/` - Course management
- `/api/documents/` - Document management
- `/api/payments/` - Payment tracking
- `/api/approval-requests/` - Approval workflow

## License

MIT License
