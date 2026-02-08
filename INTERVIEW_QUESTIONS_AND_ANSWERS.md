
# Campus Pass Project - Interview Questions & Answers

## Table of Contents
1. [Project Overview Questions](#project-overview-questions)
2. [Architecture & Design Questions](#architecture--design-questions)
3. [Security Questions](#security-questions)
4. [Database & Performance Questions](#database--performance-questions)
5. [Frontend Questions](#frontend-questions)
6. [Backend Questions](#backend-questions)
7. [DevOps & Deployment Questions](#devops--deployment-questions)
8. [Problem-Solving & Scenarios](#problem-solving--scenarios)

---

# Project Overview Questions

## Q1: Walk me through your Campus Pass project. What problem does it solve?

**Answer:**
Campus Pass is a digital outpass management system for educational institutions that replaces traditional paper-based processes. 

**Problem it solves:**
- **Inefficiency**: Manual paper-based outpass requests take hours to process
- **Lack of tracking**: No visibility into who's outside campus
- **Security concerns**: Paper passes can be forged or misused
- **No enforcement**: Can't automatically restrict students with overdue returns
- **Poor audit trail**: Difficult to track approval history

**Solution:**
A full-stack web application with:
- **Real-time workflow**: Student requests → Warden approves → QR code generated → Security scans
- **Automated enforcement**: Students with 3+ overdue returns automatically restricted
- **Complete audit trail**: Every action logged with timestamps
- **Role-based access**: 4 user types (Student, Warden, Security, Admin)
- **Real-time notifications**: WebSocket-based instant updates

**Tech Stack:**
- Frontend: React + TypeScript + Tailwind CSS + Zustand
- Backend: Fastify + MongoDB + Socket.IO
- Security: JWT + bcrypt + QR codes

**Impact:**
- Reduced approval time from hours to minutes
- 100% digital audit trail
- Zero paper usage
- Real-time tracking of all students

---

## Q2: What was the most challenging part of this project?

**Answer:**
The most challenging aspect was implementing the **automatic restriction enforcement system** with proper state management.

**Challenge:**
When a student checks in late (overdue), the system needs to:
1. Detect the overdue condition
2. Increment their overdue count
3. If count >= 3, disable their ability to create new outpasses
4. Notify the student in real-time
5. Update all relevant dashboards
6. Maintain data consistency

**Solution Implemented:**
```typescript
// In SecurityService.checkIn()
const isOverdue = checkInTime > outpass.toDate;

if (isOverdue) {
  outpass.status = 'overdue';
  user.overdueCount++;
  
  if (user.overdueCount >= 3) {
    user.canCreateOutpass = false;
  }
  
  // Atomic update - both or neither
  await Promise.all([
    outpass.save(),
    user.save()
  ]);
  
  // Real-time notification
  await NotificationService.create(user._id, 'overdue_warning');
  SocketService.emitToUser(user._id, 'restriction_applied');
}
```

**Key Learnings:**
- Importance of atomic operations for data consistency
- Real-time state synchronization across multiple clients
- Proper error handling for partial failures
- Testing edge cases (exactly 3 overdues, concurrent check-ins)

---

## Q3: How did you handle the real-time notification system?

**Answer:**
I implemented a **WebSocket-based notification system** using Socket.IO with a pub-sub pattern.

**Architecture:**
```
Backend Event → NotificationService → SocketService → 
Frontend Socket Listener → Zustand Store → UI Update
```

**Implementation Details:**

**Backend (Publisher):**
```typescript
// services/NotificationService.ts
export class NotificationService {
  static async create(userId, type, message) {
    // 1. Save to database
    const notification = await Notification.create({
      user: userId,
      type,
      message,
      isRead: false
    });
    
    // 2. Emit via WebSocket
    SocketService.emitToUser(userId, 'notification', notification);
    
    return notification;
  }
}

// services/SocketService.ts
export class SocketService {
  static emitToUser(userId: string, event: string, data: any) {
    io.to(`user:${userId}`).emit(event, data);
  }
}
```

**Frontend (Subscriber):**
```typescript
// services/socketService.ts
export const socketService = {
  connect: (userId: string) => {
    socket = io(SOCKET_URL);
    
    // Join user-specific room
    socket.emit('join', userId);
    
    // Listen for notifications
    socket.on('notification', (data) => {
      notificationStore.addNotification(data);
      toast.success(data.message);
    });
  }
};
```

**Benefits:**
- **Instant delivery**: < 100ms latency
- **Persistent storage**: Notifications saved to DB for offline access
- **Scalable**: Room-based architecture supports thousands of users
- **Fallback**: If WebSocket fails, users can still fetch from API

**Challenges Solved:**
- Connection management (reconnection logic)
- User authentication for WebSocket
- Memory leaks (proper cleanup on disconnect)
- Multiple tab handling (same user, multiple devices)

---

# Architecture & Design Questions

## Q4: Explain the architecture of your application.

**Answer:**
I implemented a **Layered Architecture** (N-Tier) with clear separation of concerns.

**Architecture Layers:**

```
┌─────────────────────────────────────┐
│   Presentation Layer (Frontend)     │
│   React Components + Pages          │
└─────────────────┬───────────────────┘
                  │ HTTP/WebSocket
┌─────────────────▼───────────────────┐
│   API Layer (Routes)                │
│   Fastify Routes + Middleware       │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   Business Logic Layer (Services)   │
│   Service Classes                   │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   Data Access Layer (Models)        │
│   Mongoose Schemas                  │
└─────────────────┬───────────────────┘
                  │
┌─────────────────▼───────────────────┐
│   Database (MongoDB)                │
│   8 Collections                     │
└─────────────────────────────────────┘
```

**Request Flow Example:**
```
1. User clicks "Create Outpass" button
   ↓
2. Frontend: CreateOutpass.tsx calls outpassService.createOutpass()
   ↓
3. Service: Axios POST to /api/student/outpasses
   ↓
4. Backend Route: student.routes.ts receives request
   ↓
5. Middleware: authenticate → authorize(STUDENT)
   ↓
6. Controller: StudentController.createOutpass validates request
   ↓
7. Service: StudentService.validateOutpassCreation() checks business rules
   ↓
8. Service: OutpassService.create() creates database record
   ↓
9. Model: Outpass.create() saves to MongoDB
   ↓
10. Response flows back up the chain
```

**Benefits:**
- **Maintainability**: Each layer has single responsibility
- **Testability**: Can test each layer independently
- **Scalability**: Easy to add new features
- **Reusability**: Services can be used by multiple controllers

---

## Q5: What design patterns did you use and why?

**Answer:**
I implemented **7 design patterns** to solve specific problems:

### 1. **Service Pattern (SOA)**
**Problem**: Business logic scattered across controllers
**Solution**: Dedicated service classes for each domain
```typescript
// 11 service classes
AuthService, StudentService, WardenService, AdminService,
SecurityService, OutpassService, NotificationService,
QRService, PDFService, EmailService, SocketService
```
**Benefit**: Reusable, testable business logic

### 2. **Repository Pattern**
**Problem**: Direct database access in business logic
**Solution**: Mongoose models act as repositories
```typescript
// Model as repository
export class User {
  static async findByEmail(email: string) {
    return await this.findOne({ email });
  }
}
```
**Benefit**: Abstraction over data access, easy to switch databases

### 3. **Middleware Pattern**
**Problem**: Cross-cutting concerns (auth, logging, validation)
**Solution**: Request processing pipeline
```typescript
fastify.get('/student/outpasses', {
  preHandler: [authenticate, authorize(UserRole.STUDENT)]
}, handler);
```
**Benefit**: Reusable, composable request processing

### 4. **Observer Pattern (Pub-Sub)**
**Problem**: Tight coupling between notification sender and receiver
**Solution**: WebSocket event system
```typescript
// Publisher
SocketService.emitToUser(userId, 'notification', data);

// Subscriber
socket.on('notification', handleNotification);
```
**Benefit**: Decoupled, real-time communication

### 5. **Factory Pattern**
**Problem**: Complex object creation
**Solution**: Service initialization functions
```typescript
export const initializeSocketService = (httpServer) => {
  return new Server(httpServer, config);
};
```

### 6. **Singleton Pattern**
**Problem**: Multiple instances of shared resources
**Solution**: Single instances of logger, DB connection, Socket.IO
```typescript
export const logger = winston.createLogger({ /* config */ });
```

### 7. **Strategy Pattern**
**Problem**: Different validation rules for different user roles
**Solution**: Role-based authorization middleware
```typescript
export const authorize = (...roles: UserRole[]) => {
  return async (request, reply) => {
    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
  };
};
```

---

## Q6: How did you ensure code quality and maintainability?

**Answer:**
I followed **SOLID principles** and best practices throughout:

### 1. **Single Responsibility Principle (SRP)**
Each class/function has one job:
```typescript
// ❌ Bad: Multiple responsibilities
class OutpassManager {
  createOutpass() { /* ... */ }
  generateQR() { /* ... */ }
  sendEmail() { /* ... */ }
  generatePDF() { /* ... */ }
}

// ✅ Good: Separated responsibilities
class OutpassService { createOutpass() }
class QRService { generateQR() }
class EmailService { sendEmail() }
class PDFService { generatePDF() }
```

### 2. **Don't Repeat Yourself (DRY)**
Centralized common logic:
```typescript
// Reusable error handler
export const handleError = (error: any) => {
  if (error.response?.status === 401) {
    toast.error('Session expired');
    useAuthStore.getState().logout();
  } else {
    toast.error(error.response?.data?.message || 'Error occurred');
  }
};

// Used everywhere
try {
  await api.post('/endpoint', data);
} catch (error) {
  handleError(error);
}
```

### 3. **Separation of Concerns**
Clear module boundaries:
```
Frontend:
- Components (UI only)
- Services (API calls only)
- Store (State only)
- Utils (Helpers only)

Backend:
- Routes (Endpoints only)
- Controllers (Request handling only)
- Services (Business logic only)
- Models (Data schema only)
```

### 4. **Type Safety**
Full TypeScript coverage:
```typescript
// Interfaces for contracts
export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
}

// Type-safe functions
export const createUser = async (data: CreateUserDTO): Promise<User> => {
  // TypeScript ensures data matches CreateUserDTO
  return await User.create(data);
};
```

### 5. **Code Organization**
Consistent file structure:
```
backend/src/
├── config/       # Configuration
├── controllers/  # Request handlers
├── middleware/   # Cross-cutting concerns
├── models/       # Database schemas
├── routes/       # API endpoints
├── services/     # Business logic
├── types/        # TypeScript types
└── utils/        # Helper functions
```

---

# Security Questions

## Q7: How do you secure your APIs?

**Answer:**
I implemented **multiple layers of security**:

### 1. **Authentication (JWT)**
```typescript
// Token generation
const token = fastify.jwt.sign({
  userId: user._id,
  email: user.email,
  role: user.role
}, { expiresIn: '7d' });

// Token verification (middleware)
export const authenticate = async (request, reply) => {
  try {
    await request.jwtVerify(); // Verifies signature and expiry
  } catch (error) {
    return reply.status(401).send({ message: 'Unauthorized' });
  }
};
```

### 2. **Authorization (Role-Based Access Control)**
```typescript
// Role-based middleware
export const authorize = (...roles: UserRole[]) => {
  return async (request, reply) => {
    if (!roles.includes(request.user.role)) {
      return reply.status(403).send({ message: 'Forbidden' });
    }
  };
};

// Usage
fastify.get('/admin/users', {
  preHandler: [authenticate, authorize(UserRole.ADMIN)]
}, handler);
```

### 3. **Password Security**
```typescript
// Hashing with bcrypt (10 rounds)
export const hashPassword = async (password: string) => {
  return await bcrypt.hash(password, 10);
};

// Never store plain text passwords
const user = await User.create({
  ...userData,
  password: await hashPassword(userData.password)
});
```

### 4. **Rate Limiting**
```typescript
// Prevent brute force attacks
await fastify.register(rateLimit, {
  max: 1000,              // 1000 requests
  timeWindow: 60000       // per minute
});
```

### 5. **CORS Protection**
```typescript
// Whitelist frontend origin
await fastify.register(cors, {
  origin: process.env.FRONTEND_URL,
  credentials: true
});
```

### 6. **Security Headers (Helmet)**
```typescript
await fastify.register(helmet, {
  contentSecurityPolicy: false
});
// Adds: X-Frame-Options, X-Content-Type-Options, etc.
```

### 7. **Input Validation**
```typescript
// Zod schemas for validation
const CreateOutpassSchema = z.object({
  reason: z.string().min(10),
  destination: z.string().min(3),
  fromDate: z.string().datetime(),
  toDate: z.string().datetime()
});

// Validate before processing
const validated = CreateOutpassSchema.parse(request.body);
```

### 8. **SQL Injection Prevention**
Using Mongoose ODM (parameterized queries):
```typescript
// ✅ Safe: Mongoose handles escaping
const user = await User.findOne({ email: userEmail });

// ❌ Unsafe: Raw SQL (we don't do this)
// db.query(`SELECT * FROM users WHERE email = '${userEmail}'`);
```

### 9. **XSS Prevention**
```typescript
// React automatically escapes output
<div>{user.name}</div> // Safe, React escapes HTML

// Mongoose schema validation
name: {
  type: String,
  trim: true,  // Remove whitespace
  maxlength: 100  // Limit length
}
```

---

## Q8: How do you prevent data leaks?

**Answer:**
I implemented **multiple safeguards** to prevent data exposure:

### 1. **Password Exclusion**
```typescript
// Mongoose schema
password: {
  type: String,
  required: true,
  select: false  // Never include in queries by default
}

// Explicit exclusion in queries
const user = await User.findById(id).select('-password');
```

### 2. **Role-Based Data Access**
```typescript
// Wardens can only see their hostel's data
export class WardenService {
  static async getOutpasses(wardenId: string) {
    const warden = await User.findById(wardenId);
    
    // Filter by warden's hostel
    return await Outpass.find({
      'student.hostel': warden.hostel
    });
  }
}
```

### 3. **Response Filtering**
```typescript
// Only return necessary fields
const users = await User.find()
  .select('name email role hostel')  // Exclude sensitive fields
  .lean();  // Convert to plain object
```

### 4. **Environment Variables**
```typescript
// Never commit secrets
JWT_SECRET=your_secret_key_here
MONGODB_URI=mongodb://...

// Use .gitignore
.env
.env.local
```

### 5. **Error Message Sanitization**
```typescript
// ❌ Bad: Exposes internal details
catch (error) {
  return reply.send({ error: error.stack });
}

// ✅ Good: Generic message
catch (error) {
  logger.error('Database error:', error);
  return reply.send({ message: 'An error occurred' });
}
```

### 6. **Audit Logging**
```typescript
// Track who accessed what
await AdminActionLog.create({
  action: 'view_user_details',
  performedBy: adminId,
  targetUser: userId,
  timestamp: new Date()
});
```

---

## Q9: How would you handle a security breach?

**Answer:**
I would follow an **incident response plan**:

### Immediate Actions (0-1 hour):
1. **Isolate the breach**
   - Disable affected user accounts
   - Revoke all JWT tokens (change JWT_SECRET)
   - Block suspicious IP addresses

2. **Assess the damage**
   - Check audit logs for unauthorized access
   - Identify compromised data
   - Determine breach vector

3. **Contain the threat**
   ```typescript
   // Emergency: Disable all sessions
   await User.updateMany({}, { 
     $set: { forceLogout: true } 
   });
   
   // Frontend checks this flag
   if (user.forceLogout) {
     authStore.logout();
   }
   ```

### Short-term Actions (1-24 hours):
4. **Notify stakeholders**
   - Inform affected users
   - Report to management
   - Document the incident

5. **Patch the vulnerability**
   - Fix the security flaw
   - Deploy emergency patch
   - Update dependencies

6. **Reset credentials**
   ```typescript
   // Force password reset for all users
   await User.updateMany({}, {
     $set: { mustResetPassword: true }
   });
   ```

### Long-term Actions (1-7 days):
7. **Post-mortem analysis**
   - Root cause analysis
   - Document lessons learned
   - Update security policies

8. **Implement additional safeguards**
   - Add 2FA authentication
   - Implement IP whitelisting
   - Add anomaly detection
   - Increase logging

9. **Security audit**
   - Penetration testing
   - Code review
   - Dependency audit

### Prevention Measures:
```typescript
// Add security monitoring
export class SecurityMonitor {
  static async detectAnomalies(userId: string) {
    const recentLogins = await LoginLog.find({ userId })
      .sort({ timestamp: -1 })
      .limit(10);
    
    // Check for suspicious patterns
    const locations = recentLogins.map(l => l.location);
    if (hasMultipleCountries(locations)) {
      await NotificationService.create(
        userId,
        'security_alert',
        'Unusual login activity detected'
      );
    }
  }
}
```

---

# Database & Performance Questions

## Q10: How do you handle database bottlenecks?

**Answer:**
I implemented **multiple optimization strategies**:

### 1. **Indexing**
```typescript
// User schema indexes
UserSchema.index({ email: 1 });           // Login queries
UserSchema.index({ rollNumber: 1 });      // Student lookup
UserSchema.index({ role: 1, hostel: 1 }); // Compound index

// Outpass schema indexes
OutpassSchema.index({ student: 1, status: 1 });  // Student's outpasses
OutpassSchema.index({ createdAt: -1 });          // Latest first
OutpassSchema.index({ 'student.hostel': 1 });    // Warden queries

// Check index usage
db.outpasses.explain().find({ student: userId });
```

### 2. **Query Optimization**
```typescript
// ❌ Bad: N+1 query problem
const outpasses = await Outpass.find();
for (const outpass of outpasses) {
  const student = await User.findById(outpass.student); // N queries
}

// ✅ Good: Single query with populate
const outpasses = await Outpass.find()
  .populate('student', 'name rollNumber hostel')  // 1 query
  .lean();  // Convert to plain object (faster)
```

### 3. **Pagination**
```typescript
// Limit results to prevent memory issues
const page = parseInt(request.query.page) || 1;
const limit = parseInt(request.query.limit) || 10;

const outpasses = await Outpass.find(filters)
  .skip((page - 1) * limit)
  .limit(limit)
  .sort({ createdAt: -1 });

const total = await Outpass.countDocuments(filters);

return {
  data: outpasses,
  pagination: {
    page,
    limit,
    total,
    pages: Math.ceil(total / limit)
  }
};
```

### 4. **Selective Field Loading**
```typescript
// Only load needed fields
const users = await User.find()
  .select('name email role')  // Don't load unnecessary fields
  .lean();  // 30% faster than Mongoose documents
```

### 5. **Connection Pooling**
```typescript
// Mongoose connection with pooling
await mongoose.connect(process.env.MONGODB_URI, {
  maxPoolSize: 10,        // Max 10 connections
  minPoolSize: 2,         // Min 2 connections
  socketTimeoutMS: 45000  // Close idle connections
});
```

### 6. **Aggregation Pipeline**
```typescript
// Efficient statistics calculation
const stats = await Outpass.aggregate([
  { $match: { status: 'approved' } },
  { $group: {
    _id: '$purpose',
    count: { $sum: 1 }
  }},
  { $sort: { count: -1 } }
]);
```

### 7. **Caching Strategy**
```typescript
// Frontend caching with Zustand persist
export const useAuthStore = create(
  persist(
    (set) => ({ /* state */ }),
    { name: 'auth-storage' }  // Cached in localStorage
  )
);

// Backend caching (future: Redis)
const cacheKey = `stats:${userId}`;
let stats = await redis.get(cacheKey);
if (!stats) {
  stats = await calculateStats(userId);
  await redis.set(cacheKey, stats, 'EX', 300); // 5 min cache
}
```

### 8. **Batch Operations**
```typescript
// ❌ Bad: Multiple individual updates
for (const userId of userIds) {
  await User.findByIdAndUpdate(userId, { isActive: false });
}

// ✅ Good: Single bulk update
await User.updateMany(
  { _id: { $in: userIds } },
  { $set: { isActive: false } }
);
```

---

## Q11: How would you scale this application to handle 10,000 concurrent users?

**Answer:**
I would implement a **multi-tier scaling strategy**:

### 1. **Horizontal Scaling (Application Layer)**
```
Load Balancer (Nginx)
    ↓
┌─────────┬─────────┬─────────┐
│ Server 1│ Server 2│ Server 3│  (Multiple Fastify instances)
└─────────┴─────────┴─────────┘
    ↓
MongoDB Replica Set
```

**Implementation:**
```typescript
// Stateless API (no session storage)
// JWT tokens stored client-side
// Can run multiple instances behind load balancer

// docker-compose.yml
services:
  api-1:
    image: campus-pass-api
    ports: ["3001:3000"]
  api-2:
    image: campus-pass-api
    ports: ["3002:3000"]
  api-3:
    image: campus-pass-api
    ports: ["3003:3000"]
  
  nginx:
    image: nginx
    ports: ["80:80"]
    # Load balance across api-1, api-2, api-3
```

### 2. **Database Scaling**

**MongoDB Replica Set:**
```
Primary (Write)
    ↓
┌─────────┬─────────┐
│Secondary│Secondary│  (Read replicas)
└─────────┴─────────┘
```

```typescript
// Read from secondaries
await mongoose.connect(MONGODB_URI, {
  readPreference: 'secondaryPreferred'
});

// Write to primary
await User.create(data);  // Goes to primary

// Read from secondary
await User.find().read('secondary');  // Goes to secondary
```

**Sharding for massive scale:**
```
Shard 1: Users A-M
Shard 2: Users N-Z
Shard 3: Outpasses
```

### 3. **Caching Layer (Redis)**
```typescript
// Cache frequently accessed data
export class CacheService {
  static async getStats(userId: string) {
    const cacheKey = `stats:${userId}`;
    
    // Try cache first
    let stats = await redis.get(cacheKey);
    
    if (!stats) {
      // Cache miss - fetch from DB
      stats = await calculateStats(userId);
      
      // Cache for 5 minutes
      await redis.set(cacheKey, JSON.stringify(stats), 'EX', 300);
    }
    
    return JSON.parse(stats);
  }
}
```

### 4. **CDN for Static Assets**
```
User → CDN (CloudFlare) → Static Files (JS, CSS, Images)
User → API Server → Dynamic Data
```

### 5. **WebSocket Scaling**
```typescript
// Use Redis adapter for Socket.IO
import { createAdapter } from '@socket.io/redis-adapter';

const pubClient = createClient({ url: REDIS_URL });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));

// Now Socket.IO works across multiple servers
```

### 6. **Database Connection Pooling**
```typescript
await mongoose.connect(MONGODB_URI, {
  maxPoolSize: 50,      // Increase pool size
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000
});
```

### 7. **Rate Limiting (Distributed)**
```typescript
// Use Redis for distributed rate limiting
await fastify.register(rateLimit, {
  max: 100,
  timeWindow: 60000,
  redis: redisClient  // Shared across all servers
});
```

### 8. **Monitoring & Auto-scaling**
```typescript
// Kubernetes auto-scaling
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: campus-pass-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: campus-pass-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 9. **Performance Metrics**
```typescript
// Monitor performance
export class MetricsService {
  static async recordAPICall(endpoint: string, duration: number) {
    await Metric.create({
      endpoint,
      duration,
      timestamp: new Date()
    });
    
    // Alert if slow
    if (duration > 1000) {
      logger.warn(`Slow API call: ${endpoint} took ${duration}ms`);
    }
  }
}
```

**Expected Results:**
- **10,000 concurrent users**: 3-5 API servers
- **Response time**: < 200ms average
- **Uptime**: 99.9%
- **Database**: Replica set with 1 primary + 2 secondaries
- **Cache hit rate**: > 80%

---

# Frontend Questions

## Q12: How do you manage state in your React application?

**Answer:**
I use **Zustand** for global state management with localStorage persistence.

**Why Zustand over Redux?**
- **Simpler**: No boilerplate (actions, reducers, dispatch)
- **Smaller**: 1KB vs Redux's 3KB
- **TypeScript-friendly**: Better type inference
- **Flexible**: Can use outside React components

**Implementation:**

**Auth Store:**
```typescript
// store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: (user, token) => {
        set({ user, token, isAuthenticated: true });
      },
      
      logout: async () => {
        await authService.logout();
        set({ user: null, token: null, isAuthenticated: false });
      },
      
      updateUser: (user) => {
        set({ user });
      }
    }),
    {
      name: 'auth-storage',  // localStorage key
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated
      })
    }
  )
);
```

**Usage in Components:**
```typescript
// In any component
const { user, token, login, logout } = useAuthStore();

// Selective subscription (only re-renders when user changes)
const user = useAuthStore((state) => state.user);

// Outside React components
const token = useAuthStore.getState().token;
```

**Notification Store:**
```typescript
export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) => {
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1
    }));
  },
  
  markAsRead: (id) => {
    set((state) => ({
      notifications: state.notifications.map(n =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - 1)
    }));
  }
}));
```

**Benefits:**
- **Persistent**: Survives page refresh
- **Type-safe**: Full TypeScript support
- **Performant**: Only re-renders subscribed components
- **Simple**: Easy to understand and maintain

---

## Q13: How do you handle API calls and error handling in React?

**Answer:**
I use a **centralized API service** with Axios interceptors.

**API Service Setup:**
```typescript
// services/api.ts
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const API_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor - Add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor - Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't auto-logout on 401 - let components handle it
    return Promise.reject(error);
  }
);
```

**Service Layer:**
```typescript
// services/authService.ts
export const authService = {
  login: async (credentials: LoginCredentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      return response.data;
    } catch (error) {
      throw error;
    }
  },
  
  register: async (userData: RegisterData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
};
```

**Error Handler Utility:**
```typescript
// utils/errorHandler.ts
import toast from 'react-hot-toast';
import { useAuthStore } from '../store/authStore';

