# 🚀 Quick Database Setup Guide

*Last Updated: December 2024*

## ✅ **What's Already Fixed**

- **Database Configuration**: Updated to reference PostgreSQL instead of SQLite
- **Environment Loading**: Server now loads `.env` from project root
- **Service Layer**: All services already use Prisma Client correctly
- **Test Script**: Database connection test script created

## 📋 **Final Steps Required**

### **Step 1: Create Environment File**
Create `.env` file in **project root** (same level as `package.json`):

```bash
# Database Configuration
DATABASE_URL=postgres://elimu_user:Ed10400die#@localhost:5432/elimuhub

# Server Configuration
PORT=5000
NODE_ENV=development

# Security
JWT_SECRET=elimuhub-super-secret-jwt-key-2024
JWT_EXPIRES_IN=7d
REFRESH_TOKEN_SECRET=elimuhub-refresh-token-secret-2024
REFRESH_TOKEN_EXPIRES_IN=30d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Processing
UPLOAD_MAX_SIZE=50MB
UPLOAD_PATH=./uploads
EXPORT_OUTPUT_DIR=./outputs
OCR_LANGUAGE=eng

# AI Services
CHROMA_DB_PATH=http://localhost:8000
```

### **Step 2: Test Database Connection**
```bash
cd server
node test-database.js
```

**Expected Output:**
```
🧪 Testing ElimuHub Database Connection...

📋 Environment Variables Check:
   DATABASE_URL: ✅ Set
   NODE_ENV: development
   PORT: 5000

🔌 Prisma Client Import Test:
   ✅ Prisma Client imported successfully

🌐 Database Connection Test:
   ✅ Database connection successful

🔍 Database Query Test:
   ✅ Basic query successful: [ { test: 1 } ]

👥 User Table Access Test:
   ✅ User table accessible, count: 0

✅ All tests passed! Database is ready.
```

### **Step 3: Seed Database** *(Optional)*
```bash
cd server
npx prisma db seed
```

**Expected Output:**
```
🌱 Seeding database...
✅ Database seeded successfully!
👤 Admin user: admin@elimuhub.com
👨‍🏫 Teacher user: teacher@elimuhub.com
📅 Scheme template: CBC Scheme of Work Template
```

### **Step 4: Start Development Server**
```bash
# From project root
npm run dev

# Or individually
npm run server:dev  # Backend on :5000
npm run client:dev  # Frontend on :3000
```

## 🚨 **If Tests Fail**

### **Issue: "DATABASE_URL is missing"**
- Ensure `.env` file is in **project root** (not in server/ or client/)
- Check file permissions and syntax

### **Issue: "Prisma Client import failed"**
```bash
cd server
npx prisma generate
```

### **Issue: "Database connection failed"**
- Verify PostgreSQL is running
- Check database credentials
- Ensure database `elimuhub` exists

### **Issue: "User table not accessible"**
```bash
cd server
npx prisma migrate dev
```

## 🎯 **Success Indicators**

✅ **Environment**: `.env` file created in project root  
✅ **Database**: Connection test passes  
✅ **Prisma**: Client imports and connects successfully  
✅ **Schema**: Database tables accessible  
✅ **Seeding**: Initial data populated (optional)  
✅ **Server**: Development server starts without errors  

## 📁 **File Locations**

```
elimuhub-2.0/
├── .env                    # ← Environment variables (HERE)
├── ENVIRONMENT_SETUP.md    # Detailed configuration guide
├── SETUP_DATABASE.md       # This quick setup guide
├── server/
│   ├── test-database.js    # Database test script
│   └── src/
│       └── config/
│           └── database.ts # Fixed database configuration
└── client/
```

---

**Generated via ElimuHub 2.0 | CBC Compliant** 🇰🇪

*Ready for Final Database Setup - Almost There! 🎉*
