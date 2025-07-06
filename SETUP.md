# ElimuHub 2.0 Setup Guide

This guide will help you set up and run ElimuHub 2.0 on your local development environment.

## Prerequisites


Before you begin, ensure you have the following installed on your system:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v4.4 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Git** - [Download here](https://git-scm.com/)
- **npm** or **yarn** package manager

## Installation Steps

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Elimu-hub-2.0
```

### 2. Install Dependencies

Install dependencies for all packages (root, server, and client):

```bash
npm run install:all
```

Or install individually:

```bash
# Root dependencies
npm install

# Server dependencies
cd server
npm install

# Client dependencies
cd ../client
npm install
```

### 3. Set Up Environment Variables

#### Server Environment Variables

1. Copy the example environment file:
```bash
cd server
cp .env.example .env
```

2. Edit the `.env` file with your configuration:

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database Configuration
MONGODB_URI=mongodb://localhost:27017/elimuhub

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here
JWT_REFRESH_SECRET=your-super-secret-refresh-key-here

# OpenAI Configuration (for AI features)
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-4

# File Upload Configuration
UPLOAD_DIR=uploads
MAX_FILE_SIZE=10485760

# CORS Configuration
CORS_ORIGIN=http://localhost:3000
```

#### Client Environment Variables (Optional)

Create a `.env` file in the client directory if you need to customize the API URL:

```bash
cd client
touch .env
```

Add the following if your backend runs on a different port:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

### 4. Set Up MongoDB

#### Option A: Local MongoDB Installation

1. Install MongoDB Community Edition
2. Start MongoDB service:
   - **Windows**: MongoDB should start automatically as a service
   - **macOS**: `brew services start mongodb/brew/mongodb-community`
   - **Linux**: `sudo systemctl start mongod`

3. Verify MongoDB is running:
```bash
mongo --eval "db.adminCommand('ismaster')"
```

#### Option B: MongoDB Atlas (Cloud)

1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster
3. Get your connection string and update `MONGODB_URI` in your `.env` file

### 5. Set Up OpenAI API (Optional)

For AI-powered lesson plan generation:

1. Create an account at [OpenAI](https://platform.openai.com/)
2. Generate an API key
3. Add the API key to your server `.env` file

### 6. Create Required Directories

```bash
# From the project root
mkdir -p server/uploads
mkdir -p server/logs
mkdir -p server/temp_pdfs
```

## Running the Application

### Development Mode

To run both frontend and backend simultaneously:

```bash
# From the project root
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend application on `http://localhost:3000`

### Running Individually

#### Backend Only
```bash
cd server
npm run dev
```

#### Frontend Only
```bash
cd client
npm start
```

### Production Mode

#### Build the Frontend
```bash
cd client
npm run build
```

#### Start the Backend
```bash
cd server
npm start
```

## Verification

### 1. Check Backend Health

Visit `http://localhost:5000/health` in your browser. You should see:

```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456,
  "environment": "development"
}
```

### 2. Check Frontend

Visit `http://localhost:3000` in your browser. You should see the ElimuHub 2.0 login page.

### 3. Check Database Connection

Look for this message in your server logs:
```
✅ Connected to MongoDB successfully
```

## Troubleshooting

### Common Issues

#### 1. Port Already in Use

If you get a "port already in use" error:

```bash
# Kill process on port 5000 (backend)
npx kill-port 5000

# Kill process on port 3000 (frontend)
npx kill-port 3000
```

#### 2. MongoDB Connection Issues

- Ensure MongoDB is running
- Check your `MONGODB_URI` in the `.env` file
- For MongoDB Atlas, ensure your IP is whitelisted

#### 3. Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules server/node_modules client/node_modules
npm run install:all
```

#### 4. TypeScript Errors

The project includes TypeScript configurations. If you see TypeScript errors:

```bash
# Server
cd server
npm run build

# Client
cd client
npm run build
```

### Environment-Specific Issues

#### Windows
- Use Git Bash or PowerShell for better compatibility
- Ensure MongoDB service is running in Services

#### macOS
- Use Homebrew for installing dependencies
- Check file permissions if you encounter access errors

#### Linux
- Ensure you have build tools installed: `sudo apt-get install build-essential`
- Check MongoDB service status: `sudo systemctl status mongod`

## Next Steps

Once you have the application running:

1. **Create an Admin User**: Use the registration form to create your first user
2. **Upload Curriculum Documents**: Start by uploading CBC curriculum PDFs
3. **Generate Lesson Plans**: Use the AI features to create lesson plans
4. **Explore Features**: Navigate through the different sections of the application

## Development Workflow

### Making Changes

1. **Backend Changes**: Server will auto-restart with nodemon
2. **Frontend Changes**: React will hot-reload automatically
3. **Database Changes**: Update models in `server/src/models/`

### Testing

```bash
# Run server tests
cd server
npm test

# Run client tests
cd client
npm test
```

### Code Quality

```bash
# Lint server code
cd server
npm run lint

# Lint client code
cd client
npm run lint
```

## Support

If you encounter issues:

1. Check the logs in `server/logs/`
2. Ensure all environment variables are set correctly
3. Verify all dependencies are installed
4. Check that MongoDB is running and accessible

For additional help, refer to the main README.md file or create an issue in the project repository.