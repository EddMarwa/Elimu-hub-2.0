# 🚀 ElimuHub 2.0 Demo Setup

**Get demo accounts working in 2 minutes - No database required!**

## ⚡ Quick Start

### 1. Start Demo Server
```bash
cd server
npm install --package-lock-only
npm start
```

### 2. Demo Accounts Available
| Role | Email | Password |
|------|-------|----------|
| 👑 **Admin** | `admin@elimuhub.com` | `password123` |
| 👨‍🏫 **Teacher** | `teacher@elimuhub.com` | `password123` |
| 🎭 **Demo** | `demo@elimuhub.com` | `password123` |

### 3. Test Login
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Health Check: `http://localhost:5000/health`

## 🔧 What This Demo Server Provides

✅ **Working Authentication** - Login/logout with JWT tokens  
✅ **User Profiles** - Get user data and role-based access  
✅ **No Database** - In-memory user storage  
✅ **CORS Enabled** - Frontend can connect from port 3000  
✅ **JWT Security** - Proper token-based authentication  

## 🎯 Perfect For

- **UI Testing** - Test login forms and user flows
- **Development** - Frontend development without backend complexity
- **Demo Purposes** - Show the system to stakeholders
- **Quick Prototyping** - Validate authentication logic

## 🚫 What's Not Included

- Database persistence
- File uploads
- Document processing
- AI features
- Complex business logic

## 🔄 Switching to Full Server

When you're ready for the full system:
1. Set up PostgreSQL database
2. Run Prisma migrations
3. Use the main `index.ts` server instead
4. The frontend will work with both servers

## 📞 Support

- **Demo Issues**: Check the server console for errors
- **Frontend Issues**: Ensure CORS is properly configured
- **Port Conflicts**: Change PORT in `simple-auth-server.js`

---

**🎉 You're all set! The demo accounts can now login successfully.**
