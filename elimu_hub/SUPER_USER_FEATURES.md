# Elimu Hub 2.0 - Super User Features

## Overview

The Elimu Hub 2.0 system now includes comprehensive user management and dynamic education level management, with super user privileges for administrative tasks.

## New Features

### 1. **User Management System**

#### User Roles
- **Admin**: Full system access, can manage users and all system settings
- **Super User**: Can manage education levels and upload documents  
- **User**: Can query the system (standard user)

#### Authentication
- JWT-based authentication with token expiration
- Secure password hashing
- Session management with login tracking

### 2. **Dynamic Education Level Management**

Instead of hardcoded education levels, the system now supports:
- Dynamic creation of education levels by super users
- Multi-language support (English/Kiswahili names)
- Custom descriptions and display ordering
- Soft deletion (deactivation) of unused levels

### 3. **Enhanced Document Upload**

- Authentication required for uploads
- Document ownership tracking (who uploaded what)
- Validation against active education levels
- Upload history and user-specific document filtering

## API Endpoints

### Authentication

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

Response:
```json
{
  "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "token_type": "bearer",
  "user_id": "uuid-here",
  "username": "admin",
  "role": "admin"
}
```

#### Register User (Admin Only)
```http
POST /auth/register
Authorization: Bearer {token}
Content-Type: application/json

{
  "username": "newuser",
  "email": "user@elimuhub.co.ke",
  "password": "securepassword",
  "full_name": "New User",
  "role": "super_user"
}
```

### Education Level Management

#### Get All Education Levels
```http
GET /education-levels
```

Response:
```json
[
  {
    "id": 1,
    "name": "Primary",
    "name_swahili": "Msingi",
    "description": "Primary education levels (Grades 1-6)",
    "display_order": 1,
    "is_active": true,
    "created_at": "2025-01-01T00:00:00Z"
  }
]
```

#### Create Education Level (Super User Only)
```http
POST /education-levels
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Pre-Primary",
  "name_swahili": "Awali",
  "description": "Early childhood education",
  "display_order": 0
}
```

#### Update Education Level (Super User Only)
```http
PUT /education-levels/{level_id}
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Updated Primary",
  "name_swahili": "Msingi Ulioboreshwa",
  "description": "Updated description",
  "display_order": 1
}
```

#### Delete Education Level (Super User Only)
```http
DELETE /education-levels/{level_id}
Authorization: Bearer {token}
```

### Enhanced Document Upload

#### Upload Document (Authenticated Users)
```http
POST /upload
Authorization: Bearer {token}
Content-Type: multipart/form-data

file: [PDF file]
education_level: "Primary"
subject: "Mathematics"
language: "en"
```

Response:
```json
{
  "document_id": "uuid-here",
  "filename": "math_textbook.pdf",
  "status": "uploaded",
  "message": "Document uploaded successfully and is being processed"
}
```

## Setup Instructions

### 1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

### 2. **Environment Configuration**
Add to your `.env` file:
```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Database (existing settings remain the same)
DATABASE_URL=postgresql://postgres:password@localhost:5432/elimu_hub
```

### 3. **Database Migration**
The system will automatically create the new tables on startup, including:
- `users` table for authentication
- `education_levels` table for dynamic levels
- Updated `documents` table with user tracking

### 4. **Default Admin Account**
On first startup, the system creates a default admin account:
- **Username**: `admin`
- **Password**: `admin123` 
- **Email**: `admin@elimuhub.co.ke`

**⚠️ IMPORTANT**: Change this password immediately in production!

### 5. **Start the System**
```bash
python start_server.py
```

## Usage Workflow

### For Super Users:

1. **Login** with your credentials
2. **Manage Education Levels**:
   - View existing levels at `/education-levels`
   - Create new levels via POST to `/education-levels`
   - Update existing levels via PUT to `/education-levels/{id}`
   - Deactivate unused levels via DELETE

3. **Upload Documents**:
   - Use the `/upload` endpoint with authentication
   - Select from available active education levels
   - Documents are automatically linked to your user account

### For Regular Users:

1. **Login** with provided credentials
2. **Query the System**:
   - Use existing `/query` endpoint
   - Filter by education level and subject
   - Receive AI-generated responses with citations

## Security Features

### Authentication Security
- JWT tokens with configurable expiration
- Secure password hashing (SHA-256)
- Role-based access control
- Session tracking and login counting

### Authorization Levels
- **Endpoint Protection**: Sensitive endpoints require authentication
- **Role Validation**: Super user and admin endpoints check user roles
- **Resource Ownership**: Users can view their uploaded documents

### Data Validation
- Education level validation during upload
- File type and size restrictions
- Duplicate document detection
- Input sanitization and validation

## API Documentation

Access interactive API documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

Both interfaces now include authentication support with the "Authorize" button to enter your JWT token.

## Kenyan Education Context

### Supported Education Levels (Default)
1. **Primary** (Msingi) - Grades 1-6
2. **Junior Secondary** (Sekondari ya Chini) - Grades 7-9  
3. **Secondary** (Sekondari) - Grades 10-12

### Custom Levels
Super users can add additional levels such as:
- Pre-Primary (Awali)
- TVET (Technical and Vocational Education and Training)
- University Preparatory
- Adult Education

### Multi-language Support
- All education levels support English and Kiswahili names
- API responses adapt to user language preferences
- OCR supports both English and Kiswahili text recognition

## Monitoring and Administration

### User Activity Tracking
- Login history and frequency
- Document upload tracking
- Query logging with user attribution

### System Health
- Authentication service status
- Database connectivity monitoring
- Role-based access validation

### Administrative Tasks
- User role management
- Education level lifecycle management
- Document ownership and access control

This enhanced system provides a robust foundation for managing educational content with proper user access controls and administrative capabilities suitable for Kenyan educational institutions.