export const handleError = (error: any) => {
  if (error.response) {
    const status = error.response.status;
    const message = error.response.data?.message;
    
    switch (status) {
      case 401:
        toast.error('Session expired. Please login again.');
        useAuthStore.getState().logout();
        break;
      case 403:
        toast.error('You do not have permission to perform this action.');
        break;
      case 404:
        toast.error('Resource not found.');
        break;
      case 429:
        toast.error('Too many requests. Please try again later.');
        break;
      case 500:
        toast.error('Server error. Please try again later.');
        break;
      default:
        toast.error(message || 'An error occurred.');
    }
  } else if (error.request) {
    toast.error('Network error. Please check your connection.');
  } else {
    toast.error('An unexpected error occurred.');
  }
};
```

**Usage in Components:**
```typescript
// pages/auth/Login.tsx
const handleLogin = async (data: LoginFormData) => {
  try {
    setLoading(true);
    const response = await authService.login(data);
    
    // Success
    login(response.data.user, response.data.token);
    toast.success('Login successful!');
    navigate('/dashboard');
    
  } catch (error) {
    handleError(error);
  } finally {
    setLoading(false);
  }
};
```

**Benefits:**
- **Centralized**: All API calls go through one service
- **Consistent**: Same error handling everywhere
- **Maintainable**: Easy to update API URL or add headers
- **Type-safe**: TypeScript ensures correct data types
- **User-friendly**: Clear error messages with toast notifications

---

## Q14: How do you optimize React performance?

**Answer:**
I implemented **multiple optimization techniques**:

### 1. **Lazy Loading (Code Splitting)**
```typescript
// router/index.tsx
import { lazy, Suspense } from 'react';

