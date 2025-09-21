# Agenda Pimpinan - Fullstack Application

Aplikasi pelaporan kegiatan pimpinan dengan arsitektur fullstack menggunakan Node.js, Express, PostgreSQL, dan Next.js.

## 🏗️ Arsitektur Aplikasi

### Backend
- **Framework**: Node.js + Express.js
- **Database**: PostgreSQL
- **Authentication**: JWT (JSON Web Tokens)
- **Architecture**: Clean Architecture (Models, Services, Controllers, Routes)

### Frontend
- **Framework**: Next.js 15.5.3
- **UI Library**: shadcn/ui
- **Styling**: Tailwind CSS
- **Calendar**: react-big-calendar
- **Charts**: recharts
- **Icons**: lucide-react

## 🚀 Deployment Guide untuk DevOps

### ⚠️ CRITICAL: Timezone Configuration

**SEBELUM MELANJUTKAN DEPLOYMENT**, pastikan PostgreSQL timezone di-set ke `Asia/Jakarta`. Ini adalah konfigurasi KRITIS yang harus dilakukan untuk menghindari masalah:

- ❌ **Tanpa timezone yang benar**: Data agenda akan muncul di tanggal yang salah (mundur 1 hari)
- ❌ **Calendar events**: Akan termapping ke tanggal yang tidak sesuai
- ❌ **Dashboard charts**: Data akan tidak akurat

**Solusi**: Set timezone PostgreSQL ke `Asia/Jakarta` di Step 3 deployment.

### Prerequisites

#### 1. Server Requirements
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Windows Server 2019+
- **RAM**: Minimum 4GB, Recommended 8GB
- **Storage**: Minimum 20GB SSD
- **CPU**: 2+ cores

#### 2. Software Requirements
- **Node.js**: v20.0.0+
- **PostgreSQL**: v14.0+
- **Nginx**: v1.18+ (untuk reverse proxy)
- **PM2**: untuk process management
- **Git**: untuk deployment

### 📋 Step-by-Step Deployment

#### Step 1: Server Setup

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20+
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PostgreSQL
sudo apt install postgresql postgresql-contrib -y

# Install Nginx
sudo apt install nginx -y

# Install PM2 globally
sudo npm install -g pm2

# Install Git
sudo apt install git -y
```

#### Step 2: Database Setup

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE agenda_pimpinan_prod;
CREATE USER agenda_user WITH PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE agenda_pimpinan_prod TO agenda_user;
\q

# Test connection
psql -h localhost -U agenda_user -d agenda_pimpinan_prod
```

#### Step 3: Application Deployment

```bash
# Create application directory
sudo mkdir -p /var/www/agenda-pimpinan
sudo chown $USER:$USER /var/www/agenda-pimpinan

# Clone repository
cd /var/www/agenda-pimpinan
git clone https://github.com/your-org/agenda-pimpinan.git .

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Set timezone for PostgreSQL (CRITICAL for date handling)
sudo -u postgres psql -d agenda_pimpinan_prod -c "ALTER DATABASE agenda_pimpinan_prod SET timezone = 'Asia/Jakarta';"

# Verify timezone setting
sudo -u postgres psql -d agenda_pimpinan_prod -c "SHOW timezone;"
```

#### Step 4: Environment Configuration

```bash
# Create production environment file
cp env.example .env

# Edit .env file
nano .env
```

**Production .env Configuration:**
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=agenda_pimpinan_prod
DB_USER=agenda_user
DB_PASSWORD=your_secure_password

# JWT Configuration
JWT_SECRET=your_super_secure_jwt_secret_key_here
JWT_EXPIRES_IN=24h

# Server Configuration
PORT=3000
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://yourdomain.com

# Logging
LOG_LEVEL=info

# Production Features
DEBUG=false
HOT_RELOAD=false
```

#### Step 5: Database Migration & Seeding

```bash
# Run database migrations
npm run migrate

# Seed initial data
npm run seed

