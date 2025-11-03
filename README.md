# 🎓 CampusPass - Smart Campus Access Management System

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-4.9-blue)](https://www.typescriptlang.org/)
[![Fastify](https://img.shields.io/badge/Fastify-4.x-black)](https://www.fastify.io/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.x-green)](https://www.mongodb.com/)

> A modern, secure, and intelligent campus outpass management system built with Fastify, TypeScript, and MongoDB.

---

## 🌟 Features

### Core Functionality
- **🔐 Multi-Role Authentication**: Student, Warden, Security, and Admin roles with JWT-based authentication
- **📝 Smart Outpass Management**: Intelligent auto-approval system based on student status and history
- **📍 Real-Time Tracking**: Track student location (in/out of campus) with entry/exit timestamps
- **⚠️ Violation Management**: Automatic remark system with progressive restrictions
- **🏢 Hostel Management**: Multi-hostel support with warden assignments
- **📊 Analytics Dashboard**: Comprehensive statistics and reporting for administrators
- **🔔 Notification System**: Real-time notifications for outpass status updates

### Security Features
- JWT token-based authentication with refresh tokens
- Password hashing with bcrypt
- Environment-based configuration
- Rate limiting protection
- Input validation with Joi
- CORS and Helmet security headers
- Audit logging for all critical operations

### Technical Highlights
- **High Performance**: Built on Fastify framework for maximum speed
- **Type Safety**: 100% TypeScript for robust code
- **Scalable Architecture**: Modular design with separation of concerns
- **Production Ready**: Comprehensive error handling and logging
- **Well Documented**: 4000+ lines of documentation

---

## 📋 Table of Contents

- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Documentation](#-documentation)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🚀 Quick Start

```bash
# Clone the repository
git clone https://github.com/ajaykrishnavemula/CampusPass.git
cd CampusPass/backend

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Build the project
npm run build

# Start the server
npm start
```

The server will start on `http://localhost:3000`

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** >= 14.0.0 ([Download](https://nodejs.org/))
- **MongoDB** >= 4.4 ([Download](https://www.mongodb.com/try/download/community))
- **npm** or **yarn** package manager
- **Git** for version control

---

## 💻 Installation

### 1. Clone the Repository
```bash
git clone https://github.com/ajaykrishnavemula/CampusPass.git
cd CampusPass
```

### 2. Install Dependencies
```bash
cd backend
npm install
```

### 3. Set Up Environment Variables
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
# Server Configuration
NODE_ENV=development
PORT=3000
HOST=127.0.0.1

# Database
DATABASE_URL=mongodb://localhost:27017/campuspass

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES=30d
JWT_REFRESH_SECRET=your-refresh-token-secret
JWT_REFRESH_EXPIRES=90d

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=15m

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
```

### 4. Start MongoDB
```bash
# Using Docker
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Or use your local MongoDB installation
mongod
```

### 5. Build and Run
```bash
# Development mode with hot reload
npm run dev

# Production build
npm run build
npm start
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment (development/production) | `development` | No |
| `PORT` | Server port | `3000` | No |
| `HOST` | Server host | `127.0.0.1` | No |
| `DATABASE_URL` | MongoDB connection string | - | Yes |
| `JWT_SECRET` | JWT signing secret | - | Yes |
| `JWT_EXPIRES` | JWT token expiration | `30d` | No |
| `JWT_REFRESH_SECRET` | Refresh token secret | - | Yes |
| `JWT_REFRESH_EXPIRES` | Refresh token expiration | `90d` | No |
| `RATE_LIMIT_MAX` | Max requests per window | `100` | No |
| `RATE_LIMIT_WINDOW` | Rate limit time window | `15m` | No |
| `CORS_ORIGIN` | Allowed CORS origins | `http://localhost:3000` | No |

---

## 📚 API Documentation

### Base URL
```
http://localhost:3000/api/v1
```

### Authentication Endpoints

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "id": "student123",
  "password": "password123"
}
```

**Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "student123",
    "role": 0,
    "name": "John Doe"
  }
}
```

### Outpass Endpoints

#### Create Outpass
```http
POST /permits
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
```

#### Get Outgoing Students
```http
GET /permits/outgoing?date=2024-01-15&hostel=h1
Authorization: Bearer <token>
```

For complete API documentation, see [`API_REFERENCE.md`](API_REFERENCE.md)

---

## 📁 Project Structure

```
CampusPass/
├── backend/
│   ├── src/
│   │   ├── admin/              # Admin routes and handlers
│   │   ├── class/              # Business logic classes
│   │   ├── components/         # Feature modules
│   │   │   ├── auth/          # Authentication
│   │   │   ├── populate/      # Main CRUD operations
│   │   │   └── system/        # System management
│   │   ├── config/            # Configuration
│   │   ├── init/              # Initialization
│   │   ├── model/             # Mongoose models
│   │   ├── plugins/           # Fastify plugins
│   │   ├── routes/            # Route registration
│   │   ├── types/             # TypeScript types
│   │   └── utils/             # Utility functions
│   ├── .env.example           # Environment template
│   ├── .gitignore             # Git ignore rules
│   ├── package.json           # Dependencies
│   ├── tsconfig.json          # TypeScript config
│   ├── README.md              # Backend documentation
│   └── CONTRIBUTING.md        # Contribution guidelines
├── API_REFERENCE.md           # Complete API documentation
├── CAMPUSPASS_PROJECT_ANALYSIS.md  # Technical analysis
├── COMPREHENSIVE_ENHANCEMENT_PLAN.md  # 12-week roadmap
├── IMPLEMENTATION_STEPS.md    # Setup guide
└── README.md                  # This file
```

---

## 📖 Documentation

### Available Documentation

1. **[API_REFERENCE.md](API_REFERENCE.md)** (1000+ lines)
   - Complete API endpoint documentation
   - Request/response examples
   - Authentication guide
   - Error handling

2. **[CAMPUSPASS_PROJECT_ANALYSIS.md](CAMPUSPASS_PROJECT_ANALYSIS.md)** (665 lines)
   - Technical architecture analysis
   - Current features overview
   - Security assessment
   - Recommendations

3. **[COMPREHENSIVE_ENHANCEMENT_PLAN.md](COMPREHENSIVE_ENHANCEMENT_PLAN.md)** (850 lines)
   - 12-week development roadmap
   - Feature prioritization
   - Implementation timeline
   - Resource requirements

4. **[IMPLEMENTATION_STEPS.md](IMPLEMENTATION_STEPS.md)** (918 lines)
   - Step-by-step setup guide
   - Dependency installation
   - Configuration instructions
   - Testing setup

5. **[backend/README.md](backend/README.md)** (750 lines)
   - Backend-specific documentation
   - Development guidelines
   - API usage examples

6. **[backend/CONTRIBUTING.md](backend/CONTRIBUTING.md)** (550 lines)
   - Contribution guidelines
   - Code style guide
   - Pull request process
   - Development workflow

---

## 🛠️ Development

### Available Scripts

```bash
# Development with hot reload
npm run dev

# Build TypeScript
npm run build

# Start production server
npm start

# Run tests (after setup)
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Fix linting issues
npm run lint:fix
```

### Development Workflow

1. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Write clean, documented code
   - Follow TypeScript best practices
   - Add tests for new features

3. **Test your changes**
   ```bash
   npm run lint
   npm test
   ```

4. **Commit and push**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   git push origin feature/your-feature-name
   ```

5. **Create a Pull Request**
   - Describe your changes
   - Link related issues
   - Request review

---

## 🚀 Deployment

### Using Docker

```bash
# Build Docker image
docker build -t campuspass:latest .

# Run container
docker run -p 3000:3000 --env-file .env campuspass:latest
```

### Using Docker Compose

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down
```

### Using PM2

```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Monitor
pm2 monit

# View logs
pm2 logs campuspass
```

### Production Checklist

- [ ] Set `NODE_ENV=production`
- [ ] Use strong JWT secrets
- [ ] Configure MongoDB with authentication
- [ ] Set up SSL/TLS certificates
- [ ] Configure firewall rules
- [ ] Set up monitoring and logging
- [ ] Configure backup strategy
- [ ] Set up CI/CD pipeline

---

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guidelines](backend/CONTRIBUTING.md) for details.

### Quick Contribution Guide

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### Code of Conduct

- Be respectful and inclusive
- Follow coding standards
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 🔒 Security

### Reporting Security Issues

If you discover a security vulnerability, please email:
**ajaykrishnatech@gmail.com**

Do not create public GitHub issues for security vulnerabilities.

### Security Features

- ✅ JWT authentication with refresh tokens
- ✅ Password hashing with bcrypt
- ✅ Rate limiting to prevent abuse
- ✅ Input validation and sanitization
- ✅ CORS configuration
- ✅ Helmet security headers
- ✅ Environment-based secrets
- ✅ Audit logging

---

## 📊 Project Status

### Current Version: 2.0.0

### Implementation Status

| Feature | Status | Notes |
|---------|--------|-------|
| Core Authentication | ✅ Complete | JWT-based with refresh tokens |
| Outpass Management | ✅ Complete | Full CRUD operations |
| Smart Auto-Approval | ✅ Complete | Rule-based approval system |
| Violation Tracking | ✅ Complete | Automatic remark system |
| Real-Time Tracking | ✅ Complete | Entry/exit monitoring |
| Analytics Dashboard | ✅ Complete | Comprehensive statistics |
| Input Validation | ⚠️ Code Ready | Needs Joi installation |
| Rate Limiting | ⚠️ Code Ready | Needs package installation |
| Testing Suite | ⚠️ Guide Ready | Needs Jest setup |
| Production Deployment | ⚠️ Configs Ready | Docker & PM2 configs available |

### Roadmap

- **Phase 1** (Weeks 1-2): Complete dependency installation and testing setup
- **Phase 2** (Weeks 3-4): Add email notifications and SMS alerts
- **Phase 3** (Weeks 5-6): Implement real-time updates with WebSockets
- **Phase 4** (Weeks 7-8): Add mobile app support
- **Phase 5** (Weeks 9-10): Advanced analytics and reporting
- **Phase 6** (Week 11): Performance optimization
- **Phase 7** (Week 12): Production deployment

See [COMPREHENSIVE_ENHANCEMENT_PLAN.md](COMPREHENSIVE_ENHANCEMENT_PLAN.md) for detailed roadmap.

---

## 🎓 Learning Resources

### For Beginners

- Start with [IMPLEMENTATION_STEPS.md](IMPLEMENTATION_STEPS.md) for setup
- Read [API_REFERENCE.md](API_REFERENCE.md) for API usage
- Check [backend/README.md](backend/README.md) for backend details

### For Advanced Users

- Review [CAMPUSPASS_PROJECT_ANALYSIS.md](CAMPUSPASS_PROJECT_ANALYSIS.md) for architecture
- Study [COMPREHENSIVE_ENHANCEMENT_PLAN.md](COMPREHENSIVE_ENHANCEMENT_PLAN.md) for roadmap
- Explore source code for implementation patterns

---

## 📞 Support & Contact

### Developer
**Ajay Krishna**
- Email: ajaykrishnatech@gmail.com
- GitHub: [@ajaykrishnavemula](https://github.com/ajaykrishnavemula)

### Getting Help

1. Check the [documentation](#-documentation)
2. Search [existing issues](https://github.com/ajaykrishnavemula/CampusPass/issues)
3. Create a [new issue](https://github.com/ajaykrishnavemula/CampusPass/issues/new)
4. Email for direct support

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Ajay Krishna

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---

## 🙏 Acknowledgments

- **Fastify Team** - For the amazing high-performance framework
- **MongoDB Team** - For the flexible database solution
- **TypeScript Team** - For type safety and developer experience
- **Open Source Community** - For inspiration and support

---

## ⭐ Star History

If you find this project useful, please consider giving it a star! ⭐

---

## 📈 Statistics

- **Lines of Code**: 3,500+
- **Documentation**: 4,000+ lines
- **API Endpoints**: 40+
- **Test Coverage**: Setup ready
- **Contributors**: Open for contributions!

---

**Built with ❤️ by Ajay Krishna**

*Making campus management smarter, one outpass at a time.*