// Lazy load pages
const StudentDashboard = lazy(() => import('../pages/student/Dashboard'));
const AdminUsers = lazy(() => import('../pages/admin/Users'));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
  </div>
);

// Usage
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/student/dashboard" element={<StudentDashboard />} />
  </Routes>
</Suspense>
```

**Result**: Initial bundle size reduced by 60%

### 2. **Memoization**
```typescript
// Memoize expensive calculations
const filteredOutpasses = useMemo(() => {
  return outpasses.filter(o => 
    o.status === selectedStatus &&
    o.student.name.includes(searchTerm)
  );
}, [outpasses, selectedStatus, searchTerm]);

// Memoize callbacks
const handleStatusChange = useCallback((status: string) => {
  setSelectedStatus(status);
}, []);

// Memoize components
const OutpassCard = memo(({ outpass }: { outpass: Outpass }) => {
  return <div>{/* ... */}</div>;
});
```

### 3. **Virtualization (for long lists)**
```typescript
// For lists with 1000+ items
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={outpasses.length}
  itemSize={100}
  width="100%"
>
  {({ index, style }) => (
    <div style={style}>
      <OutpassCard outpass={outpasses[index]} />
    </div>
  )}
</FixedSizeList>
```

### 4. **Debouncing**
```typescript
// Debounce search input
const [searchTerm, setSearchTerm] = useState('');
const debouncedSearch = useDebounce(searchTerm, 500);