# Add dummy data (optional)
npm run add-dummy-agenda
npm run add-user2-agenda
```

#### Step 6: Build Frontend

```bash
# Build frontend for production
cd frontend
npm run build
cd ..
```

#### Step 7: PM2 Configuration

```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [{
    name: 'agenda-pimpinan-backend',
    script: 'src/app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Start application with PM2
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

#### Step 8: Nginx Configuration

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/agenda-pimpinan
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;

    # Frontend (Next.js)
    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/agenda-pimpinan /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

#### Step 9: SSL Certificate (Let's Encrypt)

```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx -y

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### Step 10: Firewall Configuration

```bash
# Configure UFW
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

### 🔧 Monitoring & Maintenance

#### Health Checks

```bash
# Check application status
pm2 status
pm2 logs agenda-pimpinan-backend

# Check database connection
psql -h localhost -U agenda_user -d agenda_pimpinan_prod -c "SELECT 1;"

# Check Nginx status
sudo systemctl status nginx
```

#### Backup Strategy

```bash
# Database backup script
nano /var/www/agenda-pimpinan/backup-db.sh
```

**backup-db.sh:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/var/backups/agenda-pimpinan"
mkdir -p $BACKUP_DIR

pg_dump -h localhost -U agenda_user -d agenda_pimpinan_prod > $BACKUP_DIR/agenda_backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "agenda_backup_*.sql" -mtime +7 -delete
```

```bash
# Make executable and add to cron
chmod +x backup-db.sh
crontab -e
# Add: 0 2 * * * /var/www/agenda-pimpinan/backup-db.sh
```

### 🚨 Troubleshooting

#### Common Issues

1. **Timezone Issues (CRITICAL)**
```bash
# Check current timezone
sudo -u postgres psql -d agenda_pimpinan_prod -c "SHOW timezone;"

# If timezone is not Asia/Jakarta, fix it:
sudo -u postgres psql -d agenda_pimpinan_prod -c "ALTER DATABASE agenda_pimpinan_prod SET timezone = 'Asia/Jakarta';"

# Restart PostgreSQL to apply changes
sudo systemctl restart postgresql

# Verify the change
sudo -u postgres psql -d agenda_pimpinan_prod -c "SHOW timezone;"
```

**⚠️ IMPORTANT**: Timezone setting is CRITICAL for proper date handling. Without correct timezone:
- Calendar events may appear on wrong dates
- Data may shift by 1 day due to UTC conversion
- Dashboard charts may show incorrect data

2. **Port Already in Use**
```bash
# Check what's using port 3000
sudo lsof -i :3000
# Kill process if needed
sudo kill -9 PID
```

2. **Database Connection Failed**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql
# Restart if needed
sudo systemctl restart postgresql
```

3. **Frontend Build Failed**
```bash
# Clear cache and rebuild
cd frontend
rm -rf .next node_modules
npm install
npm run build
```

4. **PM2 Process Crashed**
```bash
# Check logs
pm2 logs agenda-pimpinan-backend
# Restart process
pm2 restart agenda-pimpinan-backend
```

### 📊 Performance Optimization

#### Database Optimization

```sql
-- Add indexes for better performance
CREATE INDEX idx_agenda_date ON agenda(date);
CREATE INDEX idx_agenda_created_by ON agenda(created_by);
CREATE INDEX idx_agenda_status ON agenda(status);
```

#### Nginx Caching

```nginx
# Add to Nginx config
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### 🔐 Security Checklist

- [ ] Change default PostgreSQL password
- [ ] Use strong JWT secret
- [ ] Enable SSL/HTTPS
- [ ] Configure firewall
- [ ] Regular security updates
- [ ] Database backups
- [ ] Monitor logs
- [ ] Use environment variables for secrets
- [ ] **Set PostgreSQL timezone to Asia/Jakarta (CRITICAL)**
- [ ] Verify timezone setting after deployment

## 🔄 Pemisahan Frontend dan Backend

### Overview
Frontend dan backend dapat dipisah ke server yang berbeda untuk meningkatkan scalability dan performance.

### Struktur Setelah Dipisah

#### Backend Server:
```
agenda-pimpinan-backend/
├── src/
├── package.json
└── README.md
```

#### Frontend Server:
```
agenda-pimpinan-frontend/
├── src/
├── public/
├── package.json
└── README.md
```

### 📋 Langkah-langkah Pemisahan

#### Step 1: Siapkan Frontend Terpisah

```bash
# Di server frontend
mkdir agenda-pimpinan-frontend
cd agenda-pimpinan-frontend

# Copy folder frontend dari project utama
# (Cut & paste folder frontend ke server baru)
```

#### Step 2: Update Konfigurasi Frontend

**Update `frontend/package.json`:**
```json
{
  "name": "agenda-pimpinan-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 3001",
    "build": "next build",
    "start": "next start -p 3001",
    "lint": "next lint"
  }
}
```

**Update `frontend/next.config.ts`:**
```typescript
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Add backend URL for API calls
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://backend-server:3000'
  },
  // Enable standalone output for Docker
  output: 'standalone'
}

