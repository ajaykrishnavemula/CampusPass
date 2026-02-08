# Campus Pass - Complete API Documentation & Code Flow Guide

## Table of Contents
1. [Authentication APIs](#authentication-apis)
2. [Student APIs](#student-apis)
3. [Warden APIs](#warden-apis)
4. [Admin APIs](#admin-apis)
5. [Security APIs](#security-apis)
6. [Hostel APIs](#hostel-apis)
7. [Notification APIs](#notification-apis)
8. [Frontend File Structure](#frontend-file-structure)
9. [Backend File Structure](#backend-file-structure)

---

## Authentication APIs

### 1. POST /api/auth/register
**Purpose**: Register a new user (Student, Warden, Security, or Admin)

**Request Body**:
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": 1,
  "rollNumber": "CS2021001",
  "department": "Computer Science",
  "year": 3,
  "hostel": "Hostel A",
  "roomNumber": "A-101",
  "parentPhone": "9876543211"
}
```

**Response**:
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": { /* user object */ },
    "token": "jwt_token_here"
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/auth/Register.tsx
    ↓ (User fills form and clicks Register)
    ↓ authService.register(formData)
Frontend Service: frontend/src/services/authService.ts
    ↓ POST /api/auth/register
Backend Route: backend/src/routes/auth.routes.ts (line 7)
    ↓ AuthController.register
Backend Controller: backend/src/controllers/auth.controller.ts
    ↓ AuthService.register()
Backend Service: backend/src/services/AuthService.ts
    ↓ Check if user exists
    ↓ Hash password
    ↓ Create new User document
Database: backend/src/models/User.ts (MongoDB)
    ↓ Save user to 'users' collection
    ↓ Generate JWT token
    ← Return user + token
Backend Controller: Returns response
    ← Send to frontend
Frontend: Store token in authStore, redirect to dashboard
```

---

### 2. POST /api/auth/login
**Purpose**: Authenticate user and get JWT token

**Request Body**:
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "user": {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": 1,
      "canCreateOutpass": true
    },
    "token": "jwt_token_here"
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/auth/Login.tsx
    ↓ authService.login(email, password)
Frontend Service: frontend/src/services/authService.ts
    ↓ POST /api/auth/login
Backend Route: backend/src/routes/auth.routes.ts (line 8)
    ↓ AuthController.login
Backend Controller: backend/src/controllers/auth.controller.ts
    ↓ AuthService.login()
Backend Service: backend/src/services/AuthService.ts
    ↓ Find user by email (with password field)
Database Query: User.findOne({ email }).select('+password')
    ↓ Compare password hash
    ↓ Generate JWT token
    ← Return user + token
Frontend: authStore.login(user, token)
Frontend Store: frontend/src/store/authStore.ts
    ↓ Save to localStorage
    ↓ Redirect based on role
```

---

### 3. GET /api/auth/profile
**Purpose**: Get current user's profile

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": 1,
    "hostel": "Hostel A",
    "overdueCount": 0,
    "canCreateOutpass": true
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/*/Profile.tsx
    ↓ useEffect(() => fetchProfile())
    ↓ authService.getProfile()
Frontend Service: frontend/src/services/authService.ts
    ↓ GET /api/auth/profile (with token in header)
Backend Middleware: backend/src/middleware/auth.middleware.ts
    ↓ authenticate() - Verify JWT token
    ↓ Attach user to request
Backend Route: backend/src/routes/auth.routes.ts (line 12)
    ↓ AuthController.getProfile
Backend Controller: backend/src/controllers/auth.controller.ts
    ↓ Get user from request.user
Database Query: User.findById(userId)
    ← Return user data
Frontend: Display profile information
```

---

### 4. PUT /api/auth/profile
**Purpose**: Update user profile

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "name": "John Updated",
  "phone": "9876543210",
  "department": "Computer Science",
  "roomNumber": "A-102"
}
```

**Flow**:
```
Frontend: frontend/src/pages/*/Profile.tsx
    ↓ authService.updateProfile(data)
Frontend Service: frontend/src/services/authService.ts
    ↓ PUT /api/auth/profile
Backend Route: backend/src/routes/auth.routes.ts (line 13)
    ↓ authenticate middleware
    ↓ AuthController.updateProfile
Backend Controller: backend/src/controllers/auth.controller.ts
    ↓ AuthService.updateProfile()
Backend Service: backend/src/services/AuthService.ts
Database Update: User.findByIdAndUpdate(userId, data)
    ← Return updated user
Frontend: authStore.updateUser(updatedUser)
```

---

### 5. POST /api/auth/change-password
**Purpose**: Change user password

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "currentPassword": "oldpass123",
  "newPassword": "newpass123"
}
```

**Flow**:
```
Frontend: frontend/src/pages/*/Profile.tsx
    ↓ authService.changePassword(currentPassword, newPassword)
Frontend Service: frontend/src/services/authService.ts
    ↓ POST /api/auth/change-password
Backend Route: backend/src/routes/auth.routes.ts (line 15-19)
    ↓ authenticate middleware
    ↓ AuthController.changePassword
Backend Controller: backend/src/controllers/auth.controller.ts
    ↓ AuthService.changePassword()
Backend Service: backend/src/services/AuthService.ts
    ↓ Find user with password field
    ↓ Verify current password
    ↓ Hash new password
Database Update: user.password = hashedPassword; user.save()
    ← Return success message
Frontend: Show success toast
```

---

### 6. GET /api/auth/system-status
**Purpose**: Get system status (active/inactive, max outpass duration)

**Response**:
```json
{
  "success": true,
  "data": {
    "isSystemActive": true,
    "maxOutpassDuration": 7
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/student/Dashboard.tsx
    ↓ authService.getSystemStatus()
Frontend Service: frontend/src/services/authService.ts
    ↓ GET /api/auth/system-status
Backend Route: backend/src/routes/auth.routes.ts (line 9)
    ↓ AuthController.getSystemStatus
Backend Controller: backend/src/controllers/auth.controller.ts
Database Query: SystemSettings.findOne()
    ← Return system settings
Frontend: Show warning banner if system inactive
```

---

## Student APIs

### 7. POST /api/student/outpasses
**Purpose**: Create a new outpass request

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "reason": "Going home for family function",
  "destination": "Mumbai, Maharashtra",
  "fromDate": "2024-03-20T10:00:00.000Z",
  "toDate": "2024-03-22T18:00:00.000Z",
  "purpose": "home",
  "emergencyContact": "9876543210"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Outpass created successfully",
  "data": {
    "_id": "outpass_id",
    "student": "student_id",
    "status": "pending",
    "fromDate": "2024-03-20T10:00:00.000Z",
    "toDate": "2024-03-22T18:00:00.000Z"
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/student/CreateOutpass.tsx
    ↓ Check user.canCreateOutpass
    ↓ If false, show toast "Contact admin"
    ↓ If true, outpassService.createOutpass(data)
Frontend Service: frontend/src/services/outpassService.ts
    ↓ POST /api/student/outpasses
Backend Route: backend/src/routes/student.routes.ts (line 17)
    ↓ authenticate + authorize(STUDENT) middleware
    ↓ StudentController.createOutpass
Backend Controller: backend/src/controllers/student.controller.ts
    ↓ StudentService.validateOutpassCreation()
Backend Service: backend/src/services/StudentService.ts
    ↓ Check system active
    ↓ Check user.canCreateOutpass
    ↓ Check overdueCount < 3
    ↓ Check duration <= maxOutpassDuration
    ↓ If valid, OutpassService.createOutpass()
Backend Service: backend/src/services/OutpassService.ts
    ↓ Create Outpass document
Database: backend/src/models/Outpass.ts
    ↓ Save to 'outpasses' collection
    ↓ Create notification for warden
    ← Return created outpass
Frontend: Navigate to outpass details page
```

---

### 8. GET /api/student/outpasses
**Purpose**: Get student's outpasses with filters

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `status`: Filter by status (pending, approved, rejected, etc.)
- `purpose`: Filter by purpose (home, medical, personal, etc.)
- `search`: Search in reason/destination
- `dateRange`: Predefined range (today, week, month)
- `fromDate`: Custom start date
- `toDate`: Custom end date
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "outpass_id",
      "student": { "name": "John Doe", "rollNumber": "CS2021001" },
      "status": "approved",
      "fromDate": "2024-03-20T10:00:00.000Z",
      "toDate": "2024-03-22T18:00:00.000Z",
      "purpose": "home",
      "destination": "Mumbai"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/student/Dashboard.tsx
    ↓ outpassService.getMyOutpasses(filters)
Frontend Service: frontend/src/services/outpassService.ts
    ↓ GET /api/student/outpasses?status=pending&page=1
Backend Route: backend/src/routes/student.routes.ts (line 18)
    ↓ authenticate + authorize(STUDENT)
    ↓ StudentController.getMyOutpasses
Backend Controller: backend/src/controllers/student.controller.ts
    ↓ Build query filters
    ↓ OutpassService.getStudentOutpasses()
Backend Service: backend/src/services/OutpassService.ts
Database Query: Outpass.find({ student: userId, ...filters })
    ↓ .populate('student')
    ↓ .sort({ createdAt: -1 })
    ↓ .skip((page-1) * limit)
    ↓ .limit(limit)
    ← Return outpasses + pagination
Frontend Component: frontend/src/components/OutpassListTable.tsx
    ↓ Display in table
```

---

### 9. GET /api/student/outpasses/:id
**Purpose**: Get single outpass details

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "outpass_id",
    "student": {
      "name": "John Doe",
      "rollNumber": "CS2021001",
      "hostel": "Hostel A"
    },
    "status": "approved",
    "fromDate": "2024-03-20T10:00:00.000Z",
    "toDate": "2024-03-22T18:00:00.000Z",
    "reason": "Family function",
    "destination": "Mumbai",
    "purpose": "home",
    "qrCode": "base64_qr_code_image",
    "approvedBy": {
      "name": "Warden Name"
    },
    "approvedAt": "2024-03-19T15:30:00.000Z"
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/student/OutpassDetails.tsx
    ↓ useParams() to get outpassId
    ↓ outpassService.getOutpassById(id)
Frontend Service: frontend/src/services/outpassService.ts
    ↓ GET /api/student/outpasses/:id
Backend Route: backend/src/routes/student.routes.ts (line 19)
    ↓ StudentController.getOutpassById
Backend Controller: backend/src/controllers/student.controller.ts
Database Query: Outpass.findById(id)
    ↓ .populate('student')
    ↓ .populate('approvedBy', 'name')
    ↓ .populate('rejectedBy', 'name')
    ↓ Verify ownership (outpass.student._id === userId)
    ← Return outpass details
Frontend: Display full outpass details with QR code
```

---

### 10. GET /api/student/outpasses/:id/download
**Purpose**: Download outpass PDF

**Headers**: `Authorization: Bearer <token>`

**Response**: PDF file (application/pdf)

**Flow**:
```
Frontend: frontend/src/pages/student/Dashboard.tsx
    ↓ Click download button
    ↓ outpassService.downloadOutpassPDF(id)
Frontend Service: frontend/src/services/outpassService.ts
    ↓ GET /api/student/outpasses/:id/download
    ↓ responseType: 'blob'
Backend Route: backend/src/routes/student.routes.ts (line 20)
    ↓ StudentController.downloadOutpassPDF
Backend Controller: backend/src/controllers/student.controller.ts
    ↓ StudentService.downloadOutpassPDF()
Backend Service: backend/src/services/StudentService.ts
    ↓ Verify outpass exists and belongs to student
    ↓ Check status is approved/checked_out/checked_in
    ↓ PDFService.generateOutpassPDF()
Backend Service: backend/src/services/PDFService.ts
    ↓ Create PDF with student details, QR code
    ← Return PDF buffer
Frontend: Create blob URL and trigger download
```

---

### 11. PATCH /api/student/outpasses/:id/cancel
**Purpose**: Cancel a pending outpass

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Outpass cancelled successfully"
}
```

**Flow**:
```
Frontend: frontend/src/pages/student/OutpassDetails.tsx
    ↓ Click Cancel button
    ↓ outpassService.cancelOutpass(id)
Frontend Service: frontend/src/services/outpassService.ts
    ↓ PATCH /api/student/outpasses/:id/cancel
Backend Route: backend/src/routes/student.routes.ts (line 21)
    ↓ StudentController.cancelOutpass
Backend Controller: backend/src/controllers/student.controller.ts
Database Query: Outpass.findById(id)
    ↓ Verify ownership
    ↓ Check status is 'pending'
Database Update: outpass.status = 'cancelled'
    ↓ outpass.save()
    ← Return success
Frontend: Refresh outpass details
```

---

### 12. GET /api/student/latest-outpass
**Purpose**: Get student's most recent outpass

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "outpass_id",
    "status": "approved",
    "fromDate": "2024-03-20T10:00:00.000Z",
    "toDate": "2024-03-22T18:00:00.000Z"
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/student/Dashboard.tsx
    ↓ outpassService.getLatestOutpass()
Frontend Service: frontend/src/services/outpassService.ts
    ↓ GET /api/student/latest-outpass
Backend Route: backend/src/routes/student.routes.ts (line 13)
    ↓ StudentController.getLatestOutpass
Backend Controller: backend/src/controllers/student.controller.ts
    ↓ StudentService.getLatestOutpass()
Backend Service: backend/src/services/StudentService.ts
Database Query: Outpass.findOne({ student: userId })
    ↓ .sort({ createdAt: -1 })
    ↓ .limit(1)
    ← Return latest outpass or null
Frontend Component: frontend/src/components/LatestOutpassCard.tsx
    ↓ Display in card
```

---

### 13. GET /api/student/analytics
**Purpose**: Get student's outpass analytics

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "approved": 15,
    "pending": 2,
    "rejected": 1,
    "overdue": 0
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/student/Dashboard.tsx
    ↓ outpassService.getAnalytics()
Frontend Service: frontend/src/services/outpassService.ts
    ↓ GET /api/student/analytics
Backend Route: backend/src/routes/student.routes.ts (line 14)
    ↓ StudentController.getAnalytics
Backend Controller: backend/src/controllers/student.controller.ts
    ↓ StudentService.getAnalytics()
Backend Service: backend/src/services/StudentService.ts
Database Queries: Multiple Outpass.countDocuments()
    ↓ Count by status: approved, checked_out, checked_in
    ↓ Count pending, rejected, overdue
    ← Return counts object
Frontend Components: 
    ↓ frontend/src/components/StatusTiles.tsx (tiles)
    ↓ frontend/src/components/AnalyticsChart.tsx (chart)
```

---

## Warden APIs

### 14. GET /api/warden/hostel-info
**Purpose**: Get warden's hostel information

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "hostelName": "Hostel A",
    "totalStudents": 150,
    "activeOutpasses": 12,
    "pendingApprovals": 5
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/warden/Dashboard.tsx
    ↓ wardenService.getHostelInfo()
Frontend Service: frontend/src/services/wardenService.ts
    ↓ GET /api/warden/hostel-info
Backend Route: backend/src/routes/warden.routes.ts (line 12)
    ↓ authenticate + authorize(WARDEN)
    ↓ WardenController.getHostelInfo
Backend Controller: backend/src/controllers/warden.controller.ts
    ↓ WardenService.getHostelInfo()
Backend Service: backend/src/services/WardenService.ts
    ↓ Get warden's hostel from user.hostel
Database Queries:
    ↓ User.countDocuments({ hostel, role: STUDENT })
    ↓ Outpass.countDocuments({ hostel, status: 'checked_out' })
    ↓ Outpass.countDocuments({ hostel, status: 'pending' })
    ← Return hostel statistics
Frontend Component: frontend/src/components/warden/HostelContextBanner.tsx
```

---

### 15. GET /api/warden/statistics
**Purpose**: Get outpass statistics for warden's hostel

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 100,
    "pending": 5,
    "approved": 80,
    "rejected": 10,
    "checkedOut": 3,
    "overdue": 2
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/warden/Dashboard.tsx
    ↓ wardenService.getOutpassStats()
Frontend Service: frontend/src/services/wardenService.ts
    ↓ GET /api/warden/statistics
Backend Route: backend/src/routes/warden.routes.ts (line 13)
    ↓ WardenController.getStatistics
Backend Controller: backend/src/controllers/warden.controller.ts
    ↓ WardenService.getStatistics()
Backend Service: backend/src/services/WardenService.ts
Database Aggregation: Outpass.aggregate([
    { $match: { hostel: wardenHostel } },
    { $group: { _id: '$status', count: { $sum: 1 } } }
])
    ← Return status counts
Frontend Component: frontend/src/components/warden/WardenStatisticsTiles.tsx
```

---

### 16. GET /api/warden/analytics
**Purpose**: Get analytics data for charts

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "byStatus": {
      "approved": 80,
      "pending": 5,
      "rejected": 10
    },
    "byPurpose": {
      "home": 50,
      "medical": 20,
      "personal": 15
    }
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/warden/Dashboard.tsx
    ↓ wardenService.getAnalytics()
Frontend Service: frontend/src/services/wardenService.ts
    ↓ GET /api/warden/analytics
Backend Route: backend/src/routes/warden.routes.ts (line 14)
    ↓ WardenController.getAnalytics
Backend Controller: backend/src/controllers/warden.controller.ts
    ↓ WardenService.getAnalytics()
Backend Service: backend/src/services/WardenService.ts
Database Aggregations:
    ↓ Group by status
    ↓ Group by purpose
    ← Return analytics object
Frontend Component: frontend/src/components/warden/WardenAnalyticsChart.tsx
```

---

### 17. GET /api/warden/outpasses-enhanced
**Purpose**: Get outpasses with filters for warden's hostel

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `status`: Filter by status
- `search`: Search student name/roll number
- `fromDate`: Date range start
- `toDate`: Date range end
- `page`: Page number
- `limit`: Items per page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "outpass_id",
      "student": {
        "name": "John Doe",
        "rollNumber": "CS2021001",
        "hostel": "Hostel A"
      },
      "status": "pending",
      "fromDate": "2024-03-20T10:00:00.000Z",
      "toDate": "2024-03-22T18:00:00.000Z",
      "purpose": "home",
      "createdAt": "2024-03-19T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "pages": 5
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/warden/Dashboard.tsx
    ↓ Apply filters
    ↓ wardenService.getOutpasses(filters)
Frontend Service: frontend/src/services/wardenService.ts
    ↓ GET /api/warden/outpasses-enhanced?status=pending
Backend Route: backend/src/routes/warden.routes.ts (line 17)
    ↓ WardenController.getOutpassesEnhanced
Backend Controller: backend/src/controllers/warden.controller.ts
    ↓ WardenService.getOutpassesEnhanced()
Backend Service: backend/src/services/WardenService.ts
    ↓ Build query with warden's hostel
Database Query: Outpass.find({ hostel: wardenHostel, ...filters })
    ↓ .populate('student', 'name rollNumber hostel')
    ↓ .sort({ createdAt: -1 })
    ↓ .skip().limit()
    ← Return outpasses + pagination
Frontend Component: frontend/src/components/warden/WardenOutpassTable.tsx
```

---

### 18. GET /api/warden/outpasses/:id
**Purpose**: Get single outpass details for approval/rejection

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "outpass_id",
    "student": {
      "name": "John Doe",
      "rollNumber": "CS2021001",
      "phone": "9876543210",
      "parentPhone": "9876543211"
    },
    "status": "pending",
    "fromDate": "2024-03-20T10:00:00.000Z",
    "toDate": "2024-03-22T18:00:00.000Z",
    "reason": "Family function",
    "destination": "Mumbai",
    "emergencyContact": "9876543210"
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/warden/OutpassDetails.tsx
    ↓ wardenService.getOutpassById(id)
Frontend Service: frontend/src/services/wardenService.ts
    ↓ GET /api/warden/outpasses/:id
Backend Route: backend/src/routes/warden.routes.ts (line 18)
    ↓ WardenController.getOutpassById
Backend Controller: backend/src/controllers/warden.controller.ts
    ↓ WardenService.getOutpassById()
Backend Service: backend/src/services/WardenService.ts
Database Query: Outpass.findById(id)
    ↓ .populate('student')
    ↓ Verify hostel matches warden's hostel
    ← Return outpass details
Frontend: Display with Approve/Reject buttons
```

---

### 19. POST /api/warden/outpasses/:id/approve
**Purpose**: Approve an outpass request

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "remarks": "Approved for family function"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Outpass approved successfully",
  "data": {
    "_id": "outpass_id",
    "status": "approved",
    "qrCode": "base64_qr_code_image"
  }
}
```

**Flow**:
```
Frontend: frontend/src/components/warden/ApproveModal.tsx
    ↓ Click Approve button
    ↓ wardenService.approveOutpass(id, remarks)
Frontend Service: frontend/src/services/wardenService.ts
    ↓ POST /api/warden/outpasses/:id/approve
Backend Route: backend/src/routes/warden.routes.ts (line 19)
    ↓ WardenController.approveOutpassNew
Backend Controller: backend/src/controllers/warden.controller.ts
    ↓ WardenService.approveOutpass()
Backend Service: backend/src/services/WardenService.ts
    ↓ Find outpass and verify hostel
    ↓ Check status is 'pending'
    ↓ QRService.generateQRCode()
Backend Service: backend/src/services/QRService.ts
    ↓ Generate QR code with outpass ID
Database Update: 
    ↓ outpass.status = 'approved'
    ↓ outpass.approvedBy = wardenId
    ↓ outpass.approvedAt = now
    ↓ outpass.qrCode = qrCodeBase64
    ↓ outpass.save()
    ↓ NotificationService.create() - Notify student
Backend Service: backend/src/services/NotificationService.ts
    ↓ Create notification document
    ← Return approved outpass
Frontend: Show success toast, refresh list
```

---

### 20. POST /api/warden/outpasses/:id/reject
**Purpose**: Reject an outpass request

**Headers**: `Authorization: Bearer <token>`

**Request Body**:
```json
{
  "reason": "Insufficient reason provided"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Outpass rejected successfully"
}
```

**Flow**:
```
Frontend: frontend/src/components/warden/RejectModal.tsx
    ↓ Click Reject button
    ↓ wardenService.rejectOutpass(id, reason)
Frontend Service: frontend/src/services/wardenService.ts
    ↓ POST /api/warden/outpasses/:id/reject
Backend Route: backend/src/routes/warden.routes.ts (line 20)
    ↓ WardenController.rejectOutpassNew
Backend Controller: backend/src/controllers/warden.controller.ts
    ↓ WardenService.rejectOutpass()
Backend Service: backend/src/services/WardenService.ts
Database Update:
    ↓ outpass.status = 'rejected'
    ↓ outpass.rejectedBy = wardenId
    ↓ outpass.rejectedAt = now
    ↓ outpass.rejectionReason = reason
    ↓ outpass.save()
    ↓ NotificationService.create() - Notify student
    ← Return success
Frontend: Show success toast, refresh list
```

---

## Admin APIs

### 21. GET /api/admin/statistics/system
**Purpose**: Get overall system statistics

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "totalUsers": 500,
    "totalStudents": 450,
    "totalWardens": 10,
    "totalSecurity": 5,
    "totalOutpasses": 1000,
    "activeOutpasses": 25,
    "pendingApprovals": 15
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Dashboard.tsx
    ↓ adminService.getSystemStatistics()
Frontend Service: frontend/src/services/adminService.ts
    ↓ GET /api/admin/statistics/system
Backend Route: backend/src/routes/admin.routes.ts (line 11)
    ↓ authenticate + adminOnly middleware
Backend Middleware: backend/src/middleware/role.middleware.ts
    ↓ Verify user.role === ADMIN
    ↓ AdminController.getSystemStatistics
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.getSystemStatistics()
Backend Service: backend/src/services/AdminService.ts
Database Queries:
    ↓ User.countDocuments() - by role
    ↓ Outpass.countDocuments() - by status
    ← Return statistics object
Frontend: Display in dashboard tiles
```

---

### 22. GET /api/admin/statistics/users
**Purpose**: Get user statistics by role

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "students": 450,
    "wardens": 10,
    "security": 5,
    "admins": 2
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Dashboard.tsx
    ↓ adminService.getUserStatistics()
Frontend Service: frontend/src/services/adminService.ts
    ↓ GET /api/admin/statistics/users
Backend Route: backend/src/routes/admin.routes.ts (line 12)
    ↓ AdminController.getUserStatistics
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.getUserStatistics()
Backend Service: backend/src/services/AdminService.ts
Database Aggregation: User.aggregate([
    { $group: { _id: '$role', count: { $sum: 1 } } }
])
    ← Return role counts
Frontend: Display in statistics section
```

---

### 23. GET /api/admin/statistics/outpasses
**Purpose**: Get outpass statistics with breakdown

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "total": 1000,
    "byStatus": {
      "pending": 15,
      "approved": 800,
      "rejected": 100,
      "checked_out": 25,
      "overdue": 10
    },
    "byPurpose": {
      "home": 500,
      "medical": 200,
      "personal": 300
    }
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Dashboard.tsx
    ↓ adminService.getOutpassStatistics()
Frontend Service: frontend/src/services/adminService.ts
    ↓ GET /api/admin/statistics/outpasses
Backend Route: backend/src/routes/admin.routes.ts (line 13)
    ↓ AdminController.getOutpassStatistics
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.getOutpassStatistics()
Backend Service: backend/src/services/AdminService.ts
Database Aggregations:
    ↓ Group by status
    ↓ Group by purpose
    ← Return statistics with nested structure
Frontend: Display in charts and tiles
```

---

### 24. GET /api/admin/statistics/hostels
**Purpose**: Get hostel-wise statistics

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "hostelName": "Hostel A",
      "totalStudents": 150,
      "totalOutpasses": 300,
      "pendingOutpasses": 5,
      "approvedOutpasses": 250,
      "rejectedOutpasses": 30,
      "activeOutpasses": 8
    }
  ]
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/HostelStats.tsx
    ↓ adminService.getHostelStatistics()
Frontend Service: frontend/src/services/adminService.ts
    ↓ GET /api/admin/statistics/hostels
Backend Route: backend/src/routes/admin.routes.ts (line 14)
    ↓ AdminController.getHostelStatistics
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.getHostelStatistics()
Backend Service: backend/src/services/AdminService.ts
Database Aggregations:
    ↓ Get all hostels from Hostel collection
    ↓ For each hostel:
        ↓ Count students
        ↓ Count outpasses by status
    ← Return array of hostel statistics
Frontend: Display in table with statistics
```

---

### 25. GET /api/admin/users
**Purpose**: Get all users with filters and pagination

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Query Parameters**:
- `role`: Filter by role (1=Student, 2=Warden, 3=Security, 4=Admin)
- `hostel`: Filter by hostel name
- `search`: Search by name/email/roll number
- `page`: Page number
- `limit`: Items per page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "user_id",
      "name": "John Doe",
      "email": "john@example.com",
      "role": 1,
      "rollNumber": "CS2021001",
      "hostel": "Hostel A",
      "canCreateOutpass": true,
      "overdueCount": 0,
      "isActive": true
    }
  ],
  "pagination": {
    "total": 450,
    "page": 1,
    "pages": 45
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Users.tsx
    ↓ Apply filters
    ↓ adminService.getAllUsers(filters)
Frontend Service: frontend/src/services/adminService.ts
    ↓ GET /api/admin/users?role=1&hostel=Hostel A
Backend Route: backend/src/routes/admin.routes.ts (line 18)
    ↓ AdminController.getAllUsers
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.getAllUsers()
Backend Service: backend/src/services/AdminService.ts
    ↓ Build query with filters
Database Query: User.find(filters)
    ↓ .sort({ createdAt: -1 })
    ↓ .skip().limit()
    ← Return users + pagination
Frontend: Display in table with actions
```

---

### 26. GET /api/admin/users/:id
**Purpose**: Get single user details

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "user_id",
    "name": "John Doe",
    "email": "john@example.com",
    "role": 1,
    "rollNumber": "CS2021001",
    "hostel": "Hostel A",
    "canCreateOutpass": true,
    "overdueCount": 0,
    "overrideCount": 2,
    "lastOverrideDate": "2024-03-15T10:00:00.000Z",
    "lastOverrideBy": "Admin Name"
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Users.tsx
    ↓ Click "View Details" button
    ↓ adminService.getUserById(id)
Frontend Service: frontend/src/services/adminService.ts
    ↓ GET /api/admin/users/:id
Backend Route: backend/src/routes/admin.routes.ts (line 19)
    ↓ AdminController.getUserById
Backend Controller: backend/src/controllers/admin.controller.ts
Database Query: User.findById(id)
    ↓ .populate('lastOverrideBy', 'name')
    ← Return user details
Frontend: Display in modal with all details
```

---

### 27. POST /api/admin/users
**Purpose**: Create a new user

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "name": "New User",
  "email": "newuser@example.com",
  "password": "password123",
  "phone": "9876543210",
  "role": 1,
  "rollNumber": "CS2021002",
  "department": "Computer Science",
  "year": 2,
  "hostel": "Hostel A",
  "roomNumber": "A-201"
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Users.tsx
    ↓ Click "Add User" button
    ↓ Fill form in modal
    ↓ adminService.createUser(data)
Frontend Service: frontend/src/services/adminService.ts
    ↓ POST /api/admin/users
Backend Route: backend/src/routes/admin.routes.ts (line 20)
    ↓ AdminController.createUser
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.createUser()
Backend Service: backend/src/services/AdminService.ts
    ↓ Check if email exists
    ↓ Hash password
    ↓ Create User document
Database: backend/src/models/User.ts
    ↓ Save to 'users' collection
    ↓ Log action in AdminActionLog
    ← Return created user
Frontend: Refresh user list, show success toast
```

---

### 28. PUT /api/admin/users/:id
**Purpose**: Update user details

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "name": "Updated Name",
  "phone": "9876543210",
  "hostel": "Hostel B",
  "roomNumber": "B-101"
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Users.tsx
    ↓ Click Edit button
    ↓ Update form in modal
    ↓ adminService.updateUser(id, data)
Frontend Service: frontend/src/services/adminService.ts
    ↓ PUT /api/admin/users/:id
Backend Route: backend/src/routes/admin.routes.ts (line 21)
    ↓ AdminController.updateUser
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.updateUser()
Backend Service: backend/src/services/AdminService.ts
Database Update: User.findByIdAndUpdate(id, data)
    ↓ Log action in AdminActionLog
    ← Return updated user
Frontend: Refresh user list
```

---

### 29. DELETE /api/admin/users/:id
**Purpose**: Delete a user

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response**:
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Users.tsx
    ↓ Click Delete button
    ↓ Confirm deletion
    ↓ adminService.deleteUser(id)
Frontend Service: frontend/src/services/adminService.ts
    ↓ DELETE /api/admin/users/:id
Backend Route: backend/src/routes/admin.routes.ts (line 22)
    ↓ AdminController.deleteUser
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.deleteUser()
Backend Service: backend/src/services/AdminService.ts
Database Delete: User.findByIdAndDelete(id)
    ↓ Also delete user's outpasses
    ↓ Log action in AdminActionLog
    ← Return success
Frontend: Refresh user list
```

---

### 30. PATCH /api/admin/users/:id/outpass-permission
**Purpose**: Toggle user's outpass creation permission

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "canCreateOutpass": false
}
```

**Response**:
```json
{
  "success": true,
  "message": "Outpass permission updated successfully",
  "data": {
    "canCreateOutpass": false
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Users.tsx
    ↓ Toggle switch in user details modal
    ↓ adminService.toggleOutpassPermission(id, value)
Frontend Service: frontend/src/services/adminService.ts
    ↓ PATCH /api/admin/users/:id/outpass-permission
Backend Route: backend/src/routes/admin.routes.ts (line 26)
    ↓ AdminController.toggleOutpassPermission
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.toggleOutpassPermission()
Backend Service: backend/src/services/AdminService.ts
Database Update: User.findByIdAndUpdate(id, {
    canCreateOutpass: value,
    overrideCount: increment by 1,
    lastOverrideDate: now,
    lastOverrideBy: adminId
})
    ↓ Log action in AdminActionLog
    ← Return updated user
Frontend: User list refreshes automatically
Student: When trying to create outpass, sees toast "Contact admin"
```

---

### 31. GET /api/admin/outpasses
**Purpose**: Get all outpasses with filters

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Query Parameters**:
- `status`: Filter by status
- `hostel`: Filter by hostel
- `purpose`: Filter by purpose
- `search`: Search student name/roll number
- `dateFrom`: Date range start
- `dateTo`: Date range end
- `page`: Page number
- `limit`: Items per page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "outpass_id",
      "student": {
        "_id": "student_id",
        "name": "John Doe",
        "rollNumber": "CS2021001",
        "hostel": "Hostel A"
      },
      "status": "approved",
      "purpose": "home",
      "fromDate": "2024-03-20T10:00:00.000Z",
      "toDate": "2024-03-22T18:00:00.000Z",
      "qrCode": "base64_qr_code"
    }
  ],
  "pagination": {
    "total": 450,
    "page": 1,
    "pages": 45
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Dashboard.tsx
    ↓ Apply filters
    ↓ adminService.getAllOutpasses(filters)
Frontend Service: frontend/src/services/adminService.ts
    ↓ GET /api/admin/outpasses?status=approved&hostel=Hostel A
Backend Route: backend/src/routes/admin.routes.ts (line 27)
    ↓ AdminController.getAllOutpasses
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.getAllOutpasses()
Backend Service: backend/src/services/AdminService.ts
    ↓ Build query with filters
Database Query: Outpass.find(filters)
    ↓ .populate('student approvedBy rejectedBy')
    ↓ .sort({ createdAt: -1 })
    ↓ .skip().limit()
    ← Return outpasses + pagination
Frontend: Display in table with filters
```

---

### 32. GET /api/admin/outpasses/:id
**Purpose**: Get single outpass details (admin view)

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "outpass_id",
    "student": {
      "_id": "student_id",
      "name": "John Doe",
      "rollNumber": "CS2021001",
      "hostel": "Hostel A"
    },
    "status": "approved",
    "purpose": "home",
    "reason": "Family function",
    "destination": "Mumbai",
    "fromDate": "2024-03-20T10:00:00.000Z",
    "toDate": "2024-03-22T18:00:00.000Z",
    "approvedBy": {
      "_id": "warden_id",
      "name": "Warden Name"
    },
    "approvedAt": "2024-03-19T15:00:00.000Z",
    "qrCode": "base64_qr_code"
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/OutpassDetails.tsx
    ↓ adminService.getOutpassById(id)
Frontend Service: frontend/src/services/adminService.ts
    ↓ GET /api/admin/outpasses/:id
Backend Route: backend/src/routes/admin.routes.ts (line 28)
    ↓ AdminController.getOutpassById
Backend Controller: backend/src/controllers/admin.controller.ts
Database Query: Outpass.findById(id)
    ↓ .populate('student approvedBy rejectedBy checkOutBy checkInBy')
    ← Return outpass details
Frontend: Display full details with override options
```

---

### 33. POST /api/admin/outpasses/:id/override
**Purpose**: Override outpass status (admin only)

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "status": "approved",
  "reason": "Emergency approval"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Outpass status overridden successfully"
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/OutpassDetails.tsx
    ↓ Click Override button
    ↓ adminService.overrideOutpassStatus(id, status, reason)
Frontend Service: frontend/src/services/adminService.ts
    ↓ POST /api/admin/outpasses/:id/override
Backend Route: backend/src/routes/admin.routes.ts (line 29)
    ↓ AdminController.overrideOutpassStatus
Backend Controller: backend/src/controllers/admin.controller.ts
Database Update:
    ↓ outpass.status = newStatus
    ↓ outpass.save()
    ↓ AdminActionLog.create()
    ← Return success
Frontend: Refresh outpass details
```

---

### 34. GET /api/admin/settings
**Purpose**: Get system settings

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response**:
```json
{
  "success": true,
  "data": {
    "isSystemActive": true,
    "maxOutpassDuration": 7,
    "autoApprovalEnabled": false,
    "reminderHoursBefore": 24
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Settings.tsx
    ↓ adminService.getSystemSettings()
Frontend Service: frontend/src/services/adminService.ts
    ↓ GET /api/admin/settings
Backend Route: backend/src/routes/admin.routes.ts (line 30)
    ↓ AdminController.getSystemSettings
Backend Controller: backend/src/controllers/admin.controller.ts
Database Query: SystemSettings.findOne()
    ← Return settings or default values
Frontend: Display in settings form
```

---

### 35. PUT /api/admin/settings
**Purpose**: Update system settings

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "isSystemActive": false,
  "maxOutpassDuration": 5,
  "autoApprovalEnabled": false,
  "reminderHoursBefore": 48
}
```

**Response**:
```json
{
  "success": true,
  "message": "System settings updated successfully",
  "data": {
    "isSystemActive": false,
    "maxOutpassDuration": 5
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/Settings.tsx
    ↓ Click Save button
    ↓ adminService.updateSystemSettings(settings)
Frontend Service: frontend/src/services/adminService.ts
    ↓ PUT /api/admin/settings
Backend Route: backend/src/routes/admin.routes.ts (line 31)
    ↓ AdminController.updateSystemSettings
Backend Controller: backend/src/controllers/admin.controller.ts
    ↓ AdminService.updateSystemSettings()
Backend Service: backend/src/services/AdminService.ts
Database Update: SystemSettings.findOneAndUpdate()
    ↓ Log action in AdminActionLog
    ← Return updated settings
Frontend: Show success toast
```

---

## Security APIs

### 36. GET /api/security/statistics
**Purpose**: Get security dashboard statistics

**Headers**: `Authorization: Bearer <token>` (Security only)

**Response**:
```json
{
  "success": true,
  "data": {
    "activeOutpasses": 15,
    "checkedOutToday": 45,
    "checkedInToday": 38,
    "overdueOutpasses": 3,
    "totalScansToday": 83
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/security/Dashboard.tsx
    ↓ securityService.getStatistics()
Frontend Service: frontend/src/services/securityService.ts
    ↓ GET /api/security/statistics
Backend Route: backend/src/routes/security.routes.ts (line 10)
    ↓ SecurityController.getStatistics
Backend Controller: backend/src/controllers/security.controller.ts
    ↓ SecurityService.getStatistics()
Backend Service: backend/src/services/SecurityService.ts
    ↓ Multiple queries:
    ↓ Outpass.countDocuments({status:'checked_out'})
    ↓ SecurityLog.countDocuments({type:'check_out',date:today})
    ↓ SecurityLog.countDocuments({type:'check_in',date:today})
    ↓ Outpass.countDocuments({status:'overdue'})
    ← Return statistics
Frontend: Display in tiles
```

---

### 37. POST /api/security/validate-qr
**Purpose**: Validate QR code and get outpass details

**Headers**: `Authorization: Bearer <token>` (Security only)

**Request Body**:
```json
{
  "qrCode": "base64_qr_code_string"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "outpass": {
      "_id": "outpass_id",
      "student": {
        "name": "John Doe",
        "rollNumber": "CS2021001",
        "photo": "photo_url"
      },
      "status": "approved",
      "fromDate": "2024-03-20T10:00:00.000Z",
      "toDate": "2024-03-22T18:00:00.000Z"
    },
    "canCheckOut": true,
    "canCheckIn": false,
    "message": "Valid for check-out"
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/security/ScanQR.tsx
    ↓ QR code scanned
    ↓ securityService.validateQR(qrCode)
Frontend Service: frontend/src/services/securityService.ts
    ↓ POST /api/security/validate-qr
Backend Route: backend/src/routes/security.routes.ts (line 11)
    ↓ Middleware: rateLimitScan, validateQRCode
    ↓ SecurityController.validateQR
Backend Controller: backend/src/controllers/security.controller.ts
    ↓ SecurityService.validateQR()
Backend Service: backend/src/services/SecurityService.ts
    ↓ Decode QR code to get outpass ID
Database Query: Outpass.findById(id).populate('student')
    ↓ Check status (must be 'approved' or 'checked_out')
    ↓ Check dates (current time within range)
    ↓ Determine canCheckOut/canCheckIn
    ← Return validation result
Frontend: Display scan result with action buttons
```

---

### 38. POST /api/security/check-out
**Purpose**: Check out student

**Headers**: `Authorization: Bearer <token>` (Security only)

**Request Body**:
```json
{
  "outpassId": "outpass_id",
  "remarks": "Checked out at main gate"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Student checked out successfully",
  "data": {
    "_id": "outpass_id",
    "status": "checked_out",
    "checkOutTime": "2024-03-20T10:15:00.000Z"
  }
}
```

**Flow**:
```
Frontend: frontend/src/components/security/ScanResultCard.tsx
    ↓ Click Check Out button
    ↓ securityService.checkOut(outpassId, remarks)
Frontend Service: frontend/src/services/securityService.ts
    ↓ POST /api/security/check-out
Backend Route: backend/src/routes/security.routes.ts (line 12)
    ↓ Middleware: validateCheckOutRequest
    ↓ SecurityController.checkOut
Backend Controller: backend/src/controllers/security.controller.ts
    ↓ SecurityService.checkOut()
Backend Service: backend/src/services/SecurityService.ts
Database Update:
    ↓ outpass.status = 'checked_out'
    ↓ outpass.checkOutTime = now
    ↓ outpass.checkOutBy = securityId
    ↓ outpass.checkOutRemarks = remarks
    ↓ outpass.save()
    ↓ SecurityLog.create({type:'check_out'})
    ↓ NotificationService.create() - Notify student
    ← Return updated outpass
Frontend: Show success message
```

---

### 39. POST /api/security/check-in
**Purpose**: Check in student

**Headers**: `Authorization: Bearer <token>` (Security only)

**Request Body**:
```json
{
  "outpassId": "outpass_id",
  "remarks": "Checked in at main gate"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Student checked in successfully",
  "data": {
    "_id": "outpass_id",
    "status": "checked_in",
    "checkInTime": "2024-03-22T17:30:00.000Z"
  }
}
```

**Flow**:
```
Frontend: frontend/src/components/security/ScanResultCard.tsx
    ↓ Click Check In button
    ↓ securityService.checkIn(outpassId, remarks)
Frontend Service: frontend/src/services/securityService.ts
    ↓ POST /api/security/check-in
Backend Route: backend/src/routes/security.routes.ts (line 13)
    ↓ Middleware: validateCheckInRequest
    ↓ SecurityController.checkIn
Backend Controller: backend/src/controllers/security.controller.ts
    ↓ SecurityService.checkIn()
Backend Service: backend/src/services/SecurityService.ts
    ↓ Check if overdue (checkInTime > toDate)
Database Update:
    ↓ If overdue:
    ↓   outpass.status = 'overdue'
    ↓   user.overdueCount++
    ↓   If user.overdueCount >= 3:
    ↓     user.canCreateOutpass = false
    ↓ Else:
    ↓   outpass.status = 'checked_in'
    ↓ outpass.checkInTime = now
    ↓ outpass.checkInBy = securityId
    ↓ outpass.checkInRemarks = remarks
    ↓ outpass.save() + user.save()
    ↓ SecurityLog.create({type:'check_in'})
    ↓ NotificationService.create() - Notify student
    ← Return updated outpass
Frontend: Show success/warning message
```

---

### 40. GET /api/security/active-outpasses
**Purpose**: Get currently checked-out students

**Headers**: `Authorization: Bearer <token>` (Security only)

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "outpass_id",
      "student": {
        "name": "John Doe",
        "rollNumber": "CS2021001",
        "hostel": "Hostel A"
      },
      "checkOutTime": "2024-03-20T10:15:00.000Z",
      "toDate": "2024-03-22T18:00:00.000Z",
      "destination": "Mumbai"
    }
  ]
}
```

**Flow**:
```
Frontend: frontend/src/pages/security/Dashboard.tsx
    ↓ securityService.getActiveOutpasses()
Frontend Service: frontend/src/services/securityService.ts
    ↓ GET /api/security/active-outpasses
Backend Route: backend/src/routes/security.routes.ts (line 14)
    ↓ SecurityController.getActiveOutpasses
Backend Controller: backend/src/controllers/security.controller.ts
    ↓ SecurityService.getActiveOutpasses()
Backend Service: backend/src/services/SecurityService.ts
Database Query: Outpass.find({status:'checked_out'})
    ↓ .populate('student')
    ↓ .sort({checkOutTime:-1})
    ← Return active outpasses
Frontend: Display in table
```

---

### 41. GET /api/security/history
**Purpose**: Get check-in/out history

**Headers**: `Authorization: Bearer <token>` (Security only)

**Query Parameters**:
- `type`: Filter by type (check_in/check_out)
- `fromDate`: Date range start
- `toDate`: Date range end
- `search`: Search student name/roll number
- `page`: Page number
- `limit`: Items per page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "log_id",
      "type": "check_out",
      "outpass": {
        "student": {
          "name": "John Doe",
          "rollNumber": "CS2021001"
        }
      },
      "performedBy": {
        "name": "Security Guard"
      },
      "timestamp": "2024-03-20T10:15:00.000Z",
      "remarks": "Checked out at main gate"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "pages": 15
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/security/History.tsx
    ↓ Apply filters
    ↓ securityService.getHistory(filters)
Frontend Service: frontend/src/services/securityService.ts
    ↓ GET /api/security/history?type=check_out&fromDate=...
Backend Route: backend/src/routes/security.routes.ts (line 15)
    ↓ Middleware: validateHistoryQuery
    ↓ SecurityController.getHistory
Backend Controller: backend/src/controllers/security.controller.ts
    ↓ SecurityService.getHistory()
Backend Service: backend/src/services/SecurityService.ts
    ↓ Build query with filters
Database Query: SecurityLog.find(filters)
    ↓ .populate('outpass.student performedBy')
    ↓ .sort({timestamp:-1})
    ↓ .skip().limit()
    ← Return logs + pagination
Frontend: Display in table with filters
```

---

## Hostel APIs

### 42. GET /api/hostels
**Purpose**: Get all hostels (for dropdowns)

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "hostel_id",
      "name": "Hostel A",
      "capacity": 200,
      "wardenName": "Warden Name",
      "wardenContact": "9876543210"
    }
  ]
}
```

**Flow**:
```
Frontend: Multiple pages (Register, Users, etc.)
    ↓ hostelService.getAllHostels()
Frontend Service: frontend/src/services/hostelService.ts
    ↓ GET /api/hostels
Backend Route: backend/src/routes/hostel.routes.ts (line 7)
    ↓ HostelController.getAllHostels
Backend Controller: backend/src/controllers/hostel.controller.ts
Database Query: Hostel.find().sort({name:1})
    ← Return all hostels
Frontend: Populate dropdown options
```

---

### 43. POST /api/hostels
**Purpose**: Create new hostel (admin only)

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "name": "Hostel D",
  "capacity": 150,
  "wardenName": "New Warden",
  "wardenContact": "9876543210"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Hostel created successfully",
  "data": {
    "_id": "hostel_id",
    "name": "Hostel D",
    "capacity": 150
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/HostelStats.tsx
    ↓ Click Add Hostel button
    ↓ Fill form in modal
    ↓ hostelService.createHostel(data)
Frontend Service: frontend/src/services/hostelService.ts
    ↓ POST /api/hostels
Backend Route: backend/src/routes/hostel.routes.ts (line 8)
    ↓ Middleware: adminOnly
    ↓ HostelController.createHostel
Backend Controller: backend/src/controllers/hostel.controller.ts
    ↓ Check if hostel name already exists
Database Insert: Hostel.create(data)
    ← Return new hostel
Frontend: Refresh hostel list, show success toast
```

---

### 44. PUT /api/hostels/:id
**Purpose**: Update hostel (admin only)

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Request Body**:
```json
{
  "name": "Hostel D Updated",
  "capacity": 180
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "_id": "hostel_id",
    "name": "Hostel D Updated",
    "capacity": 180
  }
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/HostelStats.tsx
    ↓ Click Edit button
    ↓ Update form in modal
    ↓ hostelService.updateHostel(id, data)
Frontend Service: frontend/src/services/hostelService.ts
    ↓ PUT /api/hostels/:id
Backend Route: backend/src/routes/hostel.routes.ts (line 9)
    ↓ Middleware: adminOnly
    ↓ HostelController.updateHostel
Backend Controller: backend/src/controllers/hostel.controller.ts
Database Update: Hostel.findByIdAndUpdate(id, data)
    ← Return updated hostel
Frontend: Refresh hostel list, show success toast
```

---

### 45. DELETE /api/hostels/:id
**Purpose**: Delete hostel (admin only)

**Headers**: `Authorization: Bearer <token>` (Admin only)

**Response**:
```json
{
  "success": true,
  "message": "Hostel deleted successfully"
}
```

**Flow**:
```
Frontend: frontend/src/pages/admin/HostelStats.tsx
    ↓ Click Delete button
    ↓ Confirm deletion
    ↓ hostelService.deleteHostel(id)
Frontend Service: frontend/src/services/hostelService.ts
    ↓ DELETE /api/hostels/:id
Backend Route: backend/src/routes/hostel.routes.ts (line 10)
    ↓ Middleware: adminOnly
    ↓ HostelController.deleteHostel
Backend Controller: backend/src/controllers/hostel.controller.ts
    ↓ Check if hostel has users
    ↓ If has users, return error
Database Delete: Hostel.findByIdAndDelete(id)
    ← Return success
Frontend: Refresh hostel list, show success toast
```

---

## Notification APIs

### 46. GET /api/notifications
**Purpose**: Get user notifications

**Headers**: `Authorization: Bearer <token>`

**Query Parameters**:
- `page`: Page number
- `limit`: Items per page

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "_id": "notification_id",
      "type": "outpass_approved",
      "title": "Outpass Approved",
      "message": "Your outpass has been approved",
      "isRead": false,
      "createdAt": "2024-03-20T10:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "pages": 3
  }
}
```

**Flow**:
```
Frontend: frontend/src/layouts/MainLayout.tsx
    ↓ Click notification bell
    ↓ notificationService.getNotifications(page)
Frontend Service: frontend/src/services/notificationService.ts
    ↓ GET /api/notifications?page=1&limit=10
Backend Route: backend/src/routes/notification.routes.ts (line 7)
    ↓ NotificationController.getNotifications
Backend Controller: backend/src/controllers/notification.controller.ts
Database Query: Notification.find({user:userId})
    ↓ .sort({createdAt:-1})
    ↓ .skip().limit()
    ← Return notifications + pagination
Frontend: Display in dropdown
```

---

### 47. GET /api/notifications/unread-count
**Purpose**: Get unread notification count

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "data": {
    "count": 5
  }
}
```

**Flow**:
```
Frontend: frontend/src/layouts/MainLayout.tsx
    ↓ On mount and periodically
    ↓ notificationService.getUnreadCount()
Frontend Service: frontend/src/services/notificationService.ts
    ↓ GET /api/notifications/unread-count
Backend Route: backend/src/routes/notification.routes.ts (line 8)
    ↓ NotificationController.getUnreadCount
Backend Controller: backend/src/controllers/notification.controller.ts
Database Query: Notification.countDocuments({user:userId, isRead:false})
    ← Return count
Frontend: Display badge on notification bell
```

---

### 48. PATCH /api/notifications/:id/read
**Purpose**: Mark notification as read

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

**Flow**:
```
Frontend: frontend/src/layouts/MainLayout.tsx
    ↓ Click on notification
    ↓ notificationService.markAsRead(id)
Frontend Service: frontend/src/services/notificationService.ts
    ↓ PATCH /api/notifications/:id/read
Backend Route: backend/src/routes/notification.routes.ts (line 9)
    ↓ NotificationController.markAsRead
Backend Controller: backend/src/controllers/notification.controller.ts
Database Update: Notification.findByIdAndUpdate(id, {isRead:true})
    ← Return success
Frontend: Update notification state, decrement unread count
```

---

### 49. PATCH /api/notifications/read-all
**Purpose**: Mark all notifications as read

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

**Flow**:
```
Frontend: frontend/src/layouts/MainLayout.tsx
    ↓ Click "Mark all as read"
    ↓ notificationService.markAllAsRead()
Frontend Service: frontend/src/services/notificationService.ts
    ↓ PATCH /api/notifications/read-all
Backend Route: backend/src/routes/notification.routes.ts (line 10)
    ↓ NotificationController.markAllAsRead
Backend Controller: backend/src/controllers/notification.controller.ts
Database Update: Notification.updateMany({user:userId, isRead:false}, {isRead:true})
    ← Return success
Frontend: Update all notifications, reset unread count to 0
```

---

### 50. DELETE /api/notifications/:id
**Purpose**: Delete notification

**Headers**: `Authorization: Bearer <token>`

**Response**:
```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

**Flow**:
```
Frontend: frontend/src/layouts/MainLayout.tsx
    ↓ Click delete icon on notification
    ↓ notificationService.deleteNotification(id)
Frontend Service: frontend/src/services/notificationService.ts
    ↓ DELETE /api/notifications/:id
Backend Route: backend/src/routes/notification.routes.ts (line 11)
    ↓ NotificationController.deleteNotification
Backend Controller: backend/src/controllers/notification.controller.ts
Database Delete: Notification.findByIdAndDelete(id)
    ← Return success
Frontend: Remove notification from list
```

---

## Frontend File Structure

### Root Configuration Files
- **frontend/package.json** - Project dependencies and scripts
- **frontend/vite.config.ts** - Vite build configuration
- **frontend/tsconfig.json** - TypeScript compiler options
- **frontend/tailwind.config.js** - Tailwind CSS customization
- **frontend/index.html** - HTML entry point

### Source Directory (frontend/src/)

#### Core Application Files
- **frontend/src/main.tsx** - Application entry point
- **frontend/src/App.tsx** - Root component with routing
- **frontend/src/index.css** - Global styles and Tailwind imports

#### Services (API Communication)
- **frontend/src/services/api.ts** - Axios instance with interceptors
- **frontend/src/services/authService.ts** - Authentication APIs
- **frontend/src/services/outpassService.ts** - Student outpass APIs
- **frontend/src/services/wardenService.ts** - Warden APIs
- **frontend/src/services/adminService.ts** - Admin APIs
- **frontend/src/services/securityService.ts** - Security APIs
- **frontend/src/services/hostelService.ts** - Hostel management APIs
- **frontend/src/services/notificationService.ts** - Notification APIs
- **frontend/src/services/socketService.ts** - WebSocket connection

#### State Management
- **frontend/src/store/authStore.ts** - Authentication state (Zustand)
- **frontend/src/store/notificationStore.ts** - Notification state (Zustand)

#### Type Definitions
- **frontend/src/types/index.ts** - TypeScript interfaces and enums

#### Utilities
- **frontend/src/utils/errorHandler.ts** - Error handling utilities
- **frontend/src/utils/outpassHelpers.ts** - Outpass utility functions

#### Layouts
- **frontend/src/layouts/AuthLayout.tsx** - Login/Register layout
- **frontend/src/layouts/MainLayout.tsx** - Main application layout
- **frontend/src/layouts/StudentLayout.tsx** - Student-specific layout
- **frontend/src/layouts/WardenLayout.tsx** - Warden-specific layout

#### Pages by Role

**Auth Pages:**
- **frontend/src/pages/auth/Login.tsx** - Login page
- **frontend/src/pages/auth/Register.tsx** - Registration page

**Student Pages:**
- **frontend/src/pages/student/Dashboard.tsx** - Student dashboard
- **frontend/src/pages/student/CreateOutpass.tsx** - Create outpass form
- **frontend/src/pages/student/OutpassDetails.tsx** - Outpass details view
- **frontend/src/pages/student/Profile.tsx** - Student profile

**Warden Pages:**
- **frontend/src/pages/warden/Dashboard.tsx** - Warden dashboard
- **frontend/src/pages/warden/OutpassDetails.tsx** - Warden outpass view
- **frontend/src/pages/warden/Profile.tsx** - Warden profile

**Admin Pages:**
- **frontend/src/pages/admin/Dashboard.tsx** - Admin dashboard
- **frontend/src/pages/admin/Users.tsx** - User management
- **frontend/src/pages/admin/HostelStats.tsx** - Hostel statistics
- **frontend/src/pages/admin/Settings.tsx** - System settings
- **frontend/src/pages/admin/OutpassDetails.tsx** - Admin outpass view
- **frontend/src/pages/admin/Profile.tsx** - Admin profile

**Security Pages:**
- **frontend/src/pages/security/Dashboard.tsx** - Security dashboard
- **frontend/src/pages/security/ScanQR.tsx** - QR code scanner
- **frontend/src/pages/security/History.tsx** - Check-in/out history
- **frontend/src/pages/security/Profile.tsx** - Security profile

**Error Pages:**
- **frontend/src/pages/NotFound.tsx** - 404 page
- **frontend/src/pages/Unauthorized.tsx** - 403 page

#### Shared Components
- **frontend/src/components/ErrorBoundary.tsx** - Error boundary wrapper
- **frontend/src/components/WarningBanner.tsx** - Alert banner component
- **frontend/src/components/LatestOutpassCard.tsx** - Latest outpass display
- **frontend/src/components/StatusTiles.tsx** - Status filter tiles
- **frontend/src/components/AnalyticsChart.tsx** - Donut chart component
- **frontend/src/components/FilterBar.tsx** - Filter controls
- **frontend/src/components/OutpassListTable.tsx** - Outpass table

#### Role-Specific Components

**Warden Components:**
- **frontend/src/components/warden/WardenOutpassTable.tsx** - Warden outpass table
- **frontend/src/components/warden/ApproveModal.tsx** - Approval modal
- **frontend/src/components/warden/RejectModal.tsx** - Rejection modal
- **frontend/src/components/warden/WardenStatisticsTiles.tsx** - Statistics tiles
- **frontend/src/components/warden/WardenAnalyticsChart.tsx** - Analytics chart
- **frontend/src/components/warden/WardenFilterBar.tsx** - Filter bar
- **frontend/src/components/warden/HostelContextBanner.tsx** - Hostel info banner
- **frontend/src/components/warden/PriorityAlerts.tsx** - Priority alerts

**Security Components:**
- **frontend/src/components/security/QRScanner.tsx** - QR scanner
- **frontend/src/components/security/ScanResultCard.tsx** - Scan result display
- **frontend/src/components/security/ActiveOutpassesTable.tsx** - Active outpasses
- **frontend/src/components/security/SecurityStatisticsTiles.tsx** - Statistics tiles

---

## Backend File Structure

### Root Configuration Files
- **backend/package.json** - Project dependencies and scripts
- **backend/tsconfig.json** - TypeScript compiler options
- **backend/.env** - Environment variables
- **backend/.env.example** - Environment template

### Source Directory (backend/src/)

#### Core Files
- **backend/src/index.ts** - Server entry point and initialization

#### Configuration
- **backend/src/config/database.ts** - MongoDB connection setup
- **backend/src/config/socket.ts** - Socket.IO configuration

#### Models (MongoDB Schemas)
- **backend/src/models/User.ts** - User schema with roles
- **backend/src/models/Outpass.ts** - Outpass schema
- **backend/src/models/Hostel.ts** - Hostel schema
- **backend/src/models/Notification.ts** - Notification schema
- **backend/src/models/SystemSettings.ts** - System settings schema
- **backend/src/models/SecurityLog.ts** - Security check-in/out logs
- **backend/src/models/AdminActionLog.ts** - Admin action audit logs
- **backend/src/models/StudentOverride.ts** - Student restriction overrides

#### Controllers (Request Handlers)
- **backend/src/controllers/auth.controller.ts** - Authentication endpoints
- **backend/src/controllers/student.controller.ts** - Student endpoints
- **backend/src/controllers/warden.controller.ts** - Warden endpoints
- **backend/src/controllers/admin.controller.ts** - Admin endpoints
- **backend/src/controllers/security.controller.ts** - Security endpoints
- **backend/src/controllers/hostel.controller.ts** - Hostel management
- **backend/src/controllers/notification.controller.ts** - Notification endpoints

#### Services (Business Logic)
- **backend/src/services/AuthService.ts** - Authentication logic
- **backend/src/services/StudentService.ts** - Student business logic
- **backend/src/services/WardenService.ts** - Warden business logic
- **backend/src/services/AdminService.ts** - Admin business logic
- **backend/src/services/SecurityService.ts** - Security business logic
- **backend/src/services/OutpassService.ts** - Outpass operations
- **backend/src/services/NotificationService.ts** - Notification creation
- **backend/src/services/QRService.ts** - QR code generation
- **backend/src/services/PDFService.ts** - PDF generation
- **backend/src/services/EmailService.ts** - Email notifications

#### Routes (API Endpoints)
- **backend/src/routes/auth.routes.ts** - Auth routes
- **backend/src/routes/student.routes.ts** - Student routes
- **backend/src/routes/warden.routes.ts** - Warden routes
- **backend/src/routes/admin.routes.ts** - Admin routes
- **backend/src/routes/security.routes.ts** - Security routes
- **backend/src/routes/hostel.routes.ts** - Hostel routes
- **backend/src/routes/notification.routes.ts** - Notification routes

#### Middleware
- **backend/src/middleware/auth.middleware.ts** - JWT authentication
- **backend/src/middleware/authorize.middleware.ts** - Role-based authorization
- **backend/src/middleware/validate.middleware.ts** - Request validation
- **backend/src/middleware/rateLimit.middleware.ts** - Rate limiting
- **backend/src/middleware/error.middleware.ts** - Error handling

#### Utilities
- **backend/src/utils/logger.ts** - Winston logger setup
- **backend/src/utils/hash.ts** - Password hashing utilities
- **backend/src/utils/jwt.ts** - JWT token utilities
- **backend/src/utils/validators.ts** - Input validation functions

#### Scripts
- **backend/src/scripts/seed.ts** - Database seeding script

---

## Database Schema

### Collections

#### users
- `_id`: ObjectId
- `name`: String
- `email`: String (unique)
- `password`: String (hashed)
- `phone`: String
- `role`: Number (1=Student, 2=Warden, 3=Security, 4=Admin)
- `rollNumber`: String (students only)
- `department`: String (students only)
- `year`: Number (students only)
- `hostel`: String
- `roomNumber`: String
- `parentPhone`: String (students only)
- `canCreateOutpass`: Boolean (default: true)
- `overdueCount`: Number (default: 0)
- `overrideCount`: Number (default: 0)
- `lastOverrideDate`: Date
- `lastOverrideBy`: ObjectId (ref: User)
- `isActive`: Boolean (default: true)
- `createdAt`: Date
- `updatedAt`: Date

#### outpasses
- `_id`: ObjectId
- `student`: ObjectId (ref: User)
- `purpose`: String (home/medical/personal/academic/emergency)
- `reason`: String
- `destination`: String
- `fromDate`: Date
- `toDate`: Date
- `emergencyContact`: String
- `status`: String (pending/approved/rejected/checked_out/checked_in/cancelled/overdue)
- `qrCode`: String (base64)
- `approvedBy`: ObjectId (ref: User)
- `approvedAt`: Date
- `rejectedBy`: ObjectId (ref: User)
- `rejectedAt`: Date
- `rejectionReason`: String
- `checkOutTime`: Date
- `checkOutBy`: ObjectId (ref: User)
- `checkOutRemarks`: String
- `checkInTime`: Date
- `checkInBy`: ObjectId (ref: User)
- `checkInRemarks`: String
- `createdAt`: Date
- `updatedAt`: Date

#### hostels
- `_id`: ObjectId
- `name`: String (unique)
- `capacity`: Number
- `wardenName`: String
- `wardenContact`: String
- `createdAt`: Date
- `updatedAt`: Date

#### notifications
- `_id`: ObjectId
- `user`: ObjectId (ref: User)
- `type`: String
- `title`: String
- `message`: String
- `relatedOutpass`: ObjectId (ref: Outpass)
- `isRead`: Boolean (default: false)
- `createdAt`: Date

#### systemsettings
- `_id`: ObjectId
- `isSystemActive`: Boolean (default: true)
- `maxOutpassDuration`: Number (days, default: 7)
- `autoApprovalEnabled`: Boolean (default: false)
- `reminderHoursBefore`: Number (default: 24)
- `updatedAt`: Date
- `updatedBy`: ObjectId (ref: User)

#### securitylogs
- `_id`: ObjectId
- `type`: String (check_in/check_out)
- `outpass`: ObjectId (ref: Outpass)
- `performedBy`: ObjectId (ref: User)
- `timestamp`: Date
- `remarks`: String

#### adminactionlogs
- `_id`: ObjectId
- `action`: String
- `performedBy`: ObjectId (ref: User)
- `targetUser`: ObjectId (ref: User)
- `details`: Object
- `timestamp`: Date

#### studentoverrides
- `_id`: ObjectId
- `student`: ObjectId (ref: User)
- `overriddenBy`: ObjectId (ref: User)
- `reason`: String
- `previousOverdueCount`: Number
- `timestamp`: Date

---

## Environment Setup

### Backend Environment Variables (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campus_pass
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend Environment Variables (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Running the Application

#### backend/src/controllers/hostel.controller.ts
**Purpose**: Hostel management endpoints
- `getAllHostels()` - Get all hostels
- `createHostel()` - Create new hostel
- `updateHostel()` - Update hostel
- `deleteHostel()` - Delete hostel

#### backend/src/controllers/notification.controller.ts
**Purpose**: Notification endpoints
- `getNotifications()` - Get user notifications
- `getUnreadCount()` - Get unread count
- `markAsRead()` - Mark notification as read
- `markAllAsRead()` - Mark all as read
- `deleteNotification()` - Delete notification

---

### Services (Business Logic)

#### backend/src/services/AuthService.ts
**Purpose**: Authentication business logic
- `register()` - User registration logic
- `login()` - User login logic
- `updateProfile()` - Profile update logic
- `changePassword()` - Password change logic
- Password hashing with bcrypt
- JWT token generation
- Email validation

#### backend/src/services/StudentService.ts
**Purpose**: Student business logic
- `validateOutpassCreation()` - Validate outpass creation
  - Check system active
  - Check user.canCreateOutpass
  - Check overdueCount < 3
  - Check duration <= maxOutpassDuration
- `getLatestOutpass()` - Get latest outpass
- `getAnalytics()` - Calculate analytics
- `downloadOutpassPDF()` - Generate PDF
- `verifyOutpassOwnership()` - Verify ownership

#### backend/src/services/WardenService.ts
**Purpose**: Warden business logic
- `getHostelInfo()` - Get hostel statistics
- `getStatistics()` - Calculate outpass stats
- `getAnalytics()` - Calculate analytics
- `getOutpassesEnhanced()` - Get filtered outpasses
- `approveOutpass()` - Approve outpass logic
  - Generate QR code
  - Update status
  - Create notification
- `rejectOutpass()` - Reject outpass logic
  - Update status
  - Create notification

#### backend/src/services/AdminService.ts
**Purpose**: Admin business logic
- `getSystemStatistics()` - System-wide stats
- `getUserStatistics()` - User stats by role
- `getOutpassStatistics()` - Outpass stats
- `getHostelStatistics()` - Hostel-wise stats
- `getAllUsers()` - Get users with filters
- `createUser()` - Create user logic
- `updateUser()` - Update user logic
- `deleteUser()` - Delete user logic
- `toggleOutpassPermission()` - Toggle permission
  - Update canCreateOutpass
  - Increment overrideCount
  - Log action
- `updateSystemSettings()` - Update settings

#### backend/src/services/SecurityService.ts
**Purpose**: Security business logic
- `getStatistics()` - Security statistics
- `validateQR()` - Validate QR code
  - Decode QR code
  - Find outpass
  - Check status and dates
  - Determine available actions
- `checkOut()` - Check out logic
  - Verify status is 'approved'
  - Update to 'checked_out'
  - Log action
  - Create notification
- `checkIn()` - Check in logic
  - Verify status is 'checked_out'
  - Check if overdue
  - Update user overdueCount if overdue
  - Disable canCreateOutpass if overdueCount >= 3
  - Log action
  - Create notification
- `getActiveOutpasses()` - Get active outpasses
- `getHistory()` - Get security logs

#### backend/src/services/OutpassService.ts
**Purpose**: Outpass business logic
- `createOutpass()` - Create outpass
  - Validate data
  - Create document
  - Create notification for warden
- `getStudentOutpasses()` - Get student's outpasses
- `getOutpassById()` - Get single outpass
- `cancelOutpass()` - Cancel outpass
- `updateOutpassStatus()` - Update status

#### backend/src/services/NotificationService.ts
**Purpose**: Notification business logic
- `create()` - Create notification
- `getNotifications()` - Get user notifications
- `getUnreadCount()` - Count unread
- `markAsRead()` - Mark as read
- `markAllAsRead()` - Mark all as read
- `deleteNotification()` - Delete notification
- `sendToUser()` - Send via WebSocket

#### backend/src/services/QRService.ts
**Purpose**: QR code generation
- `generateQRCode()` - Generate QR code
  - Uses qrcode library
  - Encodes outpass ID
  - Returns base64 image
- `decodeQRCode()` - Decode QR code
  - Extract outpass ID
  - Validate format

#### backend/src/services/PDFService.ts
**Purpose**: PDF generation
- `generateOutpassPDF()` - Generate outpass PDF
  - Uses pdfkit library
  - Include student details
  - Include QR code
  - Include outpass details
  - Return PDF buffer

#### backend/src/services/EmailService.ts
**Purpose**: Email notifications
- `sendEmail()` - Send email
- `sendOutpassApprovalEmail()` - Approval email
- `sendOutpassRejectionEmail()` - Rejection email
- `sendOverdueWarningEmail()` - Overdue warning
- Uses nodemailer

#### backend/src/services/OverdueService.ts
**Purpose**: Overdue checking
- `checkOverdueOutpasses()` - Check for overdue
  - Find checked_out outpasses past toDate
  - Update status to 'overdue'
  - Increment user overdueCount
  - Send notifications
- Runs periodically (cron job)

#### backend/src/services/ReminderService.ts
**Purpose**: Reminder notifications
- `sendReminders()` - Send return reminders
  - Find outpasses nearing return time
  - Send reminder notifications
- Runs periodically

#### backend/src/services/SocketService.ts
**Purpose**: WebSocket management
- `initialize()` - Initialize Socket.IO
- `sendToUser()` - Send to specific user
- `sendToRole()` - Send to all users of role
- `broadcastToAll()` - Broadcast to all
- Real-time notifications

---

### Middleware

#### backend/src/middleware/auth.middleware.ts
**Purpose**: Authentication middleware
- `authenticate()` - Verify JWT token
  - Extract token from header
  - Verify token
  - Attach user to request
  - Handle expired tokens
- `authorize(roles)` - Role-based authorization
  - Check user role
  - Allow/deny access

#### backend/src/middleware/role.middleware.ts
**Purpose**: Role-specific middleware
- `adminOnly()` - Admin-only access
- `wardenOnly()` - Warden-only access
- `securityOnly()` - Security-only access
- `studentOnly()` - Student-only access

#### backend/src/middleware/security.middleware.ts
**Purpose**: Security-specific middleware
- `validateQRCode()` - Validate QR code format
- `rateLimitScan()` - Rate limit QR scans
- `validateCheckOutRequest()` - Validate check-out
- `validateCheckInRequest()` - Validate check-in
- `validateHistoryQuery()` - Validate history query

#### backend/src/middleware/error.middleware.ts
**Purpose**: Error handling middleware
- `errorHandler()` - Global error handler
  - Log errors
  - Format error response
  - Handle different error types
  - Return user-friendly messages

#### backend/src/middleware/rateLimit.middleware.ts
**Purpose**: Rate limiting
- `rateLimiter()` - General rate limiter
  - 1000 requests per minute per IP
  - Prevents abuse
- `strictRateLimiter()` - Strict rate limiter
  - For sensitive endpoints

#### backend/src/middleware/auditLog.middleware.ts
**Purpose**: Audit logging
- `auditLog()` - Log admin actions
  - Log to AdminActionLog
  - Track who did what
  - Track when and why

---

### Routes

#### backend/src/routes/index.ts
**Purpose**: Route aggregation
- Register all route modules
- Prefix routes with /api
- Export router

#### backend/src/routes/auth.routes.ts
**Purpose**: Authentication routes
- POST /register
- POST /login
- POST /logout
- GET /profile
- PUT /profile
- POST /change-password
- GET /system-status

#### backend/src/routes/student.routes.ts
**Purpose**: Student routes
- All require authentication + student role
- GET /dashboard
- GET /latest-outpass
- GET /analytics
- POST /outpasses
- GET /outpasses
- GET /outpasses/:id
- GET /outpasses/:id/download
- PATCH /outpasses/:id/cancel

#### backend/src/routes/warden.routes.ts
**Purpose**: Warden routes
- All require authentication + warden role
- GET /hostel-info
- GET /statistics
- GET /analytics
- GET /outpasses-enhanced
- GET /outpasses/:id
- POST /outpasses/:id/approve
- POST /outpasses/:id/reject

#### backend/src/routes/admin.routes.ts
**Purpose**: Admin routes
- All require authentication + admin role
- GET /statistics/system
- GET /statistics/users
- GET /statistics/outpasses
- GET /statistics/hostels
- GET /users
- GET /users/:id
- POST /users
- PUT /users/:id
- DELETE /users/:id
- PATCH /users/:id/outpass-permission
- GET /outpasses
- GET /outpasses/:id
- GET /settings
- PUT /settings

#### backend/src/routes/security.routes.ts
**Purpose**: Security routes
- All require authentication + security role
- GET /statistics
- POST /validate-qr
- POST /check-out
- POST /check-in
- GET /active-outpasses
- GET /history

#### backend/src/routes/hostel.routes.ts
**Purpose**: Hostel routes
- GET /hostels (authenticated)
- POST /hostels (admin only)
- PUT /hostels/:id (admin only)
- DELETE /hostels/:id (admin only)

#### backend/src/routes/notification.routes.ts
**Purpose**: Notification routes
- All require authentication
- GET /
- GET /unread-count
- PATCH /:id/read
- PATCH /read-all
- DELETE /:id

---

### Utils

#### backend/src/utils/logger.ts
**Purpose**: Logging utility
- Winston logger configuration
- Log to console and files
- Log levels: error, warn, info, debug
- Separate error log file
- Combined log file

#### backend/src/utils/hash.ts
**Purpose**: Password hashing
- `hashPassword()` - Hash password with bcrypt
- `comparePassword()` - Compare password with hash
- Salt rounds: 10

#### backend/src/utils/validators.ts
**Purpose**: Validation utilities
- `validateEmail()` - Email validation
- `validatePhone()` - Phone validation
- `validateRollNumber()` - Roll number validation
- `validateDate()` - Date validation

#### backend/src/utils/helpers.ts
**Purpose**: Helper functions
- `formatDate()` - Format date
- `calculateDuration()` - Calculate duration
- `generateRandomString()` - Generate random string
- `sanitizeInput()` - Sanitize user input

---

### Types

#### backend/src/types/index.ts
**Purpose**: TypeScript type definitions
- `IUser` - User interface
- `IOutpass` - Outpass interface
- `INotification` - Notification interface
- `IHostel` - Hostel interface
- `ISystemSettings` - Settings interface
- `UserRole` - Role enum
- `OutpassStatus` - Status enum
- `OutpassPurpose` - Purpose enum
- Request/Response types

---

### Socket

#### backend/src/socket/handlers.ts
**Purpose**: WebSocket event handlers
- `handleConnection()` - Handle new connection
- `handleDisconnect()` - Handle disconnect
- `handleJoinRoom()` - Join user-specific room
- `handleLeaveRoom()` - Leave room
- Emit real-time notifications

---

### Scripts

#### backend/src/scripts/seed.ts
**Purpose**: Database seeding
- Create sample users (students, wardens, security, admin)
- Create hostels
- Create 100 sample outpasses
- Create system settings
- Diversified data for testing

**Usage**: `npm run seed`

#### backend/src/scripts/checkData.ts
**Purpose**: Data verification
- Check database connections
- Verify data integrity
- Count documents
- Display statistics

**Usage**: `npm run check-data`

---

## Complete Request-Response Flow Examples

### Example 1: Student Creates Outpass

```
1. USER ACTION
   Student fills form in CreateOutpass.tsx
   Clicks "Create Outpass" button

2. FRONTEND VALIDATION
   File: frontend/src/pages/student/CreateOutpass.tsx
   - Check user.canCreateOutpass
   - If false: Show toast "Contact admin", STOP
   - If true: Continue
   - Validate dates (fromDate < toDate, not in past)
   - Validate required fields

3. API CALL
   File: frontend/src/services/outpassService.ts
   Method: createOutpass(data)
   - POST /api/student/outpasses
   - Headers: { Authorization: Bearer <token> }
   - Body: { reason, destination, fromDate, toDate, purpose, emergencyContact }

4. BACKEND ROUTE
   File: backend/src/routes/student.routes.ts
   - Route: POST /outpasses
   - Middleware: authenticate, authorize(STUDENT)

5. AUTHENTICATION MIDDLEWARE
   File: backend/src/middleware/auth.middleware.ts
   - Extract token from Authorization header
   - Verify JWT token
   - Decode user ID from token
   - Query: User.findById(userId)
   - Attach user to request.user
   - If invalid: Return 401 Unauthorized

6. AUTHORIZATION MIDDLEWARE
   File: backend/src/middleware/auth.middleware.ts
   - Check request.user.role === UserRole.STUDENT
   - If not: Return 403 Forbidden

7. CONTROLLER
   File: backend/src/controllers/student.controller.ts
   Method: createOutpass()
   - Extract data from request.body
   - Extract userId from request.user._id

8. SERVICE VALIDATION
   File: backend/src/services/StudentService.ts
   Method: validateOutpassCreation()
   - Query: SystemSettings.findOne()
   - Check isSystemActive === true
   - Query: User.findById(userId)
   - Check user.canCreateOutpass === true
   - Check user.overdueCount < 3
   - Calculate duration = (toDate - fromDate) / days
   - Check duration <= maxOutpassDuration
   - If any check fails: Return error

9. OUTPASS CREATION
   File: backend/src/services/OutpassService.ts
   Method: createOutpass()
   - Create new Outpass document
   - Fields: student, hostel, fromDate, toDate, reason, destination, purpose, emergencyContact, status: 'pending'
   - Save to database: outpass.save()

10. NOTIFICATION CREATION
    File: backend/src/services/NotificationService.ts
    Method: create()
    - Find warden for student's hostel
    - Query: User.findOne({ role: WARDEN, hostel: student.hostel })
    - Create Notification document
    - Fields: user: wardenId, title: "New Outpass Request", message: "...", type: "info"
    - Save to database: notification.save()

11. WEBSOCKET NOTIFICATION
    File: backend/src/services/SocketService.ts
    Method: sendToUser()
    - Emit notification to warden via WebSocket
    - Event: 'notification'
    - Data: notification object

12. RESPONSE
    Controller returns:
    {
      success: true,
      message: "Outpass created successfully",
      data: outpass
    }

13. FRONTEND RECEIVES RESPONSE
    File: frontend/src/services/outpassService.ts
    - Response status: 200
    - Parse response.data

14. FRONTEND NAVIGATION
    File: frontend/src/pages/student/CreateOutpass.tsx
    - navigate(`/student/outpass/${response._id}`)
    - Redirect to outpass details page

15. DISPLAY
    File: frontend/src/pages/student/OutpassDetails.tsx
    - Fetch outpass details
    - Display status: "Pending"
    - Show "Cancel" button
```

---

### Example 2: Warden Approves Outpass

```
1. USER ACTION
   Warden clicks "Approve" button on outpass

2. MODAL OPENS
   File: frontend/src/components/warden/ApproveModal.tsx
   - Show approval modal
   - Optional remarks input

3. API CALL
   File: frontend/src/services/wardenService.ts
   Method: approveOutpass(id, remarks)
   - POST /api/warden/outpasses/:id/approve
   - Headers: { Authorization: Bearer <token> }
   - Body: { remarks }

4. BACKEND ROUTE
   File: backend/src/routes/warden.routes.ts
   - Route: POST /outpasses/:id/approve
   - Middleware: authenticate, authorize(WARDEN)

5. AUTHENTICATION & AUTHORIZATION
   - Verify token
   - Check role === WARDEN

6. CONTROLLER
   File: backend/src/controllers/warden.controller.ts
   Method: approveOutpassNew()
   - Extract outpassId from params
   - Extract remarks from body
   - Extract wardenId from request.user._id

7. SERVICE - FIND OUTPASS
   File: backend/src/services/WardenService.ts
   Method: approveOutpass()
   - Query: Outpass.findById(outpassId).populate('student')
   - Verify outpass exists
   - Verify outpass.hostel === warden.hostel
   - Verify outpass.status === 'pending'

8. SERVICE - GENERATE QR CODE
   File: backend/src/services/QRService.ts
   Method: generateQRCode()
   - Create QR code data: { outpassId, studentId, timestamp }
   - Generate QR code image (base64)
   - Return qrCodeBase64

9. SERVICE - UPDATE OUTPASS
   File: backend/src/services/WardenService.ts
   - outpass.status = 'approved'
   - outpass.approvedBy = wardenId
   - outpass.approvedAt = new Date()
   - outpass.qrCode = qrCodeBase64
   - outpass.remarks = remarks
   - Save: outpass.save()

10. SERVICE - CREATE NOTIFICATION
    File: backend/src/services/NotificationService.ts
    - Create notification for student
    - Fields: user: studentId, title: "Outpass Approved", message: "...", type: "success"
    - Save: notification.save()

11. WEBSOCKET NOTIFICATION
    File: backend/src/services/SocketService.ts
    - Emit to student: socket.to(studentId).emit('notification', notification)

12. RESPONSE
    Controller returns:
    {
      success: true,
      message: "Outpass approved successfully",
      data: outpass
    }

13. FRONTEND RECEIVES RESPONSE
    File: frontend/src/services/wardenService.ts
    - Response status: 200
    - Parse response.data

14. FRONTEND UPDATE
    File: frontend/src/pages/warden/Dashboard.tsx
    - Close modal
    - Show success toast
    - Refresh outpass list
    - Decrement pending count
    - Increment approved count

15. STUDENT RECEIVES NOTIFICATION
    File: frontend/src/store/notificationStore.ts
    - WebSocket event received
    - Add notification to store
    - Increment unread count
    - Show notification badge
    - Student can now download PDF with QR code
```

---

### Example 3: Security Checks Out Student

```
1. USER ACTION
   Security guard scans QR code

2. QR SCANNER
   File: frontend/src/components/security/QRScanner.tsx
   - Access camera
   - Scan QR code
   - Extract QR code data

3. API CALL - VALIDATE QR
   File: frontend/src/services/securityService.ts
   Method: validateQR(qrCode)
   - POST /api/security/validate-qr
   - Headers: { Authorization: Bearer <token> }
   - Body: { qrCode }

4. BACKEND ROUTE
   File: backend/src/routes/security.routes.ts
   - Route: POST /validate-qr
   - Middleware: authenticate, authorize(SECURITY), rateLimitScan, validateQRCode

5. RATE LIMIT MIDDLEWARE
   File: backend/src/middleware/security.middleware.ts
   - Check scan rate (max 10 per minute)
   - If exceeded: Return 429 Too Many Requests

6. VALIDATE QR MIDDLEWARE
   File: backend/src/middleware/security.middleware.ts
   - Check QR code format
   - Decode QR code data
   - Extract outpassId

7. CONTROLLER
   File: backend/src/controllers/security.controller.ts
   Method: validateQR()
   - Extract qrCode from body

8. SERVICE - VALIDATE
   File: backend/src/services/SecurityService.ts
   Method: validateQR()
   - Decode QR code to get outpassId
   - Query: Outpass.findById(outpassId).populate('student')
   - Verify outpass exists
   - Check status (must be 'approved' or 'checked_out')
   - Check dates (current time within fromDate and toDate)
   - Determine available actions:
     * If status === 'approved' && current >= fromDate: canCheckOut = true
     * If status === 'checked_out': canCheckIn = true

9. RESPONSE
    Controller returns:
    {
      success: true,
      data: {
        outpass: { ...outpass details },
        canCheckOut: true,
        canCheckIn: false,
        message: "Valid outpass - Ready for check-out"
      }
    }

10. FRONTEND DISPLAYS RESULT
    File: frontend/src/components/security/ScanResultCard.tsx
    - Show student photo
    - Show student details
    - Show outpass details
    - Show "Check Out" button (enabled)
    - Show "Check In" button (disabled)

11. USER ACTION - CHECK OUT
    Security clicks "Check Out" button

12. API CALL - CHECK OUT
    File: frontend/src/services/securityService.ts
    Method: checkOut(outpassId, remarks)
    - POST /api/security/check-out
    - Body: { outpassId, remarks }

13. BACKEND ROUTE
    File: backend/src/routes/security.routes.ts
    - Route: POST /check-out
    - Middleware: authenticate, authorize(SECURITY), validateCheckOutRequest

14. CONTROLLER
    File: backend/src/controllers/security.controller.ts
    Method: checkOut()

15. SERVICE - CHECK OUT
    File: backend/src/services/SecurityService.ts
    Method: checkOut()
    - Query: Outpass.findById(outpassId)
    - Verify status === 'approved'
    - Update: outpass.status = 'checked_out'
    - Update: outpass.checkOutTime = new Date()
    - Update: outpass.checkOutBy = securityId
    - Save: outpass.save()

16. CREATE SECURITY LOG
    File: backend/src/models/SecurityLog.ts
    - Create SecurityLog document
    - Fields: outpass, action: 'check_out', performedBy: securityId, timestamp, remarks
    - Save: log.save()

17. CREATE NOTIFICATION
    File: backend/src/services/NotificationService.ts
    - Create notification for student
    - Message: "You have been checked out"
    - Save and emit via WebSocket

18. RESPONSE
    Controller returns:
    {
      success: true,
      message: "Student checked out successfully",
      data: outpass
    }

19. FRONTEND UPDATE
    File: frontend/src/pages/security/ScanQR.tsx
    - Show success message
    - Clear scanner
    - Update statistics
    - Increment checkedOutToday count
```

---

### Example 4: Admin Toggles Student Outpass Permission

```
1. USER ACTION
   Admin clicks toggle in user details modal

2. FRONTEND
   File: frontend/src/pages/admin/Users.tsx
   Method: handleToggleOutpassPermission()
   - Get current value: user.canCreateOutpass
   - Toggle: newValue = !user.canCreateOutpass

3. API CALL
   File: frontend/src/services/adminService.ts
   Method: toggleOutpassPermission(userId, newValue)
   - PATCH /api/admin/users/:id/outpass-permission
   - Headers: { Authorization: Bearer <token> }
   - Body: { canCreateOutpass: newValue }

4. BACKEND ROUTE
   File: backend/src/routes/admin.routes.ts
   - Route: PATCH /users/:id/outpass-permission
   - Middleware: authenticate, adminOnly

5. CONTROLLER
   File: backend/src/controllers/admin.controller.ts
   Method: toggleOutpassPermission()
   - Extract userId from params
   - Extract canCreateOutpass from body
   - Extract adminId from request.user._id

6. SERVICE
   File: backend/src/services/AdminService.ts
   Method: toggleOutpassPermission()
   - Query: User.findById(userId)
   - Update: user.canCreateOutpass = canCreateOutpass
   - Update: user.overrideCount += 1
   - Update: user.lastOverrideDate = new Date()
   - Update: user.lastOverrideBy = adminId
   - Save: user.save()

7. CREATE AUDIT LOG
   File: backend/src/models/AdminActionLog.ts
   - Create AdminActionLog document
   - Fields: admin: adminId, action: 'toggle_outpass_permission', targetUser: userId, details: { canCreateOutpass }, timestamp
   - Save: log.save()

8. RESPONSE
    Controller returns:
    {
      success: true,
      message: "Outpass permission updated successfully",
      data: { canCreateOutpass }
    }

9. FRONTEND UPDATE
    File: frontend/src/pages/admin/Users.tsx
    - Show success toast
    - Refresh user list
    - Update user details modal
    - Increment overrideCount display

10. STUDENT IMPACT
    When student tries to create outpass:
    File: frontend/src/pages/student/CreateOutpass.tsx
    - Check: if (!user?.canCreateOutpass)
    - Show toast: "Please contact admin to enable outpass creation permission"
    - Prevent form submission
```

---

## Database Collections

### users
- Stores all users (students, wardens, security, admins)
- Indexed on: email (unique), role, hostel
- Password field excluded by default (select: false)

### outpasses
- Stores all outpass requests
- Indexed on: student, hostel, status, createdAt
- References: student (User), approvedBy (User), rejectedBy (User), checkOutBy (User), checkInBy (User)

### hostels
- Stores hostel information
- Indexed on: name (unique)

### notifications
- Stores user notifications
- Indexed on: user, isRead, createdAt
- References: user (User), relatedOutpass (Outpass)

### systemsettings
- Single document storing system configuration
- No indexes needed (singleton)

### securitylogs
- Stores check-in/check-out logs
- Indexed on: outpass, performedBy, timestamp
- References: outpass (Outpass), performedBy (User)

### adminactionlogs
- Stores admin action audit trail
- Indexed on: admin, timestamp
- References: admin (User), targetUser (User), targetOutpass (Outpass)

### studentoverrides
- Stores student restriction override history
- Indexed on: student, timestamp
- References: student (User), admin (User)

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campuspass
JWT_SECRET=your_jwt_secret_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Key Concepts for Beginners

### 1. Request Flow
```
User Action → Frontend Component → Service (API call) → Backend Route → Middleware → Controller → Service → Database → Response back through chain
```

### 2. Authentication Flow
```
Login → Backend generates JWT → Frontend stores token → Every API call includes token in header → Backend verifies token → Allows/denies access
```

### 3. Role-Based Access
```
Token contains user role → Middleware checks role → Only allows access if role matches → Different dashboards for different roles
```

### 4. State Management
```
Zustand stores: authStore (user, token), notificationStore (notifications)
Persisted to localStorage → Survives page refresh
```

### 5. Real-time Updates
```
WebSocket connection → Backend emits events → Frontend listens → Updates UI immediately
Used for: Notifications, live outpass updates
```

### 6. Error Handling
```
Try-catch in services → Error middleware in backend → User-friendly messages → Toast notifications in frontend
```

---

## Testing the Application

### 1. Start Backend
```bash
cd backend
npm install
npm run dev
```

### 2. Start Frontend
```bash
cd frontend
npm install
npm run dev
```

### 3. Seed Database
```bash
cd backend
npm run seed
```

### 4. Test Login Credentials
After seeding, use these credentials:

**Admin:**
- Email: admin@campus.com
- Password: admin123

**Warden (Hostel A):**
- Email: warden.a@campus.com
- Password: warden123

**Security:**
- Email: security@campus.com
- Password: security123

**Student:**
- Email: student1@campus.com
- Password: student123

---

## Common Issues and Solutions

### Issue 1: Cannot connect to MongoDB
**Solution**: Ensure MongoDB is running on localhost:27017

### Issue 2: JWT token expired
**Solution**: Login again to get new token

### Issue 3: CORS errors
**Solution**: Check FRONTEND_URL in backend .env matches frontend URL

### Issue 4: QR code not scanning
**Solution**: Ensure camera permissions are granted in browser

### Issue 5: Notifications not appearing
**Solution**: Check WebSocket connection in browser console

---

## API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "data": { /* response data */ }
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

### Paginated Response
```json
{
  "success": true,
  "data": [ /* array of items */ ],
  "pagination": {
    "total": 100,
    "page": 1,
    "pages": 10,
    "limit": 10
  }
}
```

---

## Conclusion

This documentation provides a complete overview of the Campus Pass application's API endpoints, file structure, and data flow. Each endpoint is documented with its purpose, request/response format, and complete flow from frontend to database and back.

For beginners, follow the flow diagrams to understand how data moves through the application. Start with simple flows like login and registration, then move to more complex flows like outpass creation and approval.

The file structure sections explain what each file does, making it easier to locate and understand specific functionality when reading or modifying the code.

---

**Last Updated**: February 8, 2026
**Version**: 1.0.0
**Maintained By**: Campus Pass Development Team