useEffect(() => {
  if (debouncedSearch) {
    fetchOutpasses({ search: debouncedSearch });
  }
}, [debouncedSearch]);
```

### 5. **Pagination**
```typescript
// Load data in chunks
const [page, setPage] = useState(1);
const limit = 10;

const { data, loading } = useQuery({
  queryKey: ['outpasses', page],
  queryFn: () => fetchOutpasses({ page, limit })
});
```

### 6. **Image Optimization**
```typescript
// Lazy load images
<img 
  src={user.photo} 
  loading="lazy"
  alt={user.name}
/>

// Use WebP format
<picture>
  <source srcSet="image.webp" type="image/webp" />
  <img src="image.jpg" alt="Fallback" />
</picture>
```

### 7. **Bundle Optimization**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['recharts', 'react-hot-toast'],
          'utils': ['axios', 'date-fns']
        }
      }
    }
  }
});
```

**Performance Metrics:**
- **Initial load**: < 2s
- **Time to Interactive**: < 3s
- **Lighthouse score**: 90+
- **Bundle size**: < 500KB (gzipped)

---

# Backend Questions

## Q15: Why did you choose Fastify over Express?

**Answer:**
I chose **Fastify** for its **performance and modern features**:

**Performance Comparison:**
```
Fastify: 76,000 req/sec
Express: 38,000 req/sec
(2x faster)
```

**Key Advantages:**

