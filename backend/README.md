# CampusPass - Smart Campus Access Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.12-black)](https://www.fastify.io/)



A modern, secure, and scalable campus outpass management system built with Fastify, TypeScript, and MongoDB. Designed for educational institutions to streamline student outpass approvals, enhance security, and provide real-time tracking.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Configuration](#-configuration)
- [Security](#-security)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Features

### Core Functionality
- **Smart Auto-Approval System**: Intelligent outpass approval based on student status and violation history
- **Role-Based Access Control**: Four distinct user roles (Student, Warden, Security, Admin)
- **Real-Time Tracking**: Track student location (in/out of campus) with timestamps
- **Violation Management**: Automatic remark system with progressive restrictions
- **JWT Authentication**: Secure token-based authentication and authorization

### User Roles & Capabilities

#### 👨‍🎓 Student
- Request outpass with purpose and time details
- View outpass history and status
- Check violation records
- Update profile information

#### 👨‍🏫 Warden
- Review and approve/reject outpass requests
- View all students in assigned hostel
- Monitor outgoing students
- Add remarks for violations
- View analytics and reports

#### 🔐 Security
- Verify outpass at entry/exit points
- Mark student in/out status
- View real-time outgoing students list
- Report violations

#### 👨‍💼 Admin
- Manage all users (CRUD operations)
- System-wide analytics
- Configure system settings
- Bulk operations
- Export reports

---

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (v14+)
- **Framework**: Fastify 4.12
- **Language**: TypeScript 4.9
- **Database**: MongoDB 4.4+
- **ODM**: Mongoose 6.8

### Security & Authentication
- **JWT**: @fastify/jwt 6.5
- **Password Hashing**: bcryptjs 2.4
- **Security Headers**: @fastify/helmet 10.1
- **CORS**: @fastify/cors 8.2

### Utilities
- **Environment Variables**: dotenv 16.0
- **Logging**: winston 3.8

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js**: v14.0.0 or higher ([Download](https://nodejs.org/))
- **MongoDB**: v4.4 or higher ([Download](https://www.mongodb.com/try/download/community))
- **npm** or **yarn**: Package manager
- **Git**: Version control ([Download](https://git-scm.com/))

### System Requirements
- **RAM**: Minimum 2GB (4GB recommended)
- **Storage**: 500MB free space
- **OS**: Windows, macOS, or Linux

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/ajaykrishnavemula/CampusPass.git
cd CampusPass/backend
```

### 2. Install Dependencies
```bash
npm install
# or
yarn install
```

### 3. Set Up Environment Variables
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your configuration
nano .env  # or use your preferred editor
```

**Required Environment Variables:**
```env
DATABASE_URL=mongodb://localhost:27017/campuspass
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
```

> ⚠️ **Security Warning**: Never commit your `.env` file to version control. Always use strong, randomly generated secrets in production.

### 4. Start MongoDB
```bash
# Using Docker (recommended)
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or start your local MongoDB service
# macOS: brew services start mongodb-community
# Linux: sudo systemctl start mongod
# Windows: net start MongoDB
```

### 5. Build the Project
```bash
npm run build
```

### 6. Start the Server
```bash
# Production mode
npm start

# Development mode (with auto-reload)
npm run dev
```

The server will start on `http://localhost:3000`

### 7. Verify Installation
```bash
# Test the health endpoint
curl http://localhost:3000/api/v1/health

# Expected response:
# {"status":"ok","timestamp":"2024-01-XX..."}
```

---

## 📁 Project Structure

```
backend/
├── src/
│   ├── admin/              # Admin-specific routes and handlers
│   │   ├── api.ts         # Admin API routes
│   │   └── handler.ts     # Admin business logic
│   │
│   ├── class/             # Business logic classes
│   │   ├── permit.ts      # Permit management logic
│   │   ├── student.ts     # Student operations
│   │   ├── warden.ts      # Warden operations
│   │   └── security.ts    # Security operations
│   │
│   ├── components/        # Feature modules
│   │   ├── auth/         # Authentication module
│   │   │   ├── api.ts    # Auth routes
│   │   │   └── handler.ts # Auth logic
│   │   ├── populate/     # Main CRUD operations
│   │   │   ├── api.ts    # CRUD routes
│   │   │   └── handler.ts # CRUD logic
│   │   └── system/       # System management
│   │       ├── api.ts    # System routes
│   │       └── handler.ts # System logic
│   │
│   ├── config/           # Configuration
│   │   └── index.ts      # App configuration
│   │
│   ├── init/             # Initialization
│   │   ├── fastify.ts    # Fastify server setup
│   │   └── loader.ts     # System data loader
│   │
│   ├── model/            # Mongoose models
│   │   └── index.ts      # All data models
│   │
│   ├── plugins/          # Fastify plugins
│   │   └── token.ts      # JWT plugin
│   │
│   ├── routes/           # Route registration
│   │   └── index.ts      # Main router
│   │
│   ├── types/            # TypeScript types
│   │   └── index.ts      # Type definitions
│   │
│   └── index.ts          # Application entry point
│
├── dist/                 # Compiled JavaScript (generated)
├── .env.example          # Environment variables template
├── .gitignore           # Git ignore rules
├── package.json         # Project dependencies
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication
All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

### API Endpoints

#### Authentication
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "id": "student123",
  "password": "password123"
}

Response: 200 OK
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "student123",
    "name": "John Doe",
    "role": "student"
  }
}
```

#### Create Outpass (Student)
```http
POST /api/v1/permits
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "student123",
  "name": "John Doe",
  "phoneNumber": "9876543210",
  "outTime": "2024-01-15T10:00:00Z",
  "inTime": "2024-01-15T18:00:00Z",
  "purpose": 1,
  "hostel": "h1"
}

Response: 201 Created
{
  "message": "Permit created successfully",
  "permit": {
    "id": "permit123",
    "status": "approved",
    "autoApproved": true
  }
}
```

#### Verify Outpass (Security)
```http
POST /api/v1/permits/verify
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "permit123",
  "type": 0,
  "outApprovedBy": "security001"
}

Response: 200 OK
{
  "message": "Permit verified successfully",
  "permit": {
    "id": "permit123",
    "outVerified": true,
    "outApprovedBy": "security001"
  }
}
```

#### Get Outgoing Students (Warden/Security)
```http
GET /api/v1/permits/outgoing?date=2024-01-15&hostel=h1
Authorization: Bearer <token>

Response: 200 OK
{
  "students": [
    {
      "id": "student123",
      "name": "John Doe",
      "outTime": "2024-01-15T10:00:00Z",
      "purpose": "Medical",
      "status": "out"
    }
  ],
  "count": 1
}
```

#### Add Remark (Warden)
```http
POST /api/v1/permits/remark
Authorization: Bearer <token>
Content-Type: application/json

{
  "id": "student123"
}

Response: 200 OK
{
  "message": "Remark added successfully",
  "student": {
    "id": "student123",
    "remarks": 1,
    "status": true
  }
}
```

### Purpose Codes
```typescript
0: Personal
1: Medical
2: Home
3: Shopping
4: Emergency
5: Other
```

### Hostel Codes
```typescript
h1: Hostel 1
h2: Hostel 2
h3: Hostel 3
h4: Hostel 4
```

For complete API documentation, see [API_REFERENCE.md](../API_REFERENCE.md)

---

## ⚙️ Configuration

### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `NODE_ENV` | No | `development` | Environment mode |
| `PORT` | No | `3000` | Server port |
| `HOST` | No | `127.0.0.1` | Server host |
| `DATABASE_URL` | **Yes** | - | MongoDB connection string |
| `JWT_SECRET` | **Yes** | - | JWT signing secret (min 32 chars) |
| `JWT_EXPIRES` | No | `30d` | JWT token expiration |
| `JWT_REFRESH_SECRET` | No | Same as JWT_SECRET | Refresh token secret |
| `JWT_REFRESH_EXPIRES` | No | `90d` | Refresh token expiration |
| `API_PREFIX` | No | `/api/v1` | API route prefix |
| `CORS_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origins |
| `RATE_LIMIT_MAX` | No | `100` | Max requests per window |
| `RATE_LIMIT_WINDOW` | No | `15m` | Rate limit time window |
| `LOG_LEVEL` | No | `info` | Logging level |

### Database Configuration

**Development:**
```env
DATABASE_URL=mongodb://localhost:27017/campuspass
```

**Production (MongoDB Atlas):**
```env
DATABASE_URL=mongodb+srv://username:password@cluster.mongodb.net/campuspass?retryWrites=true&w=majority
```

### Generating Secure Secrets

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Output: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## 🔐 Security

### Current Security Features
- ✅ JWT-based authentication
- ✅ Password hashing with bcryptjs
- ✅ CORS protection
- ✅ Security headers (Helmet)
- ✅ Environment variable configuration

### Security Best Practices

1. **Never commit secrets**: Always use `.env` files and add them to `.gitignore`
2. **Use strong passwords**: Minimum 8 characters with mixed case, numbers, and symbols
3. **Rotate secrets regularly**: Change JWT secrets periodically in production
4. **Use HTTPS**: Always use SSL/TLS in production
5. **Keep dependencies updated**: Regularly update npm packages

### Known Security Issues (To Be Fixed)

⚠️ **Critical Issues:**
- [ ] No input validation on API endpoints
- [ ] No rate limiting implemented
- [ ] Missing error handling middleware
- [ ] No request sanitization

See [QUICK_START_IMPLEMENTATION_GUIDE.md](../QUICK_START_IMPLEMENTATION_GUIDE.md) for fixes.

---

## 💻 Development

### Development Mode
```bash
# Install dependencies
npm install

# Start with auto-reload
npm run dev

# The server will restart automatically on file changes
```

### Building for Production
```bash
# Compile TypeScript to JavaScript
npm run build

# Output will be in ./dist directory
```

### Code Style
- Use TypeScript for type safety
- Follow ESLint rules (when configured)
- Use meaningful variable names
- Add JSDoc comments for functions
- Keep functions small and focused

### Adding New Features

1. **Create a new component**:
```bash
mkdir src/components/notifications
touch src/components/notifications/api.ts
touch src/components/notifications/handler.ts
```

2. **Define routes** in `api.ts`:
```typescript
import { FastifyInstance } from 'fastify';
import { sendNotification } from './handler';

export default async (fastify: FastifyInstance) => {
  fastify.post('/notifications', async (request, reply) => {
    const result = await sendNotification(request.body);
    return reply.send(result);
  });
};
```

3. **Implement logic** in `handler.ts`:
```typescript
export const sendNotification = async (data: any) => {
  // Your logic here
  return { success: true };
};
```

4. **Register routes** in `src/routes/index.ts`:
```typescript
import notifications from '../components/notifications/api';

export default (fastify: FastifyInstance) => {
  fastify.register(notifications, { prefix: '/notifications' });
};
```

---

## 🚀 Deployment

### Using Docker

1. **Create Dockerfile**:
```dockerfile
FROM node:14-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install --production
COPY . .
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

2. **Build and run**:
```bash
docker build -t campuspass .
docker run -p 3000:3000 --env-file .env campuspass
```

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start the application
pm2 start dist/src/index.js --name campuspass

# View logs
pm2 logs campuspass

# Restart
pm2 restart campuspass

# Stop
pm2 stop campuspass
```

### Deployment Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure MongoDB Atlas or production database
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring (Sentry, LogRocket)
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline
- [ ] Enable rate limiting
- [ ] Configure logging

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Contribution Guidelines
- Write clear commit messages
- Add tests for new features
- Update documentation
- Follow existing code style
- Ensure all tests pass

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors

**Ajay Krishna**
- Email: ajaykrishnatech@gmail.com
- GitHub: [@ajaykrishnavemula](https://github.com/ajaykrishnavemula)

---

## 🙏 Acknowledgments

- [Fastify](https://www.fastify.io/) - Fast and low overhead web framework
- [MongoDB](https://www.mongodb.com/) - NoSQL database
- [TypeScript](https://www.typescriptlang.org/) - Typed JavaScript
- All contributors and supporters

---

## 📞 Support

For support and questions:
- **Email**: ajaykrishnatech@gmail.com
- **Issues**: [GitHub Issues](https://github.com/ajaykrishnavemula/CampusPass/issues)
- **Documentation**: See the `/docs` folder for detailed guides

---

## 🗺️ Roadmap

See [COMPREHENSIVE_ENHANCEMENT_PLAN.md](../COMPREHENSIVE_ENHANCEMENT_PLAN.md) for the complete roadmap including:
- Security enhancements
- New features (notifications, QR codes, analytics)
- Mobile applications
- Testing infrastructure
- Performance optimization

---

## 📊 Project Status

**Current Version**: 1.0.1  
**Status**: Active Development  
**Last Updated**: January 2024

### Quick Stats
- **Lines of Code**: ~2,000+
- **API Endpoints**: 15+
- **User Roles**: 4
- **Test Coverage**: 0% (needs improvement)

---

## 🔗 Related Documentation

- [Project Analysis](../CAMPUSPASS_PROJECT_ANALYSIS.md) - Detailed technical analysis
- [Enhancement Plan](../COMPREHENSIVE_ENHANCEMENT_PLAN.md) - 12-week improvement roadmap
- [Implementation Guide](../IMPLEMENTATION_STEPS.md) - Complete setup guide
- [API Reference](../API_REFERENCE.md) - Full API documentation

---

**Made with ❤️ by Ajay Krishna**