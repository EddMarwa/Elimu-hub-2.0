# 🌱 ElimuHub 2.0 Database Seed Scripts

*Last Updated: December 2024*

## 📋 Overview

This directory contains seed scripts for populating the ElimuHub 2.0 database with initial data, including admin users, templates, and sample content.

## 🚀 Quick Start

### Run Complete Database Seeding
```bash
# From server directory
npm run db:seed
# or
npx prisma db seed
```

### Run Admin Users Only
```bash
# From server directory
npx ts-node prisma/seed/create-admin-users.ts
```

## 📁 Files

### `create-admin-users.ts`
**Purpose**: Creates default admin users with role-based access control

**Features**:
- ✅ Secure password hashing with bcrypt (12 salt rounds)
- ✅ Duplicate email checking (skips existing users)
- ✅ Role-based user creation (SUPER_ADMIN, ADMIN, TEACHER)
- ✅ Comprehensive logging and error handling
- ✅ TypeScript support with proper type safety

**Default Users Created**:
1. **Super Admin**
   - Email: `superadmin@elimuhub.com`
   - Password: `superadmin123`
   - Role: `SUPER_ADMIN`
   - Permissions: Full system access

2. **Admin**
   - Email: `admin@elimuhub.com`
   - Password: `admin123`
   - Role: `ADMIN`
   - Permissions: Administrative functions

3. **Demo Teacher**
   - Email: `teacher@elimuhub.com`
   - Password: `teacher123`
   - Role: `TEACHER`
   - Permissions: Teacher-level access

## 🔧 Configuration

### Prisma Schema Requirements
The seed scripts require the following Prisma schema structure:

```prisma
enum UserRole {
  TEACHER
  ADMIN
  SUPER_ADMIN
}

enum UserStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}

model User {
  id        String     @id @default(cuid())
  email     String     @unique
  firstName String
  lastName  String
  password  String
  role      UserRole   @default(TEACHER)
  status    UserStatus @default(ACTIVE)
  // ... other fields
}
```

### Environment Variables
Ensure your `.env` file contains:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/elimuhub"
```

## 🎯 Usage Examples

### Development Setup
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run migrations
npx prisma migrate dev

# 4. Seed database
npm run db:seed
```

### Production Deployment
```bash
# 1. Deploy migrations
npx prisma migrate deploy

# 2. Seed admin users only
npx ts-node prisma/seed/create-admin-users.ts
```

### Testing
```bash
# Test database connection
node test-database.js

# Test admin users creation
npx ts-node prisma/seed/create-admin-users.ts
```

## 📊 Expected Output

### Successful Seeding
```
🌱 Starting ElimuHub 2.0 Admin Users Seed...

🔌 Database connection established

✅ Created user: superadmin@elimuhub.com (SUPER_ADMIN)
✅ Created user: admin@elimuhub.com (ADMIN)
✅ Created user: teacher@elimuhub.com (TEACHER)

📊 Seed Summary:
   ✅ Created: 3 users
   ⏭️  Skipped: 0 users (already exist)
   📋 Total processed: 3 users

👥 All Users in System:
   1. System SuperAdmin (superadmin@elimuhub.com)
      Role: SUPER_ADMIN | Status: ACTIVE | Created: 25/12/2024
   2. System Admin (admin@elimuhub.com)
      Role: ADMIN | Status: ACTIVE | Created: 25/12/2024
   3. Demo Teacher (teacher@elimuhub.com)
      Role: TEACHER | Status: ACTIVE | Created: 25/12/2024

🎉 Admin users seed completed successfully!

🔐 Login Credentials for New Users:
   SUPER_ADMIN: superadmin@elimuhub.com / superadmin123
   ADMIN: admin@elimuhub.com / admin123
   TEACHER: teacher@elimuhub.com / teacher123

🔌 Database connection closed
```

### When Users Already Exist
```
🌱 Starting ElimuHub 2.0 Admin Users Seed...

🔌 Database connection established

⏭️  User already exists: superadmin@elimuhub.com (SUPER_ADMIN)
⏭️  User already exists: admin@elimuhub.com (ADMIN)
⏭️  User already exists: teacher@elimuhub.com (TEACHER)

📊 Seed Summary:
   ✅ Created: 0 users
   ⏭️  Skipped: 3 users (already exist)
   📋 Total processed: 3 users

🎉 Admin users seed completed successfully!
```

## 🔒 Security Features

- **Password Hashing**: All passwords are securely hashed using bcrypt with 12 salt rounds
- **Duplicate Prevention**: Scripts check for existing users before creation
- **Role-Based Access**: Proper role assignment with enum validation
- **Error Handling**: Comprehensive error handling and logging
- **Type Safety**: Full TypeScript support with proper type checking

## 🛠️ Troubleshooting

### Common Issues

**Issue**: "Prisma Client not generated"
```bash
# Solution: Generate Prisma client
npx prisma generate
```

**Issue**: "Database connection failed"
```bash
# Solution: Check DATABASE_URL in .env file
# Ensure PostgreSQL is running
```

**Issue**: "User already exists"
```bash
# This is expected behavior - script skips existing users
# Check the output for "Skipped" count
```

**Issue**: "TypeScript compilation errors"
```bash
# Solution: Ensure all dependencies are installed
npm install
npx prisma generate
```

## 📝 Customization

### Adding New Users
Edit `create-admin-users.ts` and add to the `defaultUsers` array:

```typescript
const defaultUsers: UserData[] = [
  // ... existing users
  {
    name: "New User",
    email: "newuser@elimuhub.com",
    password: "newpassword123",
    role: UserRole.TEACHER
  }
];
```

### Modifying User Fields
Update the user creation logic in `createUserIfNotExists()` function to include additional fields as needed.

## 🎉 Success Indicators

✅ **Database Connection**: Establishes connection successfully  
✅ **User Creation**: Creates users with proper roles and hashed passwords  
✅ **Duplicate Handling**: Skips existing users gracefully  
✅ **Logging**: Provides clear feedback on operations  
✅ **Error Handling**: Handles errors gracefully with informative messages  

---

**Generated via ElimuHub 2.0 | CBC Compliant** 🇰🇪

*Ready for Production Use - Database Seeding Complete! 🚀*