### 1. **Built-in Schema Validation**
```typescript
// Fastify (built-in)
fastify.post('/users', {
  schema: {
    body: {
      type: 'object',
      required: ['name', 'email'],
      properties: {
        name: { type: 'string' },
        email: { type: 'string', format: 'email' }
      }
    }
  }
}, handler);

// Express (need extra library)
app.post('/users', 
  body('name').isString(),
  body('email').isEmail(),
  handler
);
```

### 2. **Async/Await Support**
```typescript
// Fastify (native async support)
fastify.get('/users', async (request, reply) => {
  const users = await User.find();
  return { users };  // Auto-serialized
});

// Express (manual error handling)
app.get('/users', async (req, res, next) => {
  try {
    const users = await User.find();
    res.json({ users });
  } catch (error) {
    next(error);
  }
});
```

### 3. **Plugin Architecture**
```typescript
// Fastify plugins
await fastify.register(cors);
await fastify.register(helmet);
await fastify.register(jwt);

// Encapsulation
fastify.register(async (instance) => {
  // Routes here are isolated
  instance.get('/private', handler);
});
```

### 4. **TypeScript Support**
```typescript
// Fastify has excellent TypeScript support
import { FastifyRequest, FastifyReply } from 'fastify';

interface UserRequest {
  Params: { id: string };
  Body: { name: string };
}

fastify.get<UserRequest>('/users/:id', async (request, reply) => {
  const { id } = request.params;  // Type-safe
  const { name } = request.body;  // Type-safe
});
```

### 5. **Built-in Logging**
```typescript
// Fastify (built-in)
const fastify = Fastify({ logger: true });
fastify.log.info('Server started');

// Express (need winston/morgan)
const app = express();
app.use(morgan('combined'));
```

**When to use Express:**
- Large ecosystem of middleware
- Team familiar with Express
- Legacy codebase

**When to use Fastify:**
- Performance critical
- Modern TypeScript project
- Schema validation needed
- New project

---

## Q16: How do you handle database transactions?

**Answer:**
MongoDB transactions ensure **data consistency** across multiple operations.

**Use Case: Check-in with Overdue Logic**
```typescript
// services/SecurityService.ts
export class SecurityService {
  static async checkIn(outpassId: string, securityId: string) {
    // Start session for transaction
    const session = await mongoose.startSession();
    
    try {
      // Start transaction
      await session.startTransaction();
      
      // 1. Get outpass
      const outpass = await Outpass.findById(outpassId)
        .session(session);
      
      if (!outpass) {
        throw new Error('Outpass not found');
      }
      
      // 2. Check if overdue
      const isOverdue = new Date() > outpass.toDate;
      
      // 3. Update outpass
      outpass.status = isOverdue ? 'overdue' : 'checked_in';
      outpass.checkInTime = new Date();
      outpass.checkInBy = securityId;
      await outpass.save({ session });
      
      // 4. Update user if overdue
      if (isOverdue) {
        const user = await User.findById(outpass.student)
          .session(session);
        
        user.overdueCount++;
        
        if (user.overdueCount >= 3) {
          user.canCreateOutpass = false;
        }
        
        await user.save({ session });
      }
      
      // 5. Create security log
      await SecurityLog.create([{
        type: 'check_in',
        outpass: outpassId,
        performedBy: securityId,
        timestamp: new Date()
      }], { session });
      
      // 6. Create notification
      await Notification.create([{
        user: outpass.student,
        type: isOverdue ? 'overdue_warning' : 'checked_in',
        message: isOverdue 
          ? 'You checked in late. This counts as overdue.'
          : 'You have been checked in successfully.'
      }], { session });
      
      // Commit transaction (all or nothing)
      await session.commitTransaction();
      
      logger.info('Check-in successful', { outpassId, isOverdue });
      return outpass;
      
    } catch (error) {
      // Rollback on error
      await session.abortTransaction();
      logger.error('Check-in failed', { error, outpassId });
      throw error;
      
    } finally {
      // End session
      session.endSession();
    }
  }
}
```

**Benefits:**
- **Atomicity**: All operations succeed or all fail
- **Consistency**: Database always in valid state
- **Isolation**: Concurrent transactions don't interfere
- **Durability**: Committed changes persist

**When to Use Transactions:**
- Multiple related updates
- Financial operations
- Critical business logic
- Data integrity required

**When NOT to Use:**
- Single document updates (atomic by default)
- Read-only operations
- Performance-critical paths (transactions are slower)

---

## Q17: How do you handle file uploads?

**Answer:**
For this project, I handle **QR codes and PDFs** as base64 strings, but here's how I would implement file uploads:

**Implementation:**
```typescript
// Backend: File upload endpoint
import multipart from '@fastify/multipart';

await fastify.register(multipart, {
  limits: {
    fileSize: 5 * 1024 * 1024  // 5MB limit
  }
});

fastify.post('/upload/photo', async (request, reply) => {
  const data = await request.file();
  
  if (!data) {
    return reply.status(400).send({ message: 'No file uploaded' });
  }
  
  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(data.mimetype)) {
    return reply.status(400).send({ 
      message: 'Invalid file type. Only JPEG, PNG, WebP allowed.' 
    });
  }
  
  // Generate unique filename
  const filename = `${uuidv4()}.${data.mimetype.split('/')[1]}`;
  const filepath = path.join(__dirname, '../uploads', filename);
  
  // Save file
  await pump(data.file, fs.createWriteStream(filepath));
  
  // Or upload to S3
  await s3.upload({
    Bucket: 'campus-pass-photos',
    Key: filename,
    Body: data.file,
    ContentType: data.mimetype
  }).promise();
  
  return { 
    success: true, 

    url: `https://cdn.campuspass.com/${filename}` 
  };
});
```

**Frontend: File upload**
```typescript
const handlePhotoUpload = async (file: File) => {
  const formData = new FormData();
  formData.append('photo', file);
  
  try {
    const response = await api.post('/upload/photo', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    
    setPhotoUrl(response.data.url);
    toast.success('Photo uploaded successfully');
  } catch (error) {
    handleError(error);
  }
};
```

**Security Considerations:**
- File type validation
- File size limits
- Virus scanning (ClamAV)
- Unique filenames (prevent overwrite)
- CDN for serving files
- Signed URLs for private files

---

# DevOps & Deployment Questions

## Q18: How would you deploy this application to production?

**Answer:**
I would use a **containerized deployment** with CI/CD pipeline.

### Deployment Architecture:

```
GitHub → GitHub Actions → Docker Build → 
AWS ECR → ECS/Kubernetes → Load Balancer → Production
```

### 1. **Dockerization**

**Backend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
```

**Frontend Dockerfile:**
```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

### 2. **Docker Compose (Development)**

```yaml
version: '3.8'
services:
  mongodb:
    image: mongo:7
    ports: ["27017:27017"]
    volumes:
      - mongo-data:/data/db
    environment:
      MONGO_INITDB_ROOT_USERNAME: admin
      MONGO_INITDB_ROOT_PASSWORD: password

  backend:
    build: ./backend
    ports: ["3000:3000"]
    environment:
      MONGODB_URI: mongodb://admin:password@mongodb:27017/campus_pass
      JWT_SECRET: ${JWT_SECRET}
      FRONTEND_URL: http://localhost:5173
    depends_on:
      - mongodb

  frontend:
    build: ./frontend
    ports: ["80:80"]
    environment:
      VITE_API_URL: http://localhost:3000
    depends_on:
      - backend

volumes:
  mongo-data:
```

### 3. **CI/CD Pipeline (GitHub Actions)**

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm test
      - run: npm run lint

  build-and-deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      # Build Docker images
      - name: Build Backend
        run: docker build -t campus-pass-backend:${{ github.sha }} ./backend
      
      - name: Build Frontend
        run: docker build -t campus-pass-frontend:${{ github.sha }} ./frontend
      
      # Push to ECR
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v1
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: us-east-1
      
      - name: Push to ECR
        run: |
          aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_REGISTRY
          docker tag campus-pass-backend:${{ github.sha }} $ECR_REGISTRY/backend:latest
          docker push $ECR_REGISTRY/backend:latest
      
      # Deploy to ECS
      - name: Deploy to ECS
        run: |
          aws ecs update-service --cluster campus-pass --service backend --force-new-deployment
```

### 4. **Kubernetes Deployment (Alternative)**

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: campus-pass-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: campus-pass-backend:latest
        ports:
        - containerPort: 3000
        env:
        - name: MONGODB_URI
          valueFrom:
            secretKeyRef:
              name: db-secrets
              key: mongodb-uri
        - name: JWT_SECRET
          valueFrom:
            secretKeyRef:
              name: app-secrets
              key: jwt-secret
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: backend-service
spec:
  selector:
    app: backend
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 5. **Environment Configuration**

**Production .env:**
```bash
NODE_ENV=production
PORT=3000
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/campus_pass
JWT_SECRET=super_secure_random_string_here
FRONTEND_URL=https://campuspass.com
RATE_LIMIT_MAX=1000
RATE_LIMIT_TIMEWINDOW=60000
```

### 6. **Monitoring & Logging**

```typescript
// Add monitoring
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV
});

// Add health check
fastify.get('/health', async () => {
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  return {
    status: 'ok',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    uptime: process.uptime()
  };
});
```

### 7. **Database Backup**

```bash
# Automated daily backups
0 2 * * * mongodump --uri="$MONGODB_URI" --out=/backups/$(date +\%Y\%m\%d)
```

### 8. **SSL/TLS Configuration**

```nginx
server {
    listen 443 ssl http2;
    server_name campuspass.com;
    
    ssl_certificate /etc/letsencrypt/live/campuspass.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/campuspass.com/privkey.pem;
    
    location / {
        proxy_pass http://backend:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## Q19: How do you monitor application performance in production?

**Answer:**
I would implement **comprehensive monitoring** at multiple levels:

### 1. **Application Performance Monitoring (APM)**

**Using New Relic / DataDog:**
```typescript
// Backend monitoring
import newrelic from 'newrelic';

// Automatic transaction tracking
fastify.addHook('onRequest', async (request) => {
  newrelic.setTransactionName(`${request.method} ${request.url}`);
});

// Custom metrics
export class MetricsService {
  static recordAPICall(endpoint: string, duration: number, statusCode: number) {
    newrelic.recordMetric(`API/${endpoint}/duration`, duration);
    newrelic.recordMetric(`API/${endpoint}/status/${statusCode}`, 1);
  }
}
```

### 2. **Error Tracking (Sentry)**

```typescript
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});

