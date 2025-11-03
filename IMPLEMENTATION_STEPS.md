# CampusPass Implementation Steps

> **Step-by-step guide to implement all pending improvements**

This document provides detailed, actionable steps to complete all pending tasks for the CampusPass project.

---

## 📋 Overview

**Pending Tasks:**
1. ✅ Input validation with Joi (code created, needs installation)
2. ⏳ Rate limiting middleware
3. ⏳ Testing infrastructure
4. ⏳ Production deployment configuration

---

## 🔧 Step 1: Install Required Dependencies

### 1.1 Install Joi for Validation

```bash
cd CampusPass/backend

# Install Joi and its types
npm install joi
npm install --save-dev @types/joi

# Verify installation
npm list joi
```

### 1.2 Install Rate Limiting Package

```bash
# Install Fastify rate limit plugin
npm install @fastify/rate-limit

# Verify installation
npm list @fastify/rate-limit
```

### 1.3 Install Testing Dependencies

```bash
# Install Jest and related packages
npm install --save-dev jest @types/jest ts-jest

# Install testing utilities
npm install --save-dev supertest @types/supertest

# Install MongoDB memory server for testing
npm install --save-dev mongodb-memory-server

# Verify installation
npm list jest
```

### 1.4 Update package.json Scripts

Add these scripts to [`package.json`](backend/package.json):

```json
{
  "scripts": {
    "tsc": "tsc",
    "build": "tsc && node ./dist/src/index.js",
    "start": "node ./dist/src/index.js",
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "test": "jest --coverage",
    "test:watch": "jest --watch",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "lint": "eslint . --ext .ts",
    "lint:fix": "eslint . --ext .ts --fix"
  }
}
```

---

## 🔐 Step 2: Implement Input Validation

### 2.1 Validation Utilities (Already Created)

The validation utilities are already created in:
- [`src/utils/validators.ts`](backend/src/utils/validators.ts)

This file includes:
- ✅ Login validation schema
- ✅ Create permit schema
- ✅ Update permit schema
- ✅ Verify permit schema
- ✅ Remark schema
- ✅ Set status schema
- ✅ Outgoing students schema
- ✅ Validation middleware factory

### 2.2 Apply Validation to Auth Routes

Update [`src/components/auth/api.ts`](backend/src/components/auth/api.ts):

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { login } from './handler';
import { validate, loginSchema } from '../../utils/validators';

