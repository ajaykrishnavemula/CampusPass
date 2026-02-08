# Campus Pass Backend API

Complete backend API for the Campus Pass Management System built with Fastify, TypeScript, MongoDB, and Socket.io.

## 🚀 Features

- **Authentication & Authorization**: JWT-based authentication with role-based access control
- **Real-time Notifications**: Socket.io for instant updates
- **Email Service**: Automated emails with PDF attachments
- **QR Code Generation**: Secure QR codes for outpass verification
- **PDF Generation**: Professional outpass documents
- **Rate Limiting**: Protection against abuse
- **Security**: Helmet, CORS, bcrypt password hashing
- **Logging**: Winston for structured logging
- **Type Safety**: Full TypeScript implementation

## 📋 Prerequisites

- Node.js >= 18.x
- MongoDB >= 6.x
- npm or yarn

## 🛠️ Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Create `.env` file:
```bash
cp .env.example .env
```

3. Configure environment variables in `.env`:
```env
PORT=3000
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/campus-pass
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
FRONTEND_URL=http://localhost:5173
```

## 🏃 Running the Application

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Testing
```bash
npm test
```

## 📁 Project Structure

```
backend/
├── src/
│   ├── config/          # Configuration files
│   ├── controllers/     # Request handlers
│   ├── middleware/      # Custom middleware
│   ├── models/          # MongoDB schemas
│   ├── routes/          # API routes
│   ├── services/        # Business logic
│   ├── types/           # TypeScript types
│   ├── utils/           # Utility functions
│   └── index.ts         # Entry point
├── logs/                # Log files
├── .env.example         # Environment template
├── package.json
├── tsconfig.json
└── README.md
```

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)
- `PUT /api/auth/profile` - Update profile (protected)
- `POST /api/auth/change-password` - Change password (protected)

### Student Routes
- `GET /api/student/dashboard` - Student dashboard stats
- `POST /api/student/outpasses` - Create outpass request
- `GET /api/student/outpasses` - Get all outpasses
- `GET /api/student/outpasses/:id` - Get outpass details
- `PATCH /api/student/outpasses/:id/cancel` - Cancel outpass

### Warden Routes
- `GET /api/warden/dashboard` - Warden dashboard stats
- `GET /api/warden/pending-requests` - Get pending requests
- `GET /api/warden/outpasses` - Get all outpasses
- `GET /api/warden/outpasses/:id` - Get outpass details
- `PATCH /api/warden/outpasses/:id/approve` - Approve outpass
- `PATCH /api/warden/outpasses/:id/reject` - Reject outpass
- `GET /api/warden/overdue` - Get overdue outpasses

### Security Routes
- `GET /api/security/dashboard` - Security dashboard
- `POST /api/security/check-out` - Check out student
- `POST /api/security/check-in` - Check in student
- `POST /api/security/verify-qr` - Verify QR code
- `GET /api/security/active-passes` - Get active outpasses
- `GET /api/security/overdue` - Get overdue outpasses

### Notification Routes
- `GET /api/notifications` - Get all notifications
- `GET /api/notifications/unread-count` - Get unread count
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/read-all` - Mark all as read
- `DELETE /api/notifications/:id` - Delete notification

## 🔐 User Roles

- **Student (0)**: Create and manage own outpasses
- **Admin (1)**: Full system access
- **Warden (2)**: Approve/reject outpass requests
- **Security (3)**: Check-in/check-out students

## 📧 Email Configuration

For Gmail:
1. Enable 2-factor authentication
2. Generate app-specific password
3. Use in EMAIL_PASSWORD

## 🔒 Security Features

- JWT token authentication
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- CORS protection
- Helmet security headers
- Input validation with Zod

## 📊 Database Models

### User
- Authentication and profile information
- Role-based access control
- Student-specific fields (roll number, hostel, etc.)

### Outpass
- Request details (reason, destination, dates)
- Status tracking (pending, approved, rejected, etc.)
- QR code data
- Check-in/check-out timestamps

### Notification
- Real-time notification system
- Read/unread status
- Related outpass reference

## 🔄 Real-time Features

Socket.io events:
- `notification` - New notification
- `outpass:created` - New outpass request
- `outpass:approved` - Outpass approved
- `outpass:rejected` - Outpass rejected
- `outpass:checked-out` - Student checked out
- `outpass:checked-in` - Student checked in

## 📝 Logging

Logs are stored in the `logs/` directory:
- `combined.log` - All logs
- `error.log` - Error logs only

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## 🚀 Deployment

1. Build the application:
```bash
npm run build
```

2. Set production environment variables

3. Start the server:
```bash
npm start
```

## 📄 License

MIT

## 👥 Support

For issues and questions, please open an issue on GitHub.