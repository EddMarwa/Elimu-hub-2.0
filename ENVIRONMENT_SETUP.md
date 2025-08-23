# 🌍 Environment Configuration Guide

*Last Updated: December 2024*

## 📋 **Required Environment Variables**

Create a `.env` file in the **project root** (same level as `package.json`) with the following configuration:

```bash
# ========================================
# ElimuHub 2.0 - Environment Configuration
# ========================================

# Database Configuration
DATABASE_URL=postgres://elimu_user:Ed10400die#@localhost:5432/elimuhub

# Server Configuration
PORT=5000
NODE_ENV=development

# Security & Authentication
JWT_SECRET=elimuhub-super-secret-jwt-key-2024
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=elimuhub-refresh-token-secret-2024
REFRESH_TOKEN_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload & Processing
UPLOAD_MAX_SIZE=50MB
UPLOAD_PATH=./uploads
EXPORT_OUTPUT_DIR=./outputs
OCR_LANGUAGE=eng

# AI & ML Services
CHROMA_DB_PATH=http://localhost:8000
OPENAI_API_KEY=your-openai-api-key-here
AI_MODEL=gpt-3.5-turbo

# Email Configuration (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log

# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://127.0.0.1:3000

# Session Configuration
SESSION_SECRET=elimuhub-session-secret-2024
SESSION_COOKIE_SECURE=false
SESSION_COOKIE_HTTPONLY=true

# Development Tools
ENABLE_SWAGGER=true
ENABLE_GRAPHIQL=true
```

## 🚀 **Quick Setup Steps**

### **1. Create Environment File**
```bash
# Navigate to project root
cd elimuhub-2.0

# Create .env file
touch .env

# Copy the configuration above into .env
```

### **2. Update Database URL** *(If Different)*
```bash
# Default configuration
DATABASE_URL=postgres://elimu_user:Ed10400die#@localhost:5432/elimuhub

# Customize if needed:
# - Change username: elimu_user
# - Change password: Ed10400die#
# - Change host: localhost
# - Change port: 5432
# - Change database: elimuhub
```

### **3. Generate JWT Secrets**
```bash
# Generate secure JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

## 🔧 **Configuration Details**

### **Database Configuration**
- **Provider**: PostgreSQL
- **Host**: localhost (or your database host)
- **Port**: 5432 (default PostgreSQL port)
- **Database**: elimuhub
- **User**: elimu_user
- **Password**: Ed10400die#

### **Server Configuration**
- **Port**: 5000 (backend API server)
- **Environment**: development/production
- **CORS**: Configured for localhost:3000 (React frontend)

### **Security Configuration**
- **JWT Secret**: Used for authentication tokens
- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Session Security**: HTTP-only cookies, secure in production

### **File Processing**
- **Upload Limit**: 50MB maximum file size
- **Upload Path**: ./uploads directory
- **Export Path**: ./outputs directory
- **OCR Language**: English (eng)

## 🧪 **Testing Configuration**

### **1. Test Database Connection**
```bash
cd server
npx prisma db pull
npx prisma generate
npx prisma studio
```

### **2. Test Server Startup**
```bash
cd server
npm run dev
```

### **3. Verify Environment Loading**
Check server logs for:
```
✅ Connected to PostgreSQL database successfully
🔍 Database connection test passed
```

## 🚨 **Common Issues & Solutions**

### **Issue: "Cannot find module '../generated/prisma'"**
**Solution**: Run Prisma generation
```bash
cd server
npx prisma generate
```

### **Issue: "Connection refused"**
**Solution**: Check PostgreSQL service
```bash
# Windows
net start postgresql-x64-15

# macOS/Linux
sudo systemctl start postgresql
```

### **Issue: "Authentication failed"**
**Solution**: Verify database credentials
```bash
psql -U elimu_user -d elimuhub -h localhost
# Enter password: Ed10400die#
```

### **Issue: "Environment variables not loaded"**
**Solution**: Check .env file location
- Must be in **project root** (same level as package.json)
- Not in server/ or client/ subdirectories

## 📁 **File Structure**
```
elimuhub-2.0/
├── .env                    # ← Environment variables (HERE)
├── package.json
├── server/
│   ├── src/
│   │   └── index.ts       # ← Loads .env from root
│   └── prisma/
└── client/
```

## 🔒 **Security Notes**

### **Production Environment**
- Change all default secrets
- Use strong, unique passwords
- Enable HTTPS
- Set NODE_ENV=production
- Use environment-specific database URLs

### **Development Environment**
- Default secrets are acceptable
- Local database connections
- HTTP for local development
- Debug logging enabled

## 📞 **Support**

If you encounter issues:
1. Check this guide first
2. Verify .env file location
3. Test database connection manually
4. Check server logs for errors
5. Ensure PostgreSQL is running

---

**Generated via ElimuHub 2.0 | CBC Compliant** 🇰🇪

*Environment Configuration Complete - Ready for Database Connection*