export default async (fastify: FastifyInstance) => {
  // Login endpoint with validation
  fastify.post(
    '/login',
    {
      preHandler: validate(loginSchema, 'body'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code, response } = await login(request.body as any, fastify.jwt.sign);
      return reply.code(code).send(response);
    }
  );
};
```

### 2.3 Apply Validation to Populate Routes

Update [`src/components/populate/api.ts`](backend/src/components/populate/api.ts):

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import {
  createPass,
  verifyPass,
  remark,
  setStatus,
  getOutgoingStudents,
  getStudentsUnderWarden,
  getProfile,
  getLocationStatus,
  getAllowanceForPass,
  PendingPermits,
  DeletePass,
  UpdatePass,
} from './handler';
import {
  validate,
  createPermitSchema,
  updatePermitSchema,
  verifyPermitSchema,
  remarkSchema,
  setStatusSchema,
  outgoingStudentsSchema,
  idParamSchema,
  hostelParamSchema,
} from '../../utils/validators';

export default async (fastify: FastifyInstance) => {
  // Create permit with validation
  fastify.post(
    '/permits',
    {
      preHandler: validate(createPermitSchema, 'body'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code, response } = await createPass(request.body as any);
      return reply.code(code).send(response);
    }
  );

  // Update permit with validation
  fastify.patch(
    '/permits/:id',
    {
      preHandler: [
        validate(idParamSchema, 'params'),
        validate(updatePermitSchema, 'body'),
      ],
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { code, response } = await UpdatePass(request.params.id, request.body);
      return reply.code(code).send(response);
    }
  );

  // Verify permit with validation
  fastify.post(
    '/permits/verify',
    {
      preHandler: validate(verifyPermitSchema, 'body'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { id, ...payload } = request.body as any;
      const { code, response } = await verifyPass(id, payload);
      return reply.code(code).send(response);
    }
  );

  // Add remark with validation
  fastify.post(
    '/permits/remark',
    {
      preHandler: validate(remarkSchema, 'body'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code, response } = await remark(request.body as any);
      return reply.code(code).send(response);
    }
  );

  // Set status with validation
  fastify.post(
    '/permits/status',
    {
      preHandler: validate(setStatusSchema, 'body'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code, response } = await setStatus(request.body as any);
      return reply.code(code).send(response);
    }
  );

  // Get outgoing students with validation
  fastify.get(
    '/permits/outgoing',
    {
      preHandler: validate(outgoingStudentsSchema, 'query'),
    },
    async (request: FastifyRequest, reply: FastifyReply) => {
      const { code, response } = await getOutgoingStudents(request.query as any);
      return reply.code(code).send(response);
    }
  );

  // Get students under warden with validation
  fastify.get(
    '/students/:hostel',
    {
      preHandler: validate(hostelParamSchema, 'params'),
    },
    async (request: FastifyRequest<{ Params: { hostel: string } }>, reply: FastifyReply) => {
      const { code, response } = await getStudentsUnderWarden(request.params.hostel);
      return reply.code(code).send(response);
    }
  );

  // Get profile with validation
  fastify.get(
    '/profile/:id',
    {
      preHandler: validate(idParamSchema, 'params'),
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { code, response } = await getProfile(request.params.id);
      return reply.code(code).send(response);
    }
  );

  // Get location status with validation
  fastify.get(
    '/location/:id',
    {
      preHandler: validate(idParamSchema, 'params'),
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { code, response } = await getLocationStatus(request.params.id);
      return reply.code(code).send(response);
    }
  );

  // Get allowance for pass with validation
  fastify.get(
    '/allowance/:id',
    {
      preHandler: validate(idParamSchema, 'params'),
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { code, response} = await getAllowanceForPass(request.params.id);
      return reply.code(code).send(response);
    }
  );

  // Approve pending permit with validation
  fastify.patch(
    '/permits/:id/approve',
    {
      preHandler: validate(idParamSchema, 'params'),
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { code, response } = await PendingPermits(request.params.id);
      return reply.code(code).send(response);
    }
  );

  // Delete permit with validation
  fastify.delete(
    '/permits/:id',
    {
      preHandler: validate(idParamSchema, 'params'),
    },
    async (request: FastifyRequest<{ Params: { id: string } }>, reply: FastifyReply) => {
      const { code, response } = await DeletePass(request.params.id);
      return reply.code(code).send(response);
    }
  );
};
```

---

## 🚦 Step 3: Implement Rate Limiting

### 3.1 Create Rate Limit Configuration

Create [`src/config/rate-limit.ts`](backend/src/config/rate-limit.ts):

```typescript
/**
 * @author AjayKrishna
 * @summary Rate limiting configuration
 */

import config from './index';

export const rateLimitConfig = {
  global: {
    max: config.rateLimit.max,
    timeWindow: config.rateLimit.window,
    errorResponseBuilder: (request: any, context: any) => {
      return {
        error: 'Too Many Requests',
        message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        statusCode: 429,
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
  },
  
  // Stricter limits for authentication endpoints
  auth: {
    max: 5,
    timeWindow: '15m',
    errorResponseBuilder: (request: any, context: any) => {
      return {
        error: 'Too Many Login Attempts',
        message: `Too many login attempts. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        statusCode: 429,
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
  },
  
  // Moderate limits for permit creation
  permits: {
    max: 10,
    timeWindow: '1h',
    errorResponseBuilder: (request: any, context: any) => {
      return {
        error: 'Too Many Permit Requests',
        message: `Too many permit creation attempts. Try again in ${Math.ceil(context.ttl / 1000)} seconds.`,
        statusCode: 429,
        retryAfter: Math.ceil(context.ttl / 1000),
      };
    },
  },
};

export default rateLimitConfig;
```

### 3.2 Update Fastify Initialization

Update [`src/init/fastify.ts`](backend/src/init/fastify.ts) to include rate limiting:

```typescript
import Fastify from 'fastify';
import mongoose from 'mongoose';
import config from '../config';
import authPlugin from '../plugins/token';
import routes from '../routes';
import fastifyCors from '@fastify/cors';
import fastifyHelmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import logger from '../utils/logger';
import systemLoader from './loader';
import rateLimitConfig from '../config/rate-limit';