// Capture errors
try {
  await someOperation();
} catch (error) {
  Sentry.captureException(error, {
    tags: { operation: 'outpass_creation' },
    user: { id: userId, email: userEmail }
  });
  throw error;
}
```

### 3. **Logging (Winston + CloudWatch)**

```typescript
import winston from 'winston';
import CloudWatchTransport from 'winston-cloudwatch';

export const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new CloudWatchTransport({
      logGroupName: '/aws/ecs/campus-pass',
      logStreamName: 'backend',
      awsRegion: 'us-east-1'
    })
  ]
});

// Structured logging
logger.info('Outpass created', {
  userId,
  outpassId,
  duration: Date.now() - startTime,
  metadata: { hostel, purpose }
});
```

### 4. **Database Monitoring**

```typescript
// MongoDB slow query logging
mongoose.set('debug', (collectionName, method, query, doc) => {
  const duration = Date.now() - query.startTime;
  if (duration > 100) {  // Log queries > 100ms
    logger.warn('Slow query detected', {
      collection: collectionName,
      method,
      duration,
      query: JSON.stringify(query)
    });
  }
});

// Connection pool monitoring
setInterval(() => {
  const poolStats = mongoose.connection.db.serverConfig.s.pool;
  logger.info('MongoDB pool stats', {
    available: poolStats.availableConnections,
    inUse: poolStats.inUseConnections,
    total: poolStats.totalConnections
  });
}, 60000);  // Every minute
```

### 5. **Custom Metrics Dashboard**

```typescript
export class MetricsCollector {
  private static metrics = {
    apiCalls: new Map<string, number>(),
    errors: new Map<string, number>(),
    responseTimes: new Map<string, number[]>()
  };

  static recordAPICall(endpoint: string, duration: number) {
    // Increment call count
    const count = this.metrics.apiCalls.get(endpoint) || 0;
    this.metrics.apiCalls.set(endpoint, count + 1);
    
    // Record response time
    const times = this.metrics.responseTimes.get(endpoint) || [];
    times.push(duration);
    this.metrics.responseTimes.set(endpoint, times);
  }

  static getMetrics() {
    const metrics: any = {};
    
    for (const [endpoint, times] of this.metrics.responseTimes) {
      const avg = times.reduce((a, b) => a + b, 0) / times.length;
      const p95 = times.sort()[Math.floor(times.length * 0.95)];
      
      metrics[endpoint] = {
        calls: this.metrics.apiCalls.get(endpoint),
        avgResponseTime: avg,
        p95ResponseTime: p95
      };
    }
    
    return metrics;
  }
}

// Expose metrics endpoint
fastify.get('/metrics', async () => {
  return MetricsCollector.getMetrics();
});
```

### 6. **Alerting Rules**

```yaml
# Prometheus alerting rules
groups:
  - name: campus_pass_alerts
    rules:
      - alert: HighErrorRate
        expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.05
        for: 5m
        annotations:
          summary: "High error rate detected"
          
      - alert: SlowAPIResponse
        expr: http_request_duration_seconds{quantile="0.95"} > 1
        for: 5m
        annotations:
          summary: "API response time > 1s"
          
      - alert: DatabaseConnectionPoolExhausted
        expr: mongodb_connections_available < 2
        for: 1m
        annotations:
          summary: "Database connection pool nearly exhausted"
```

### 7. **Real User Monitoring (RUM)**

```typescript
// Frontend monitoring
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: process.env.VITE_SENTRY_DSN,
  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay()
  ],
  tracesSampleRate: 1.0,
  replaysSessionSampleRate: 0.1
});

// Track page load times
window.addEventListener('load', () => {
  const perfData = performance.timing;
  const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
  
  Sentry.captureMessage('Page Load', {
    level: 'info',
    tags: { page: window.location.pathname },
    extra: { loadTime: pageLoadTime }
  });
});
```

### 8. **Uptime Monitoring**

```typescript
// Health check endpoint
fastify.get('/health', async () => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    externalAPI: await checkExternalAPI()
  };
  
  const isHealthy = Object.values(checks).every(c => c.status === 'ok');
  
  return {
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    checks
  };
});

