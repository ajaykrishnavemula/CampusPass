export { connectDatabase } from './database';
export { logger } from '../utils/logger';

// Application configuration
export const config = {
  port: parseInt(process.env.PORT || '5000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/campus-pass',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  
  // Email configuration
  email: {
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT || '587'),
    user: process.env.EMAIL_USER || '',
    password: process.env.EMAIL_PASSWORD || '',
    from: process.env.EMAIL_FROM || 'noreply@campuspass.com',
  },
  
  // Rate limiting
  rateLimit: {
    max: parseInt(process.env.RATE_LIMIT_MAX || '1000'),
    timeWindow: parseInt(process.env.RATE_LIMIT_TIMEWINDOW || '60000'), // 1 minute
  },
  
  // File upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '5242880'), // 5MB
    uploadDir: process.env.UPLOAD_DIR || './uploads',
    allowedTypes: ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'],
  },
  
  // Pagination
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },
  
  // QR Code
  qr: {
    errorCorrectionLevel: 'M' as const,
    type: 'image/png' as const,
    quality: 0.92,
    margin: 1,
    width: 300,
  },
  
  // PDF
  pdf: {
    pageSize: 'A4' as const,
    margin: 50,
  },
};

// 