export default async () => {
  try {
    const server = Fastify({ 
      logger: config.environment === 'development',
      trustProxy: true,
    });

    // Security plugins
    server.register(fastifyHelmet, {
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    });

    server.register(fastifyCors, {
      origin: config.cors.origin,
      credentials: true,
    });

    // Global rate limiting
    server.register(rateLimit, rateLimitConfig.global);

    // Auth plugin
    server.register(authPlugin);

    // Routes
    routes(server);

    // Database connection
    mongoose.set('strictQuery', true);
    await mongoose.connect(config.db.url);
    logger.info('Database connected successfully');

    // System loader
    await systemLoader();

    // Request logging
    server.addHook('onRequest', (req, reply, done) => {
      logger.debug(`Request received ${req.method} ${req.url}`, {
        body: req.body,
        query: req.query,
        ip: req.ip,
      });
      done();
    });

    // Error handler
    server.setErrorHandler((error, request, reply) => {
      logger.error('Error occurred:', {
        error: error.message,
        stack: error.stack,
        url: request.url,
        method: request.method,
      });

      // Don't expose internal errors in production
      if (config.environment === 'production') {
        reply.code(500).send({
          error: 'Internal Server Error',
          message: 'An unexpected error occurred',
        });
      } else {
        reply.code(500).send({
          error: error.name,
          message: error.message,
          stack: error.stack,
        });
      }
    });

    // Start server
    server.listen(
      { host: config.host, port: config.serverPort },
      function (err, address) {
        if (err) {
          server.log.error(err);
          process.exit(1);
        }
        logger.info(`Server listening on ${address}`);
      }
    );
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};
```

---

## 🧪 Step 4: Set Up Testing Infrastructure

### 4.1 Create Jest Configuration

Create [`jest.config.js`](backend/jest.config.js):

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.interface.ts',
    '!src/types/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  verbose: true,
  testTimeout: 30000,
};
```

### 4.2 Create Test Setup File

Create [`tests/setup.ts`](backend/tests/setup.ts):

```typescript
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

let mongoServer: MongoMemoryServer;

// Setup before all tests
beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  const mongoUri = mongoServer.getUri();
  await mongoose.connect(mongoUri);
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Clear database between tests
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    await collections[key].deleteMany({});
  }
});
```

### 4.3 Create Sample Unit Tests

Create [`tests/unit/validators.test.ts`](backend/tests/unit/validators.test.ts):

```typescript
import {
  loginSchema,
  createPermitSchema,
  verifyPermitSchema,
} from '../../src/utils/validators';

describe('Validation Schemas', () => {
  describe('loginSchema', () => {
    it('should validate correct login data', async () => {
      const validData = {
        id: 'student123',
        password: 'password123',
      };

      const result = await loginSchema.validateAsync(validData);
      expect(result).toEqual(validData);
    });

    it('should reject login with short ID', async () => {
      const invalidData = {
        id: 'ab',
        password: 'password123',
      };

      await expect(loginSchema.validateAsync(invalidData)).rejects.toThrow();
    });

    it('should reject login with short password', async () => {
      const invalidData = {
        id: 'student123',
        password: '12345',
      };

      await expect(loginSchema.validateAsync(invalidData)).rejects.toThrow();
    });
  });

  describe('createPermitSchema', () => {
    it('should validate correct permit data', async () => {
      const validData = {
        id: 'student123',
        name: 'John Doe',
        phoneNumber: '9876543210',
        outTime: new Date('2024-01-15T10:00:00Z'),
        inTime: new Date('2024-01-15T18:00:00Z'),
        purpose: 1,
        hostel: 'h1',
      };

      const result = await createPermitSchema.validateAsync(validData);
      expect(result.id).toBe(validData.id);
      expect(result.name).toBe(validData.name);
    });

    it('should reject permit with invalid phone number', async () => {
      const invalidData = {
        id: 'student123',
        name: 'John Doe',
        phoneNumber: '123', // Invalid
        outTime: new Date('2024-01-15T10:00:00Z'),
        inTime: new Date('2024-01-15T18:00:00Z'),
        purpose: 1,
        hostel: 'h1',
      };

      await expect(createPermitSchema.validateAsync(invalidData)).rejects.toThrow();
    });

    it('should reject permit with inTime before outTime', async () => {
      const invalidData = {
        id: 'student123',
        name: 'John Doe',
        phoneNumber: '9876543210',
        outTime: new Date('2024-01-15T18:00:00Z'),
        inTime: new Date('2024-01-15T10:00:00Z'), // Before outTime
        purpose: 1,
        hostel: 'h1',
      };

      await expect(createPermitSchema.validateAsync(invalidData)).rejects.toThrow();
    });
  });
});
```

### 4.4 Create Sample Integration Tests

Create [`tests/integration/auth.test.ts`](backend/tests/integration/auth.test.ts):

```typescript
import Fastify from 'fastify';
import authRoutes from '../../src/components/auth/api';
import { User } from '../../src/model';
import { hashPassword } from '../../src/utils/hash';

describe('Auth Integration Tests', () => {
  let app: any;

  beforeAll(async () => {
    app = Fastify();
    app.register(authRoutes, { prefix: '/auth' });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('POST /auth/login', () => {
    it('should login with valid credentials', async () => {
      // Create test user
      const hashedPassword = await hashPassword('password123');
      await User.create({
        id: 'testuser',
        password: hashedPassword,
        role: 0,
      });

      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          id: 'testuser',
          password: 'password123',
        },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json()).toHaveProperty('token');
    });

    it('should reject login with invalid credentials', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          id: 'nonexistent',
          password: 'wrongpassword',
        },
      });

      expect(response.statusCode).toBe(404);
    });

    it('should reject login with invalid data format', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          id: 'ab', // Too short
          password: '123', // Too short
        },
      });

      expect(response.statusCode).toBe(400);
      expect(response.json()).toHaveProperty('error', 'Validation Error');
    });
  });
});
```

---

## 🚀 Step 5: Production Deployment Configuration

### 5.1 Create Dockerfile

Create [`Dockerfile`](backend/Dockerfile):

```dockerfile
# Build stage
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY . .

# Build TypeScript
RUN npm run tsc

# Production stage
FROM node:18-alpine

WORKDIR /app

# Copy built files and dependencies
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

USER nodejs

EXPOSE 3000

CMD ["node", "dist/src/index.js"]
```

### 5.2 Create Docker Compose

Create [`docker-compose.yml`](backend/docker-compose.yml):

```yaml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://mongo:27017/campuspass
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
    depends_on:
      - mongo
    restart: unless-stopped

  mongo:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongo-data:/data/db
    restart: unless-stopped

volumes:
  mongo-data:
```

### 5.3 Create PM2 Ecosystem File

Create [`ecosystem.config.js`](backend/ecosystem.config.js):

```javascript
module.exports = {
  apps: [{
    name: 'campuspass',
    script: './dist/src/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    autorestart: true,
    watch: false,
  }],
};
```

### 5.4 Create GitHub Actions CI/CD

Create [`.github/workflows/ci.yml`](backend/.github/workflows/ci.yml):

```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main, develop ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [16.x, 18.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run linter
      run: npm run lint
    
    - name: Run tests
      run: npm test
    
    - name: Upload coverage
      uses: codecov/codecov-action@v3
      with:
        files: ./coverage/lcov.info

  build:
    needs: test
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Build Docker image
      run: docker build -t campuspass:latest .
```

---

## ✅ Verification Checklist

After completing all steps, verify:

### Dependencies
- [ ] Joi installed and working
- [ ] @fastify/rate-limit installed
- [ ] Jest and testing dependencies installed
- [ ] All TypeScript errors resolved

### Validation
- [ ] Validation schemas created
- [ ] Validation applied to all routes
- [ ] Error messages are user-friendly
- [ ] Test validation with invalid data

### Rate Limiting
- [ ] Global rate limiting active
- [ ] Auth endpoints have stricter limits
- [ ] Rate limit errors are clear
- [ ] Test rate limiting behavior

### Testing
- [ ] Jest configuration complete
- [ ] Unit tests written and passing
- [ ] Integration tests written and passing
- [ ] Coverage reports generated
- [ ] Target: 80%+ coverage

### Deployment
- [ ] Dockerfile created and tested
- [ ] Docker Compose working
- [ ] PM2 configuration ready
- [ ] CI/CD pipeline configured
- [ ] Environment variables documented

---

## 📞 Need Help?

If you encounter issues:
1. Check the error messages carefully
2. Review the [QUICK_START_IMPLEMENTATION_GUIDE.md](QUICK_START_IMPLEMENTATION_GUIDE.md)
3. Consult the [PROJECT_INDEX.md](PROJECT_INDEX.md)
4. Open an issue on GitHub
5. Contact: ajaykrishnatech@gmail.com

---

**Next Steps**: Follow this guide step-by-step to complete all pending tasks!