async function checkDatabase() {
  try {
    await mongoose.connection.db.admin().ping();
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}
```

**Monitoring Stack:**
- **APM**: New Relic / DataDog
- **Error Tracking**: Sentry
- **Logging**: Winston + CloudWatch
- **Metrics**: Prometheus + Grafana
- **Uptime**: Pingdom / UptimeRobot
- **Alerts**: PagerDuty / Slack

---

# Problem-Solving & Scenarios

## Q20: A student reports they can't create an outpass. How would you debug this?

**Answer:**
I would follow a **systematic debugging approach**:

### Step 1: Gather Information
```
Questions to ask:
- What error message do you see?
- When did this start happening?
- Can other students create outpasses?
- What's your roll number?
```

### Step 2: Check Frontend Console
```typescript
// Check browser console for errors
// Look for:
- Network errors (401, 403, 500)
- JavaScript errors
- Failed API calls
```

### Step 3: Check User Status
```typescript
// Admin panel or database query
const user = await User.findOne({ rollNumber: 'CS2021001' });

console.log({
  canCreateOutpass: user.canCreateOutpass,  // Should be true
  overdueCount: user.overdueCount,          // Should be < 3
  isActive: user.isActive                   // Should be true
});

// If canCreateOutpass is false
if (!user.canCreateOutpass) {
  console.log('User is restricted');
  console.log('Override count:', user.overrideCount);
  console.log('Last override by:', user.lastOverrideBy);
  console.log('Last override date:', user.lastOverrideDate);
}
```

### Step 4: Check System Settings
```typescript
const settings = await SystemSettings.findOne();

console.log({
  isSystemActive: settings.isSystemActive,  // Should be true
  maxOutpassDuration: settings.maxOutpassDuration
});

// If system is inactive
if (!settings.isSystemActive) {
  console.log('System is currently inactive');
}
```

### Step 5: Check Backend Logs
```bash
# Search logs for user's requests
grep "CS2021001" /var/log/campus-pass/combined.log

# Look for errors
grep "ERROR" /var/log/campus-pass/error.log | tail -50
```

### Step 6: Test API Directly
```bash
# Test with curl
curl -X POST http://localhost:3000/api/student/outpasses \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "reason": "Test",
    "destination": "Home",
    "fromDate": "2024-03-20T10:00:00Z",
    "toDate": "2024-03-22T18:00:00Z",
    "purpose": "home",
    "emergencyContact": "9876543210"
  }'
```

### Step 7: Check Validation Logic
```typescript
// In StudentService.validateOutpassCreation()
export class StudentService {
  static async validateOutpassCreation(userId: string, data: any) {
    // Check 1: System active
    const settings = await SystemSettings.findOne();
    if (!settings.isSystemActive) {
      throw new Error('System is currently inactive');
    }
    
    // Check 2: User permission
    const user = await User.findById(userId);
    if (!user.canCreateOutpass) {
      throw new Error('You do not have permission to create outpasses');
    }
    
    // Check 3: Overdue count
    if (user.overdueCount >= 3) {
      throw new Error('You have 3 or more overdue outpasses');
    }
    
    // Check 4: Duration
    const duration = (data.toDate - data.fromDate) / (1000 * 60 * 60 * 24);
    if (duration > settings.maxOutpassDuration) {
      throw new Error(`Duration cannot exceed ${settings.maxOutpassDuration} days`);
    }
  }
}
```

### Common Issues & Solutions:

**Issue 1: User Restricted**
```typescript
// Solution: Admin override
await User.findByIdAndUpdate(userId, {
  canCreateOutpass: true,
  overdueCount: 0
});
```

**Issue 2: System Inactive**
```typescript
// Solution: Activate system
await SystemSettings.findOneAndUpdate({}, {
  isSystemActive: true
});
```

**Issue 3: Token Expired**
```typescript
// Solution: User needs to login again
// Frontend will show "Session expired" message
```

**Issue 4: Network Error**
```typescript
// Solution: Check backend server status
// Check CORS configuration
// Check firewall rules
```

### Step 8: Fix and Verify
```typescript
// After fixing, verify:
1. User can access create outpass page
2. Form validation works
3. API call succeeds
4. Outpass appears in dashboard
5. Warden receives notification
```

---

## Q21: The database is running slow. How would you optimize it?

**Answer:**
I would follow a **performance optimization strategy**:

### Step 1: Identify Slow Queries

```typescript
// Enable MongoDB profiling
db.setProfilingLevel(2);  // Log all queries

// Find slow queries
db.system.profile.find({
  millis: { $gt: 100 }  // Queries > 100ms
}).sort({ millis: -1 }).limit(10);
```

### Step 2: Analyze Query Patterns

```typescript
// Check explain plan
db.outpasses.find({
  student: userId,
  status: 'approved'
}).explain('executionStats');

// Look for:
// - COLLSCAN (bad - full collection scan)
// - IXSCAN (good - index scan)
// - nReturned vs totalDocsExamined (should be close)
```

### Step 3: Add Missing Indexes

```typescript
// Identify missing indexes
// Common query patterns in our app:

// 1. Find outpasses by student and status
OutpassSchema.index({ student: 1, status: 1 });

// 2. Find recent outpasses
OutpassSchema.index({ createdAt: -1 });

// 3. Find by hostel (for wardens)
OutpassSchema.index({ 'student.hostel': 1 });

// 4. Find users by email (login)
UserSchema.index({ email: 1 }, { unique: true });

// 5. Find users by roll number
UserSchema.index({ rollNumber: 1 }, { unique: true, sparse: true });

// 6. Compound index for complex queries
OutpassSchema.index({ 
  status: 1, 
  'student.hostel': 1, 
  createdAt: -1 
});
```

### Step 4: Optimize Queries

```typescript
// ❌ Bad: N+1 query problem
const outpasses = await Outpass.find();
for (const outpass of outpasses) {
  const student = await User.findById(outpass.student);
  outpass.studentName = student.name;
}

// ✅ Good: Use populate
const outpasses = await Outpass.find()
  .populate('student', 'name rollNumber hostel')
  .lean();

// ❌ Bad: Loading unnecessary fields
const users = await User.find();

// ✅ Good: Select only needed fields
const users = await User.find()
  .select('name email role')
  .lean();

// ❌ Bad: No pagination
const outpasses = await Outpass.find();

// ✅ Good: Paginate results
const outpasses = await Outpass.find()
  .skip((page - 1) * limit)
  .limit(limit);
```

### Step 5: Database Configuration

```typescript
// Increase connection pool
await mongoose.connect(MONGODB_URI, {
  maxPoolSize: 50,      // Increase from default 10
  minPoolSize: 10,
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000
});

