# 🚀 Admin & Super Admin User Setup Guide

This guide will help you create admin and super admin users in your ElimuHub 2.0 system.

## 📋 Available User Roles

### 1. **SUPER_ADMIN** 👑
- **Highest level access** - Full system control
- Can manage all users, including other admins
- System configuration and settings access
- Complete audit log access
- Database management capabilities

### 2. **ADMIN** 👤
- **Administrative access** - User and content management
- Can manage teachers and regular users
- Content moderation and approval
- Limited system configuration access
- User activity monitoring

### 3. **TEACHER** 👨‍🏫
- **Standard user access** - Educational content creation
- Lesson plans and schemes of work
- Document upload and management
- Basic profile management

## 🔧 How to Create Admin Users

### Method 1: Using the Script (Recommended)

#### Step 1: Navigate to Server Directory
```bash
cd server
```

#### Step 2: Run the Admin Creation Script
```bash
# Using TypeScript version (recommended)
npm run create:admins

# OR using JavaScript version
npm run create:admins:js
```

#### Step 3: Verify Users Created
The script will display all created users and their credentials.

### Method 2: Manual Database Seeding

#### Step 1: Run Database Seed
```bash
npm run db:seed
```

#### Step 2: Check Database
```bash
npm run db:studio
```

### Method 3: Using Prisma Studio

#### Step 1: Open Prisma Studio
```bash
npm run db:studio
```

#### Step 2: Navigate to Users Table
- Open your browser to `http://localhost:5555`
- Click on the "User" model
- Click "Add record" to create new users

## 🔐 Default Admin Credentials

After running the script, you'll have these users:

### Super Admin
- **Email**: `superadmin@elimuhub.com`
- **Password**: `superadmin123`
- **Role**: `SUPER_ADMIN`
- **Access**: Full system control

### Admin
- **Email**: `admin@elimuhub.com`
- **Password**: `admin123`
- **Role**: `ADMIN`
- **Access**: User and content management

### Teacher (Demo)
- **Email**: `teacher@elimuhub.com`
- **Password**: `teacher123`
- **Role**: `TEACHER`
- **Access**: Educational content creation

## 🛡️ Security Best Practices

### 1. **Change Default Passwords**
After first login, immediately change the default passwords:
```bash
# Use the admin panel or API endpoints to change passwords
PUT /api/admin/users/:userId
```

### 2. **Use Strong Passwords**
- Minimum 12 characters
- Mix of uppercase, lowercase, numbers, and symbols
- Avoid common words or patterns

### 3. **Enable Two-Factor Authentication** (Future Feature)
- SMS or email verification
- Authenticator app support
- Backup codes for recovery

### 4. **Regular Password Rotation**
- Change admin passwords every 90 days
- Use password manager for secure storage
- Never share credentials

## 🔍 Verifying User Creation

### Check Database Connection
```bash
npm run test:connection
```

### List All Users
```bash
npm run check:db
```

### Test Authentication
```bash
npm run test:auth
```

## 🚨 Troubleshooting

### Issue 1: Database Connection Failed
```bash
# Check if database is running
npm run db:studio

# Verify environment variables
cat .env
```

### Issue 2: Prisma Client Not Generated
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push
```

### Issue 3: Permission Denied
```bash
# Check user roles in database
npm run check:db

# Verify middleware configuration
# Check src/middleware/authMiddleware.ts
```

## 📱 Using Admin Accounts

### 1. **Login to System**
- Navigate to login page
- Use admin credentials
- You'll be redirected based on role

### 2. **Super Admin Dashboard**
- Access: `/admin/settings`
- System configuration
- User management
- Audit logs

### 3. **Admin Dashboard**
- Access: `/admin/users`
- User management
- Content moderation
- System monitoring

### 4. **Teacher Dashboard**
- Access: `/dashboard`
- Lesson plans
- Schemes of work
- Document management

## 🔄 Updating User Roles

### Promote User to Admin
```typescript
// Using the admin API
PUT /api/admin/users/:userId
{
  "role": "ADMIN",
  "status": "ACTIVE"
}
```

### Demote Admin to Teacher
```typescript
// Using the super admin API
PUT /api/admin/users/:userId
{
  "role": "TEACHER",
  "status": "ACTIVE"
}
```

## 📊 User Management Commands

### List All Users
```bash
npm run check:db
```

### Create Single User
```bash
# Using the script with custom data
# Edit src/scripts/createAdminUsers.ts
npm run create:admins
```

### Delete User (Super Admin Only)
```bash
# Use Prisma Studio or API endpoints
DELETE /api/admin/users/:userId
```

## 🎯 Next Steps

1. **Change Default Passwords** - Security first!
2. **Configure System Settings** - Customize your ElimuHub instance
3. **Create Additional Admins** - Build your admin team
4. **Set Up User Policies** - Define access controls
5. **Monitor System Activity** - Use audit logs

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section above
2. Review server logs in `server/logs/`
3. Verify database connection
4. Check Prisma schema compatibility

---

**Timestamp**: 2025-01-27 15:45 UTC

*References: [Prisma Documentation](https://www.prisma.io/docs), [bcrypt.js](https://github.com/dcodeIO/bcrypt.js), [ElimuHub API](server/src/routes/admin/users.ts)*