module.exports = nextConfig
```

#### Step 3: Update API Calls di Frontend

**Update `frontend/src/lib/auth.ts`:**
```typescript
// Add backend URL configuration
const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

export const API_BASE_URL = BACKEND_URL;

// Update all fetch calls to use API_BASE_URL
export const login = async (username: string, password: string) => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });
  // ... rest of the code
};
```

**Update semua API calls di frontend:**
```typescript
// Ganti semua hardcoded localhost:3000 dengan:
const response = await fetch(`${API_BASE_URL}/api/agenda`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
```

#### Step 4: Environment Configuration

**Frontend `.env.local`:**
```env
BACKEND_URL=http://your-backend-server.com:3000
NEXT_PUBLIC_API_URL=http://your-backend-server.com:3000
```

**Backend `.env`:**
```env
# Update CORS origin
CORS_ORIGIN=http://your-frontend-server.com:3001
```

#### Step 5: Update CORS di Backend

**Update `src/app.js`:**
```javascript
app.use(cors({
  origin: [
    'http://localhost:3001',           // Development
    'http://your-frontend-server.com', // Production frontend
    'https://your-frontend-domain.com' // Production with SSL
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  optionsSuccessStatus: 200
}));
```

### 🚀 Deployment Terpisah

#### Backend Server Deployment:
```bash
# Di backend server
git clone https://github.com/your-org/agenda-pimpinan-backend.git
cd agenda-pimpinan-backend
npm install
npm run migrate
npm run seed
pm2 start ecosystem.config.js
```

#### Frontend Server Deployment:
```bash
# Di frontend server
git clone https://github.com/your-org/agenda-pimpinan-frontend.git
cd agenda-pimpinan-frontend
npm install
npm run build
pm2 start "npm start" --name "agenda-frontend"
```

### 🔧 Nginx Configuration untuk Frontend Server

```nginx
server {
    listen 80;
    server_name your-frontend-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### ⚠️ Pertimbangan Penting

#### 1. CORS Configuration:
- Backend harus allow origin frontend server
- Update CORS_ORIGIN di environment backend

#### 2. Network Security:
- Pastikan backend server bisa diakses dari frontend server
- Gunakan firewall rules yang tepat
- Pertimbangkan VPN atau private network

#### 3. SSL/HTTPS:
- Jika menggunakan HTTPS, pastikan kedua server support SSL
- Update CORS origin ke HTTPS

#### 4. Environment Variables:
- Frontend perlu tahu URL backend server
- Backend perlu tahu allowed frontend origins

### 📁 File yang Perlu Diupdate

#### Frontend:
- `package.json` (nama project)
- `next.config.ts` (backend URL)
- Semua API calls (ganti localhost dengan backend URL)
- `.env.local` (backend URL)

#### Backend:
- `src/app.js` (CORS configuration)
- `.env` (CORS_ORIGIN)

### 📞 Support

Untuk bantuan teknis, hubungi:
- **Email**: devops@yourcompany.com
- **Slack**: #devops-support
- **Documentation**: [Internal Wiki Link]

---

**Last Updated**: September 2025
**Version**: 1.0.0
**Maintainer**: DevOps Team