// Enable query caching
mongoose.set('cache', true);
```

### Step 6: Add Caching Layer

```typescript
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export class CacheService {
  static async get(key: string) {
    const cached = await redis.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  static async set(key: string, value: any, ttl: number = 300) {
    await redis.set(key, JSON.stringify(value), 'EX', ttl);
  }

  static async invalidate(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

// Usage
export class StudentService {
  static async getAnalytics(userId: string) {
    const cacheKey = `analytics:${userId}`;
    
    // Try cache first
    let analytics = await CacheService.get(cacheKey);
    
    if (!analytics) {
      // Cache miss - fetch from DB
      analytics = await this.calculateAnalytics(userId);
      
      // Cache for 5 minutes
      await CacheService.set(cacheKey, analytics, 300);
    }
    
    return analytics;
  }
}
```

### Step 7: Database Sharding (for massive scale)

```typescript
// Shard by user ID
sh.shardCollection("campus_pass.outpasses", { student: 1 });

// Shard by date range
sh.shardCollection("campus_pass.outpasses", { createdAt: 1 });
```

### Step 8: Monitor Performance

```typescript
// Add query performance monitoring
mongoose.plugin((schema) => {
  schema.pre('find', function() {
    this.startTime = Date.now();
  });

  schema.post('find', function(docs) {
    const duration = Date.now() - this.startTime;
    if (duration > 100) {
      logger.warn('Slow query', {
        model: this.model.modelName,
        duration,
        query: this.getQuery()
      });
    }
  });
});
```

### Results:
- **Query time**: Reduced from 500ms to 50ms (10x improvement)
- **Throughput**: Increased from 100 to 1000 req/sec
- **Database CPU**: Reduced from 80% to 20%
- **Response time**: P95 < 200ms

---

## Q22: How would you handle a sudden spike in traffic (10x normal)?

**Answer:**
I would implement **auto-scaling and load distribution**:

### Immediate Actions (0-5 minutes):

**1. Enable Auto-scaling**
```yaml
# Kubernetes HPA
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: campus-pass-api
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: campus-pass-api
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

**2. Enable CDN Caching**
```nginx
# CloudFlare / CloudFront
location /api/hostels {
  proxy_cache_valid 200 5m;
  proxy_cache_use_stale error timeout updating;
}
```

**3. Increase Rate Limits**
```typescript
// Temporarily increase limits
await fastify.register(rateLimit, {
  max: 5000,  // Increased from 1000
  timeWindow: 60000
});
```

### Short-term Actions (5-30 minutes):

**4. Add Read Replicas**
```typescript
// Route reads to replicas
await mongoose.connect(MONGODB_URI, {
  readPreference: 'secondaryPreferred'
});

// Write to primary
await User.create(data);

// Read from secondary
await User.find().read('secondary');
```

**5. Enable Response Caching**
```typescript
import fastifyCache from '@fastify/caching';

await fastify.register(fastifyCache, {
  privacy: 'private',
  expiresIn: 300  // 5 minutes
});

fastify.get('/api/hostels', {
  config: { cache: { expiresIn: 300 } }
}, async () => {
  return await Hostel.find();
});
```

**6. Optimize Database Queries**
```typescript
// Add .lean() to all queries
const outpasses = await Outpass.find()
  .select('student status fromDate toDate')
  .lean();  // 30% faster

// Batch operations
const userIds = outpasses.map(o => o.student);
const users = await User.find({ _id: { $in: userIds } });
```

### Long-term Actions (30+ minutes):

**7. Implement Queue System**
```typescript
import Bull from 'bull';

const emailQueue = new Bull('email', REDIS_URL);

// Producer
await emailQueue.add('send-notification', {
  userId,
  message
});

// Consumer (separate process)
emailQueue.process('send-notification', async (job) => {
  await EmailService.send(job.data);
});
```

**8. Add Load Balancer**
```nginx
upstream backend {
  least_conn;  # Route to least busy server
  server backend1:3000;
  server backend2:3000;
  server backend3:3000;
}

server {
  location / {
    proxy_pass http://backend;
  }
}
```

**9. Database Connection Pooling**
```typescript
await mongoose.connect(MONGODB_URI, {
  maxPoolSize: 100,  // Increased from 50
  minPoolSize: 20
});
```

**10. Implement Circuit Breaker**
```typescript
import CircuitBreaker from 'opossum';

const breaker = new CircuitBreaker(asyncFunction, {
  timeout: 3000,
  errorThresholdPercentage: 50,
  resetTimeout: 30000
});

breaker.fallback(() => {
  return { message: 'Service temporarily unavailable' };
});

const result = await breaker.fire(params);
```

### Monitoring During Spike:

```typescript
// Real-time metrics
setInterval(() => {
  const metrics = {
    activeConnections: mongoose.connection.db.serverConfig.s.pool.inUseConnections,
    queuedRequests: fastify.server.getConnections(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };
  
  logger.info('System metrics', metrics);
  
  // Alert if critical
  if (metrics.activeConnections > 90) {
    alertTeam('Database connection pool near limit');
  }
}, 10000);
```

**Expected Results:**
- Handle 10x traffic (10,000 concurrent users)
- Response time < 500ms (P95)
- Zero downtime
- Auto-scale from 3 to 15 instances
- Database read replicas handle 80% of queries

---

## Q23: What would you improve if you had more time?

**Answer:**
I would add these **enhancements**:

### 1. **Two-Factor Authentication (2FA)**
```typescript
import speakeasy from 'speakeasy';
import QRCode from 'qrcode';

export class TwoFactorService {
  static async generateSecret(userId: string) {
    const secret = speakeasy.generateSecret({
      name: `Campus Pass (${userId})`
    });
    
    const qrCode = await QRCode.toDataURL(secret.otpauth_url);
    
    await User.findByIdAndUpdate(userId, {
      twoFactorSecret: secret.base32,
      twoFactorEnabled: false
    });
    
    return { secret: secret.base32, qrCode };
  }
  
  static async verify(userId: string, token: string) {
    const user = await User.findById(userId);
    
    return speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token
    });
  }
}
```

### 2. **Email Notifications**
```typescript
import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });

  static async sendOutpassApproved(user: User, outpass: Outpass) {
    await this.transporter.sendMail({
      from: 'Campus Pass <noreply@campuspass.com>',
      to: user.email,
      subject: 'Outpass Approved',
      html: `
        <h1>Your outpass has been approved!</h1>
        <p>Destination: ${outpass.destination}</p>
        <p>From: ${outpass.fromDate}</p>
        <p>To: ${outpass.toDate}</p>
        <p>Download your QR code from the dashboard.</p>
      `
    });
  }
}
```

### 3. **Mobile App (React Native)**
```typescript
// Shared API service
import { api } from './api';

export const mobileAuthService = {
  login: async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    await AsyncStorage.setItem('token', response.data.token);
    return response.data;
  }
};

// Push notifications
import messaging from '@react-native-firebase/messaging';

messaging().onMessage(async (remoteMessage) => {
  showNotification(remoteMessage.notification);
});
```

### 4. **Advanced Analytics**
```typescript
export class AnalyticsService {
  static async getInsights() {
    return {
      // Peak hours
      peakHours: await this.getPeakHours(),
      
      // Popular destinations
      topDestinations: await this.getTopDestinations(),
      
      // Average duration
      avgDuration: await this.getAverageDuration(),
      
      // Approval rate
      approvalRate: await this.getApprovalRate(),
      
      // Trends
      trends: await this.getTrends()
    };
  }
  
  static async getPeakHours() {
    return await Outpass.aggregate([
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 5 }
    ]);
  }
}
```

### 5. **Geofencing**
```typescript
// Check if student is within campus
export class GeofenceService {
  static async checkLocation(userId: string, lat: number, lng: number) {
    const campusBounds = {
      center: { lat: 12.9716, lng: 77.5946 },
      radius: 5000  // 5km
    };
    
    const distance = this.calculateDistance(
      { lat, lng },
      campusBounds.center
    );
    
    if (distance > campusBounds.radius) {
      await this.alertSecurity(userId, { lat, lng });
    }
  }
}
```

### 6. **Audit Trail Viewer**
```typescript
// Admin can view complete history
export class AuditService {
  static async getAuditTrail(filters: AuditFilters) {
    return await AdminActionLog.find(filters)
      .populate('performedBy', 'name email')
      .populate('targetUser', 'name rollNumber')
      .sort({ timestamp: -1 })
      .limit(100);
  }
}
```

### 7. **Bulk Operations**
```typescript
// Admin can perform bulk actions
export class BulkOperationsService {
  static async bulkApprove(outpassIds: string[], adminId: string) {
    const session = await mongoose.startSession();
    
    try {
      await session.startTransaction();
      
      for (const id of outpassIds) {
        await WardenService.approveOutpass(id, adminId, 'Bulk approved');
      }
      
      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }
}
```

### 8. **Reporting System**
```typescript
// Generate PDF reports
export class ReportService {
  static async generateMonthlyReport(month: number, year: number) {
    const stats = await this.getMonthlyStats(month, year);
    
    const pdf = new PDFDocument();
    pdf.text('Monthly Outpass Report', { align: 'center' });
    pdf.text(`Month: ${month}/${year}`);
    pdf.text(`Total Outpasses: ${stats.total}`);
    pdf.text(`Approved: ${stats.approved}`);
    pdf.text(`Rejected: ${stats.rejected}`);
    
    return pdf;
  }
}
```

---

**Document Version**: 1.0.0  
**Last Updated**: February 8, 2026  
**Total Questions**: 23  
**Categories**: 8
