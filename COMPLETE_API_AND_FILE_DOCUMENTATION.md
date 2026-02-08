# Campus Pass - Complete API & File Documentation

## Table of Contents
1. [All API Endpoints (49 Total)](#all-api-endpoints)
2. [Complete Frontend File List](#complete-frontend-file-list)
3. [Complete Backend File List](#complete-backend-file-list)
4. [Detailed Flow Examples](#detailed-flow-examples)

---

## All API Endpoints

### Authentication APIs (7 endpoints)

#### 1. POST /api/auth/register
**Purpose**: Register new user
**Request**: `{ name, email, password, phone, role, rollNumber, department, year, hostel, roomNumber, parentPhone }`
**Response**: `{ success, message, data: { user, token } }`
**Flow**: Register.tsx → authService.register() → POST /api/auth/register → AuthController.register → AuthService.register() → User.create() → Generate JWT → Return

#### 2. POST /api/auth/login
**Purpose**: User login
**Request**: `{ email, password }`
**Response**: `{ success, data: { user, token } }`
**Flow**: Login.tsx → authService.login() → POST /api/auth/login → AuthController.login → AuthService.login() → User.findOne() → Compare password → Generate JWT → Return

#### 3. POST /api/auth/logout
**Purpose**: User logout
**Request**: None (token in header)
**Response**: `{ success, message }`
**Flow**: Header → authService.logout() → POST /api/auth/logout → AuthController.logout → Clear session → Return

#### 4. GET /api/auth/profile
**Purpose**: Get current user profile
**Request**: None (token in header)
**Response**: `{ success, data: user }`
**Flow**: Profile.tsx → authService.getProfile() → GET /api/auth/profile → authenticate middleware → AuthController.getProfile → User.findById() → Return

#### 5. PUT /api/auth/profile
**Purpose**: Update user profile
**Request**: `{ name, phone, department, roomNumber }`
**Response**: `{ success, data: updatedUser }`
**Flow**: Profile.tsx → authService.updateProfile() → PUT /api/auth/profile → authenticate → AuthController.updateProfile → User.findByIdAndUpdate() → Return

#### 6. POST /api/auth/change-password
**Purpose**: Change password
**Request**: `{ currentPassword, newPassword }`
**Response**: `{ success, message }`
**Flow**: Profile.tsx → authService.changePassword() → POST /api/auth/change-password → authenticate → AuthController.changePassword → Verify current → Hash new → User.save() → Return

#### 7. GET /api/auth/system-status
**Purpose**: Get system status (active/inactive)
**Request**: None
**Response**: `{ success, data: { isSystemActive, maxOutpassDuration } }`
**Flow**: Dashboard.tsx → authService.getSystemStatus() → GET /api/auth/system-status → AuthController.getSystemStatus → SystemSettings.findOne() → Return

---

### Student APIs (7 endpoints)

#### 8. POST /api/student/outpasses
**Purpose**: Create outpass request
**Request**: `{ reason, destination, fromDate, toDate, purpose, emergencyContact }`
**Response**: `{ success, message, data: outpass }`
**Flow**: CreateOutpass.tsx → Check canCreateOutpass → outpassService.createOutpass() → POST /api/student/outpasses → authenticate + authorize(STUDENT) → StudentController.createOutpass → StudentService.validateOutpassCreation() → OutpassService.createOutpass() → Outpass.create() → NotificationService.create() → Return

#### 9. GET /api/student/outpasses
**Purpose**: Get student's outpasses with filters
**Request**: Query params: `status, purpose, search, dateRange, fromDate, toDate, page, limit`
**Response**: `{ success, data: [outpasses], pagination }`
**Flow**: Dashboard.tsx → outpassService.getMyOutpasses() → GET /api/student/outpasses → authenticate + authorize(STUDENT) → StudentController.getMyOutpasses → Build filters → Outpass.find() → Return

#### 10. GET /api/student/outpasses/:id
**Purpose**: Get single outpass details
**Request**: Param: `id`
**Response**: `{ success, data: outpass }`
**Flow**: OutpassDetails.tsx → outpassService.getOutpassById() → GET /api/student/outpasses/:id → authenticate + authorize(STUDENT) → StudentController.getOutpassById → Outpass.findById().populate() → Verify ownership → Return

#### 11. GET /api/student/outpasses/:id/download
**Purpose**: Download outpass PDF
**Request**: Param: `id`
**Response**: PDF file (application/pdf)
**Flow**: Dashboard.tsx → outpassService.downloadOutpassPDF() → GET /api/student/outpasses/:id/download → authenticate + authorize(STUDENT) → StudentController.downloadOutpassPDF → StudentService.downloadOutpassPDF() → PDFService.generateOutpassPDF() → Return PDF buffer

#### 12. PATCH /api/student/outpasses/:id/cancel
**Purpose**: Cancel pending outpass
**Request**: Param: `id`
**Response**: `{ success, message }`
**Flow**: OutpassDetails.tsx → outpassService.cancelOutpass() → PATCH /api/student/outpasses/:id/cancel → authenticate + authorize(STUDENT) → StudentController.cancelOutpass → Verify status=pending → outpass.status='cancelled' → outpass.save() → Return

#### 13. GET /api/student/latest-outpass
**Purpose**: Get latest outpass
**Request**: None (token in header)
**Response**: `{ success, data: outpass }`
**Flow**: Dashboard.tsx → outpassService.getLatestOutpass() → GET /api/student/latest-outpass → authenticate + authorize(STUDENT) → StudentController.getLatestOutpass → StudentService.getLatestOutpass() → Outpass.findOne().sort({createdAt:-1}).limit(1) → Return

#### 14. GET /api/student/analytics
**Purpose**: Get student analytics
**Request**: None (token in header)
**Response**: `{ success, data: { approved, pending, rejected, overdue } }`
**Flow**: Dashboard.tsx → outpassService.getAnalytics() → GET /api/student/analytics → authenticate + authorize(STUDENT) → StudentController.getAnalytics → StudentService.getAnalytics() → Multiple Outpass.countDocuments() → Return

---

### Warden APIs (7 endpoints)

#### 15. GET /api/warden/hostel-info
**Purpose**: Get warden's hostel information
**Request**: None (token in header)
**Response**: `{ success, data: { hostelName, totalStudents, activeOutpasses, pendingApprovals } }`
**Flow**: Dashboard.tsx → wardenService.getHostelInfo() → GET /api/warden/hostel-info → authenticate + authorize(WARDEN) → WardenController.getHostelInfo → WardenService.getHostelInfo() → Multiple queries → Return

#### 16. GET /api/warden/statistics
**Purpose**: Get outpass statistics
**Request**: None (token in header)
**Response**: `{ success, data: { total, pending, approved, rejected, checkedOut, overdue } }`
**Flow**: Dashboard.tsx → wardenService.getOutpassStats() → GET /api/warden/statistics → authenticate + authorize(WARDEN) → WardenController.getStatistics → WardenService.getStatistics() → Outpass.aggregate() → Return

#### 17. GET /api/warden/analytics
**Purpose**: Get analytics data
**Request**: None (token in header)
**Response**: `{ success, data: { byStatus, byPurpose } }`
**Flow**: Dashboard.tsx → wardenService.getAnalytics() → GET /api/warden/analytics → authenticate + authorize(WARDEN) → WardenController.getAnalytics → WardenService.getAnalytics() → Multiple aggregations → Return

#### 18. GET /api/warden/outpasses-enhanced
**Purpose**: Get outpasses with filters
**Request**: Query params: `status, search, fromDate, toDate, page, limit`
**Response**: `{ success, data: [outpasses], pagination }`
**Flow**: Dashboard.tsx → wardenService.getOutpasses() → GET /api/warden/outpasses-enhanced → authenticate + authorize(WARDEN) → WardenController.getOutpassesEnhanced → WardenService.getOutpassesEnhanced() → Outpass.find({hostel}).populate() → Return

#### 19. GET /api/warden/outpasses/:id
**Purpose**: Get single outpass details
**Request**: Param: `id`
**Response**: `{ success, data: outpass }`
**Flow**: OutpassDetails.tsx → wardenService.getOutpassById() → GET /api/warden/outpasses/:id → authenticate + authorize(WARDEN) → WardenController.getOutpassById → WardenService.getOutpassById() → Outpass.findById().populate() → Verify hostel → Return

#### 20. POST /api/warden/outpasses/:id/approve
**Purpose**: Approve outpass
**Request**: Param: `id`, Body: `{ remarks }`
**Response**: `{ success, message, data: outpass }`
**Flow**: ApproveModal.tsx → wardenService.approveOutpass() → POST /api/warden/outpasses/:id/approve → authenticate + authorize(WARDEN) → WardenController.approveOutpassNew → WardenService.approveOutpass() → QRService.generateQRCode() → outpass.status='approved' → outpass.qrCode=qr → outpass.save() → NotificationService.create() → Return

#### 21. POST /api/warden/outpasses/:id/reject
**Purpose**: Reject outpass
**Request**: Param: `id`, Body: `{ reason }`
**Response**: `{ success, message }`
**Flow**: RejectModal.tsx → wardenService.rejectOutpass() → POST /api/warden/outpasses/:id/reject → authenticate + authorize(WARDEN) → WardenController.rejectOutpassNew → WardenService.rejectOutpass() → outpass.status='rejected' → outpass.rejectionReason=reason → outpass.save() → NotificationService.create() → Return

---

### Admin APIs (18 endpoints)

#### 22. GET /api/admin/statistics/system
**Purpose**: Get system statistics
**Request**: None (token in header)
**Response**: `{ success, data: { totalUsers, totalStudents, totalWardens, totalSecurity, totalOutpasses, activeOutpasses, pendingApprovals } }`
**Flow**: Dashboard.tsx → adminService.getSystemStatistics() → GET /api/admin/statistics/system → authenticate + adminOnly → AdminController.getSystemStatistics → AdminService.getSystemStatistics() → Multiple User.countDocuments() + Outpass.countDocuments() → Return

#### 23. GET /api/admin/statistics/users
**Purpose**: Get user statistics by role
**Request**: None (token in header)
**Response**: `{ success, data: { students, wardens, security, admins } }`
**Flow**: Dashboard.tsx → adminService.getUserStatistics() → GET /api/admin/statistics/users → authenticate + adminOnly → AdminController.getUserStatistics → AdminService.getUserStatistics() → User.aggregate([{$group:{_id:'$role',count:{$sum:1}}}]) → Return

#### 24. GET /api/admin/statistics/outpasses
**Purpose**: Get outpass statistics
**Request**: None (token in header)
**Response**: `{ success, data: { total, byStatus, byPurpose } }`
**Flow**: Dashboard.tsx → adminService.getOutpassStatistics() → GET /api/admin/statistics/outpasses → authenticate + adminOnly → AdminController.getOutpassStatistics → AdminService.getOutpassStatistics() → Multiple Outpass.aggregate() → Return

#### 25. GET /api/admin/statistics/hostels
**Purpose**: Get hostel-wise statistics
**Request**: None (token in header)
**Response**: `{ success, data: [{ hostelName, totalStudents, totalOutpasses, pendingOutpasses, approvedOutpasses, rejectedOutpasses, activeOutpasses }] }`
**Flow**: HostelStats.tsx → adminService.getHostelStatistics() → GET /api/admin/statistics/hostels → authenticate + adminOnly → AdminController.getHostelStatistics → AdminService.getHostelStatistics() → Hostel.find() + For each: count students and outpasses → Return

#### 26. GET /api/admin/users
**Purpose**: Get all users with filters
**Request**: Query params: `role, hostel, search, page, limit`
**Response**: `{ success, data: [users], pagination }`
**Flow**: Users.tsx → adminService.getAllUsers() → GET /api/admin/users → authenticate + adminOnly → AdminController.getAllUsers → AdminService.getAllUsers() → User.find(filters).sort().skip().limit() → Return

#### 27. GET /api/admin/users/:id
**Purpose**: Get single user details
**Request**: Param: `id`
**Response**: `{ success, data: user }`
**Flow**: Users.tsx → adminService.getUserById() → GET /api/admin/users/:id → authenticate + adminOnly → AdminController.getUserById → User.findById().populate('lastOverrideBy') → Return

#### 28. POST /api/admin/users
**Purpose**: Create new user
**Request**: `{ name, email, password, phone, role, rollNumber, department, year, hostel, roomNumber }`
**Response**: `{ success, message, data: user }`
**Flow**: Users.tsx → adminService.createUser() → POST /api/admin/users → authenticate + adminOnly → AdminController.createUser → AdminService.createUser() → Check email exists → Hash password → User.create() → AdminActionLog.create() → Return

#### 29. PUT /api/admin/users/:id
**Purpose**: Update user
**Request**: Param: `id`, Body: `{ name, phone, hostel, roomNumber }`
**Response**: `{ success, data: user }`
**Flow**: Users.tsx → adminService.updateUser() → PUT /api/admin/users/:id → authenticate + adminOnly → AdminController.updateUser → AdminService.updateUser() → User.findByIdAndUpdate() → AdminActionLog.create() → Return

#### 30. DELETE /api/admin/users/:id
**Purpose**: Delete user
**Request**: Param: `id`
**Response**: `{ success, message }`
**Flow**: Users.tsx → adminService.deleteUser() → DELETE /api/admin/users/:id → authenticate + adminOnly → AdminController.deleteUser → AdminService.deleteUser() → User.findByIdAndDelete() → Outpass.deleteMany({student:id}) → AdminActionLog.create() → Return

#### 31. PATCH /api/admin/users/:id/status
**Purpose**: Toggle user active status
**Request**: Param: `id`, Body: `{ isActive }`
**Response**: `{ success, message }`
**Flow**: Users.tsx → adminService.toggleUserStatus() → PATCH /api/admin/users/:id/status → authenticate + adminOnly → AdminController.toggleUserStatus → User.findByIdAndUpdate({isActive}) → AdminActionLog.create() → Return

#### 32. POST /api/admin/users/:id/override
**Purpose**: Override student restriction
**Request**: Param: `id`, Body: `{ reason }`
**Response**: `{ success, message }`
**Flow**: Users.tsx → adminService.overrideRestriction() → POST /api/admin/users/:id/override → authenticate + adminOnly → AdminController.overrideRestriction → user.overdueCount=0 → user.canCreateOutpass=true → user.save() → StudentOverride.create() → AdminActionLog.create() → Return

#### 33. POST /api/admin/users/:id/unlock
**Purpose**: Unlock user account
**Request**: Param: `id`
**Response**: `{ success, message }`
**Flow**: Users.tsx → adminService.unlockUser() → POST /api/admin/users/:id/unlock → authenticate + adminOnly → AdminController.unlockUser → user.overdueCount=0 → user.canCreateOutpass=true → user.save() → AdminActionLog.create() → Return

#### 34. PATCH /api/admin/users/:id/outpass-permission
**Purpose**: Toggle outpass creation permission
**Request**: Param: `id`, Body: `{ canCreateOutpass }`
**Response**: `{ success, message, data: { canCreateOutpass } }`
**Flow**: Users.tsx → adminService.toggleOutpassPermission() → PATCH /api/admin/users/:id/outpass-permission → authenticate + adminOnly → AdminController.toggleOutpassPermission → AdminService.toggleOutpassPermission() → user.canCreateOutpass=value → user.overrideCount++ → user.lastOverrideDate=now → user.lastOverrideBy=adminId → user.save() → AdminActionLog.create() → Return

#### 35. GET /api/admin/outpasses
**Purpose**: Get all outpasses with filters
**Request**: Query params: `status, hostel, purpose, search, dateFrom, dateTo, page, limit`
**Response**: `{ success, data: [outpasses], pagination }`
**Flow**: Dashboard.tsx → adminService.getAllOutpasses() → GET /api/admin/outpasses → authenticate + adminOnly → AdminController.getAllOutpasses → AdminService.getAllOutpasses() → Outpass.find(filters).populate().sort().skip().limit() → Return

#### 36. GET /api/admin/outpasses/:id
**Purpose**: Get single outpass details (admin view)
**Request**: Param: `id`
**Response**: `{ success, data: outpass }`
**Flow**: OutpassDetails.tsx → adminService.getOutpassById() → GET /api/admin/outpasses/:id → authenticate + adminOnly → AdminController.getOutpassById → Outpass.findById().populate('student approvedBy rejectedBy') → Return

#### 37. POST /api/admin/outpasses/:id/override
**Purpose**: Override outpass status
**Request**: Param: `id`, Body: `{ status, reason }`
**Response**: `{ success, message }`
**Flow**: OutpassDetails.tsx → adminService.overrideOutpassStatus() → POST /api/admin/outpasses/:id/override → authenticate + adminOnly → AdminController.overrideOutpassStatus → outpass.status=newStatus → outpass.save() → AdminActionLog.create() → Return

#### 38. GET /api/admin/settings
**Purpose**: Get system settings
**Request**: None (token in header)
**Response**: `{ success, data: { isSystemActive, maxOutpassDuration, autoApprovalEnabled, reminderHoursBefore } }`
**Flow**: Settings.tsx → adminService.getSystemSettings() → GET /api/admin/settings → authenticate + adminOnly → AdminController.getSystemSettings → SystemSettings.findOne() → Return

#### 39. PUT /api/admin/settings
**Purpose**: Update system settings
**Request**: `{ isSystemActive, maxOutpassDuration, autoApprovalEnabled, reminderHoursBefore }`
**Response**: `{ success, message, data: settings }`
**Flow**: Settings.tsx → adminService.updateSystemSettings() → PUT /api/admin/settings → authenticate + adminOnly → AdminController.updateSystemSettings → AdminService.updateSystemSettings() → SystemSettings.findOneAndUpdate() → AdminActionLog.create() → Return

---

### Security APIs (6 endpoints)

#### 40. GET /api/security/statistics
**Purpose**: Get security statistics
**Request**: None (token in header)
**Response**: `{ success, data: { activeOutpasses, checkedOutToday, checkedInToday, overdueOutpasses, totalScansToday } }`
**Flow**: Dashboard.tsx → securityService.getStatistics() → GET /api/security/statistics → authenticate + authorize(SECURITY) → SecurityController.getStatistics → SecurityService.getStatistics() → Multiple queries → Return

#### 41. POST /api/security/validate-qr
**Purpose**: Validate QR code
**Request**: `{ qrCode }`
**Response**: `{ success, data: { outpass, canCheckOut, canCheckIn, message } }`
**Flow**: QRScanner.tsx → securityService.validateQR() → POST /api/security/validate-qr → authenticate + authorize(SECURITY) + rateLimitScan + validateQRCode → SecurityController.validateQR → SecurityService.validateQR() → Decode QR → Outpass.findById().populate() → Check status and dates → Return

#### 42. POST /api/security/check-out
**Purpose**: Check out student
**Request**: `{ outpassId, remarks }`
**Response**: `{ success, message, data: outpass }`
**Flow**: ScanResultCard.tsx → securityService.checkOut() → POST /api/security/check-out → authenticate + authorize(SECURITY) + validateCheckOutRequest → SecurityController.checkOut → SecurityService.checkOut() → outpass.status='checked_out' → outpass.checkOutTime=now → outpass.checkOutBy=securityId → outpass.save() → SecurityLog.create() → NotificationService.create() → Return

#### 43. POST /api/security/check-in
**Purpose**: Check in student
**Request**: `{ outpassId, remarks }`
**Response**: `{ success, message, data: outpass }`
**Flow**: ScanResultCard.tsx → securityService.checkIn() → POST /api/security/check-in → authenticate + authorize(SECURITY) + validateCheckInRequest → SecurityController.checkIn → SecurityService.checkIn() → Check if overdue → outpass.status='checked_in' or 'overdue' → outpass.checkInTime=now → If overdue: user.overdueCount++ → If overdueCount>=3: user.canCreateOutpass=false → outpass.save() + user.save() → SecurityLog.create() → NotificationService.create() → Return

#### 44. GET /api/security/active-outpasses
**Purpose**: Get active outpasses
**Request**: None (token in header)
**Response**: `{ success, data: [outpasses] }`
**Flow**: Dashboard.tsx → securityService.getActiveOutpasses() → GET /api/security/active-outpasses → authenticate + authorize(SECURITY) → SecurityController.getActiveOutpasses → SecurityService.getActiveOutpasses() → Outpass.find({status:'checked_out'}).populate().sort({checkOutTime:-1}) → Return

#### 45. GET /api/security/history
**Purpose**: Get check-in/out history
**Request**: Query params: `type, fromDate, toDate, search, page, limit`
**Response**: `{ success, data: [logs], pagination }`
**Flow**: History.tsx → securityService.getHistory() → GET /api/security/history → authenticate + authorize(SECURITY) + validateHistoryQuery → SecurityController.getHistory → SecurityService.getHistory() → SecurityLog.find(filters).populate().sort().skip().limit() → Return

---

### Hostel APIs (4 endpoints)

#### 46. GET /api/hostels
**Purpose**: Get all hostels (for dropdowns)
**Request**: None (token in header)
**Response**: `{ success, data: [hostels] }`
**Flow**: Multiple pages → hostelService.getAllHostels() → GET /api/hostels → authenticate → HostelController.getAllHostels → Hostel.find().sort({name:1}) → Return

#### 47. POST /api/hostels
**Purpose**: Create new hostel (admin only)
**Request**: `{ name, capacity, wardenName, wardenContact }`
**Response**: `{ success, message, data: hostel }`
**Flow**: HostelStats.tsx → hostelService.createHostel() → POST /api/hostels → authenticate + adminOnly → HostelController.createHostel → Check name exists → Hostel.create() → Return

#### 48. PUT /api/hostels/:id
**Purpose**: Update hostel (admin only)
**Request**: Param: `id`, Body: `{ name, capacity }`
**Response**: `{ success, data: hostel }`
**Flow**: HostelStats.tsx → hostelService.updateHostel() → PUT /api/hostels/:id → authenticate + adminOnly → HostelController.updateHostel → Hostel.findByIdAndUpdate() → Return

#### 49. DELETE /api/hostels/:id
**Purpose**: Delete hostel (admin only)
**Request**: Param: `id`
**Response**: `{ success, message }`
**Flow**: HostelStats.tsx → hostelService.deleteHostel() → DELETE /api/hostels/:id → authenticate + adminOnly → HostelController.deleteHostel → Check if has users → Hostel.findByIdAndDelete() → Return

---

### Notification APIs (5 endpoints)

#### 50. GET /api/notifications
**Purpose**: Get user notifications
**Request**: Query params: `page, limit`
**Response**: `{ success, data: [notifications], pagination }`
**Flow**: MainLayout.tsx → notificationService.getNotifications() → GET /api/notifications → authenticate → NotificationController.getNotifications → Notification.find({user}).sort({createdAt:-1}).skip().limit() → Return

#### 51. GET /api/notifications/unread-count
**Purpose**: Get unread notification count
**Request**: None (token in header)
**Response**: `{ success, data: { count } }`
**Flow**: Header → notificationService.getUnreadCount() → GET /api/notifications/unread-count → authenticate → NotificationController.getUnreadCount → Notification.countDocuments({user,isRead:false}) → Return

#### 52. PATCH /api/notifications/:id/read
**Purpose**: Mark notification as read
**Request**: Param: `id`
**Response**: `{ success, message }`
**Flow**: Notification dropdown → notificationService.markAsRead() → PATCH /api/notifications/:id/read → authenticate → NotificationController.markAsRead → Notification.findByIdAndUpdate({isRead:true}) → Return

#### 53. PATCH /api/notifications/read-all
**Purpose**: Mark all notifications as read
**Request**: None (token in header)
**Response**: `{ success, message }`
**Flow**: Notification dropdown → notificationService.markAllAsRead() → PATCH /api/notifications/read-all → authenticate → NotificationController.markAllAsRead → Notification.updateMany({user,isRead:false},{isRead:true}) → Return

#### 54. DELETE /api/notifications/:id
**Purpose**: Delete notification
**Request**: Param: `id`
**Response**: `{ success, message }`
**Flow**: Notification dropdown → notificationService.deleteNotification() → DELETE /api/notifications/:id → authenticate → NotificationController.deleteNotification → Notification.findByIdAndDelete() → Return

---

## Complete Frontend File List

### Root Files
- **frontend/package.json** - Dependencies: react, react-router-dom, axios, zustand, recharts, react-hot-toast, react-datepicker, react-qr-reader, tailwindcss
- **frontend/package-lock.json** - Dependency lock file
- **frontend/vite.config.ts** - Vite configuration for dev server and build
- **frontend/tsconfig.json** - TypeScript configuration
- **frontend/tsconfig.node.json** - TypeScript config for Node.js
- **frontend/tailwind.config.js** - Tailwind CSS configuration with custom colors
- **frontend/postcss.config.js** - PostCSS configuration for Tailwind
- **frontend/index.html** - HTML entry point, loads main.tsx
- **frontend/.env** - Environment variables (VITE_API_URL, VITE_SOCKET_URL)
- **frontend/.env.example** - Example environment file
- **frontend/.gitignore** - Git ignore rules (node_modules, dist, .env)
- **frontend/README.md** - Frontend documentation

### Source Files (frontend/src/)

#### Core Files
- **frontend/src/main.tsx** - Application entry point, renders App with ErrorBoundary and Toaster
- **frontend/src/App.tsx** - Root component, sets up React Router with all routes
- **frontend/src/index.css** - Global styles, Tailwind imports, custom CSS variables
- **frontend/src/vite-env.d.ts** - Vite type definitions

#### Router
- **frontend/src/router/index.tsx** - Route configuration with role-based protection, lazy loading

#### Services (API Layer)
- **frontend/src/services/api.ts** - Axios instance with interceptors for auth token and error handling
- **frontend/src/services/authService.ts** - Auth APIs: register, login, logout, getProfile, updateProfile, changePassword, getSystemStatus
- **frontend/src/services/outpassService.ts** - Student outpass APIs: createOutpass, getMyOutpasses, getOutpassById, downloadOutpassPDF, cancelOutpass, getLatestOutpass, getAnalytics
- **frontend/src/services/wardenService.ts** - Warden APIs: getHostelInfo, getOutpassStats, getAnalytics, getOutpasses, getOutpassById, approveOutpass, rejectOutpass
- **frontend/src/services/adminService.ts** - Admin APIs: getSystemStatistics, getUserStatistics, getOutpassStatistics, getHostelStatistics, getAllUsers, getUserById, createUser, updateUser, deleteUser, toggleOutpassPermission, getAllOutpasses, getOutpassById, getSystemSettings, updateSystemSettings
- **frontend/src/services/securityService.ts** - Security APIs: getStatistics, validateQR, checkOut, checkIn, getActiveOutpasses, getHistory
- **frontend/src/services/hostelService.ts** - Hostel APIs: getAllHostels, createHostel, updateHostel, deleteHostel
- **frontend/src/services/notificationService.ts** - Notification APIs: getNotifications, getUnreadCount, markAsRead, markAllAsRead, deleteNotification
- **frontend/src/services/socketService.ts** - WebSocket connection for real-time notifications

#### State Management (Zustand)
- **frontend/src/store/authStore.ts** - Auth state: user, token, login(), logout(), updateUser(), persisted to localStorage
- **frontend/src/store/notificationStore.ts** - Notification state: notifications, unreadCount, addNotification(), markAsRead(), clearAll()

#### Types
- **frontend/src/types/index.ts** - TypeScript interfaces: User, Outpass, Notification, Hostel, SystemSettings, API response types, Enums (UserRole, OutpassStatus, OutpassPurpose)

#### Constants
- **frontend/src/constants/index.ts** - Constants: API_BASE_URL, STATUS_OPTIONS, PURPOSE_OPTIONS, ROLE_MAPPINGS, COLOR_SCHEMES

#### Utils
- **frontend/src/utils/errorHandler.ts** - Centralized error handling with toast notifications
- **frontend/src/utils/outpassHelpers.ts** - Utility functions: getStatusColor(), formatDate(), calculateDuration()

#### Layouts
- **frontend/src/layouts/AuthLayout.tsx** - Layout for login/register pages (centered form, no navigation)
- **frontend/src/layouts/MainLayout.tsx** - Main app layout with header, navigation, notification dropdown, profile menu
- **frontend/src/layouts/StudentLayout.tsx** - Student-specific layout with student navigation
- **frontend/src/layouts/WardenLayout.tsx** - Warden-specific layout with warden navigation

#### Pages - Auth
- **frontend/src/pages/auth/Login.tsx** - Login form with email/password, link to register
- **frontend/src/pages/auth/Register.tsx** - Registration form with role selection, hostel dropdown

#### Pages - Student
- **frontend/src/pages/student/Dashboard.tsx** - Student dashboard: welcome section, warning banners, latest outpass card, analytics tiles, analytics chart, filter bar, outpass list
- **frontend/src/pages/student/CreateOutpass.tsx** - Create outpass form: purpose, reason, destination, date/time pickers, emergency contact, permission check
- **frontend/src/pages/student/OutpassDetails.tsx** - Single outpass view: details, QR code, download PDF, cancel button, status timeline
- **frontend/src/pages/student/Profile.tsx** - Student profile: display info, edit form, change password section

#### Pages - Warden
- **frontend/src/pages/warden/Dashboard.tsx** - Warden dashboard: hostel info banner, statistics tiles, analytics chart, outpass list with filters, approve/reject actions
- **frontend/src/pages/warden/OutpassDetails.tsx** - Warden outpass view: student info, outpass details, approve/reject modals, action history
- **frontend/src/pages/warden/Profile.tsx** - Warden profile: display info, edit form, change password

#### Pages - Admin
- **frontend/src/pages/admin/Dashboard.tsx** - Admin dashboard: system statistics, outpass statistics by status, analytics charts, outpass list with filters, status filter tiles
- **frontend/src/pages/admin/Users.tsx** - User management: table with filters, add/edit/delete users, user details modal, outpass permission toggle
- **frontend/src/pages/admin/HostelStats.tsx** - Hostel statistics: hostel-wise stats, add/edit/delete hostels, student count, outpass stats per hostel
- **frontend/src/pages/admin/Settings.tsx** - System settings: toggle system active/inactive, max outpass duration, auto-approval settings
- **frontend/src/pages/admin/OutpassDetails.tsx** - Admin outpass view: full details, override options
- **frontend/src/pages/admin/Outpasses.tsx** - (If exists) All outpasses list with comprehensive filters
- **frontend/src/pages/admin/Profile.tsx** - Admin profile: display info, edit form, change password

#### Pages - Security
- **frontend/src/pages/security/Dashboard.tsx** - Security dashboard: statistics tiles, active outpasses table, quick scan button
- **frontend/src/pages/security/ScanQR.tsx** - QR scanner: camera access, scan result display, check-out/in buttons
- **frontend/src/pages/security/History.tsx** - Check-in/out history: filter by date/type, search functionality
- **frontend/src/pages/security/Profile.tsx** - Security profile: display info, edit form, change password

#### Pages - Error
- **frontend/src/pages/NotFound.tsx** - 404 page
- **frontend/src/pages/Unauthorized.tsx** - 403 page

#### Components - Shared
- **frontend/src/components/ErrorBoundary.tsx** - React error boundary to catch and display errors
- **frontend/src/components/WarningBanner.tsx** - Alert banner with types: error, warning, info, success
- **frontend/src/components/LatestOutpassCard.tsx** - Card showing latest outpass with status badge, download button
- **frontend/src/components/StatusTiles.tsx** - Clickable status tiles showing counts, used for filtering
- **frontend/src/components/AnalyticsChart.tsx** - Donut chart using Recharts, shows status distribution
- **frontend/src/components/FilterBar.tsx** - Filter bar with search, date range, purpose dropdown, quick filters
- **frontend/src/components/OutpassListTable.tsx** - Table of outpasses with sortable columns, action buttons, pagination

#### Components - Warden
- **frontend/src/components/warden/WardenOutpassTable.tsx** - Enhanced table for wardens with approve/reject buttons
- **frontend/src/components/warden/ApproveModal.tsx** - Approval confirmation modal with remarks input
- **frontend/src/components/warden/RejectModal.tsx** - Rejection modal with reason input (required)
- **frontend/src/components/warden/WardenStatisticsTiles.tsx** - Statistics tiles for warden with hostel-specific data
- **frontend/src/components/warden/WardenAnalyticsChart.tsx** - Analytics chart for warden with hostel-specific data
- **frontend/src/components/warden/WardenFilterBar.tsx** - Filter bar for warden with status, date range, search
- **frontend/src/components/warden/HostelContextBanner.tsx** - Shows hostel info: name, student count, active outpasses, pending approvals
- **frontend/src/components/warden/PriorityAlerts.tsx** - Shows urgent items: overdue outpasses, pending approvals

#### Components - Security
- **frontend/src/components/security/QRScanner.tsx** - Camera-based QR scanner using react-qr-reader
- **frontend/src/components/security/ScanResultCard.tsx** - Shows scan result: student photo, details, check-out/in buttons
- **frontend/src/components/security/ActiveOutpassesTable.tsx** - Table of currently checked-out students
- **frontend/src/components/security/SecurityStatisticsTiles.tsx** - Statistics tiles for security: today's scans, active outpasses, overdue count

---

## Complete Backend File List

### Root Files
- **backend/package.json** - Dependencies: fastify, mongoose, bcrypt, jsonwebtoken, qrcode, pdfkit, nodemailer, socket.io, winston
- **backend/package-lock.json** - Dependency lock file
- **backend/tsconfig.json** - TypeScript configuration
- **backend/.env** - Environment variables (NODE_ENV, PORT, MONGODB_URI, JWT_SECRET, JWT_EXPIRES_IN, FRONTEND_URL)
- **backend/.env.example** - Example environment file
- **backend/.gitignore** - Git ignore rules (node_modules, dist, .env, logs)
- **backend/README.md** - Backend documentation

### Source Files (backend/src/)

#### Core Files
- **backend/src/index.ts** - Server entry point: initialize Fastify, connect MongoDB, register routes, setup middleware, start server on port 5000

#### Configuration
- **backend/src/config/database.ts** - MongoDB connection using Mongoose, error handling, success logging
- **backend/src/config/index.ts** - Environment configuration: load .env, export config object (JWT_SECRET, DATABASE_URL, PORT)

#### Models (Database Schemas)
- **backend/src/models/index.ts** - Export all models
- **backend/src/models/User.ts** - User schema: name, email, password (hashed), role (enum: 1=Student, 2=Warden, 3=Security, 4=Admin), phone, rollNumber, department, year, hostel, roomNumber, parentPhone, profileImage, isActive, overdueCount, canCreateOutpass, lastOverdueDate, overrideCount, lastOverrideDate, lastOverrideBy. Indexes: email (unique)
- **backend/src/models/Outpass.ts** - Outpass schema: student (ref User), hostel, fromDate, toDate, reason, destination, purpose (enum: home, medical, personal, emergency, other), emergencyContact, status (enum: pending, approved, rejected, checked_out, checked_in, expired, cancelled, overdue), qrCode, approvedBy (ref User), approvedAt, rejectedBy (ref User), rejectedAt, rejectionReason, checkOutTime, checkOutBy (ref User), checkInTime, checkInBy (ref User), timestamps. Indexes: student, hostel, status
- **backend/src/models/Hostel.ts** - Hostel schema: name (unique), capacity, currentOccupancy, wardenName, wardenContact, timestamps
- **backend/src/models/Notification.ts** - Notification schema: user (ref User), title, message, type (enum: info, success, warning, error), isRead, relatedOutpass (ref Outpass), timestamps. Index: user
- **backend/src/models/SystemSettings.ts** - System settings schema: isSystemActive, maxOutpassDuration, autoApprovalEnabled, reminderHoursBefore. Singleton pattern (single document)
- **backend/src/models/SecurityLog.ts** - Security log schema: outpass (ref Outpass), action (enum: check_out, check_in), performedBy (ref User), timestamp, remarks. Indexes: outpass, performedBy
- **backend/src/models/AdminActionLog.ts** - Admin action log schema: admin (ref User), action, targetUser (ref User), targetOutpass (ref Outpass), details, timestamp. Indexes: admin, timestamp
- **backend/src/models/StudentOverride.ts** - Student override log schema: student (ref User), admin (ref User), reason, overrideType, timestamp

#### Controllers (Request Handlers)
- **backend/src/controllers/auth.controller.ts** - Auth endpoints: register(), login(), logout(), getProfile(), updateProfile(), changePassword(), getSystemStatus()
- **backend/src/controllers/student.controller.ts** - Student endpoints: createOutpass(), getMyOutpasses(), getOutpassById(), downloadOutpassPDF(), cancelOutpass(), getDashboard(), getLatestOutpass(), getAnalytics()
- **backend/src/controllers/warden.controller.ts** - Warden endpoints: getHostelInfo(), getStatistics(), getAnalytics(), getOutpassesEnhanced(), getOutpassById(), approveOutpassNew(), rejectOutpassNew()
- **backend/src/controllers/admin.controller.ts** - Admin endpoints: getSystemStatistics(), getUserStatistics(), getOutpassStatistics(), getHostelStatistics(), getAllUsers(), getUserById(), createUser(), updateUser(), deleteUser(), toggleUserStatus(), overrideRestriction(), unlockUser(), toggleOutpassPermission(), getAllOutpasses(), getOutpassById(), overrideOutpassStatus(), getSystemSettings(), updateSystemSettings(), getAuditLogs(), getCriticalAlerts()
- **backend/src/controllers/security.controller.ts** - Security endpoints: getStatistics(), getDashboard(), validateQR(), checkOut(), checkIn(), getActiveOutpasses(), getHistory()
- **backend/src/controllers/hostel.controller.ts** - Hostel endpoints: getAllHostels(), createHostel(), updateHostel(), deleteHostel()
- **backend/src/controllers/notification.controller.ts** - Notification endpoints: getNotifications(), getUnreadCount(), markAsRead(), markAllAsRead(), deleteNotification()

#### Services (Business Logic)
- **backend/src/services/index.ts** - Export all services
- **backend/src/services/AuthService.ts** - Auth logic: register(), login(), updateProfile(), changePassword(). Password hashing with bcrypt, JWT generation, email validation
- **backend/src/services/StudentService.ts** - Student logic: validateOutpassCreation() (check system active, canCreateOutpass, overdueCount<3, duration<=max), getLatestOutpass(), getAnalytics(), downloadOutpassPDF(), verifyOutpassOwnership()
- **backend/src/services/WardenService.ts** - Warden logic: getHostelInfo(), getStatistics(), getAnalytics(), getOutpassesEnhanced(), approveOutpass() (generate QR, update status, create notification), rejectOutpass() (update status, create notification)
- **backend/src/services/AdminService.ts** - Admin logic: getSystemStatistics(), getUserStatistics(), getOutpassStatistics(), getHostelStatistics(), getAllUsers(), createUser(), updateUser(), deleteUser(), toggleOutpassPermission() (update canCreateOutpass, increment overrideCount, log action), updateSystemSettings()
- **backend/src/services/SecurityService.ts** - Security logic: getStatistics(), validateQR() (decode QR, find outpass, check status/dates, determine actions), checkOut() (verify status=approved, update to checked_out, log, notify), checkIn() (verify status=checked_out, check overdue, update overdueCount, disable canCreateOutpass if >=3, log, notify), getActiveOutpasses(), getHistory()
- **backend/src/services/OutpassService.ts** - Outpass logic: createOutpass() (validate, create, notify warden), getStudentOutpasses(), getOutpassById(), cancelOutpass(), updateOutpassStatus()
- **backend/src/services/NotificationService.ts** - Notification logic: create(), getNotifications(), getUnreadCount(), markAsRead(), markAllAsRead(), deleteNotification(), sendToUser() (via WebSocket)
- **backend/src/services/QRService.ts** - QR code logic: generateQRCode() (encode outpass ID, return base64 image), decodeQRCode() (extract outpass ID)
- **backend/src/services/PDFService.ts** - PDF logic: generateOutpassPDF() (create PDF with student details, QR code, outpass info, return buffer)
- **backend/src/services/EmailService.ts** - Email logic: sendEmail(), sendOutpassApprovalEmail(), sendOutpassRejectionEmail(), sendOverdueWarningEmail() (uses nodemailer)
- **backend/src/services/OverdueService.ts** - Overdue logic: checkOverdueOutpasses() (find checked_out past toDate, update to overdue, increment overdueCount, notify). Runs periodically
- **backend/src/services/ReminderService.ts** - Reminder logic: sendReminders() (find outpasses nearing return, send notifications). Runs periodically
- **backend/src/services/SocketService.ts** - WebSocket logic: initialize(), sendToUser(), sendToRole(), broadcastToAll(). Real-time notifications

#### Middleware
- **backend/src/middleware/index.ts** - Export all middleware
- **backend/src/middleware/auth.middleware.ts** - Auth middleware: authenticate() (verify JWT, attach user to request), authorize(roles) (check user role)
- **backend/src/middleware/role.middleware.ts** - Role middleware: adminOnly(), wardenOnly(), securityOnly(), studentOnly()
- **backend/src/middleware/security.middleware.ts** - Security middleware: validateQRCode(), rateLimitScan() (max 10/min), validateCheckOutRequest(), validateCheckInRequest(), validateHistoryQuery()
- **backend/src/middleware/error.middleware.ts** - Error middleware: errorHandler() (log errors, format response, handle different error types)
- **backend/src/middleware/rateLimit.middleware.ts** - Rate limit middleware: rateLimiter() (1000 req/min per IP), strictRateLimiter()
- **backend/src/middleware/auditLog.middleware.ts** - Audit middleware: auditLog() (log admin actions to AdminActionLog)

#### Routes
- **backend/src/routes/index.ts** - Route aggregation: register all route modules, prefix with /api
- **backend/src/routes/auth.routes.ts** - Auth routes: POST /register, POST /login, POST /logout, GET /profile, PUT /profile, POST /change-password, GET /system-status
- **backend/src/routes/student.routes.ts** - Student routes (all require auth + student role): GET /dashboard, GET /latest-outpass, GET /analytics, POST /outpasses, GET /outpasses, GET /outpasses/:id, GET /outpasses/:id/download, PATCH /outpasses/:id/cancel
- **backend/src/routes/warden.routes.ts** - Warden routes (all require auth + warden role): GET /hostel-info, GET /statistics, GET /analytics, GET /outpasses-enhanced, GET /outpasses/:id, POST /outpasses/:id/approve, POST /outpasses/:id/reject

, GET /settings, PUT /settings, GET /audit-logs
- **backend/src/routes/security.routes.ts** - Security routes (all require auth + security role): GET /statistics, GET /dashboard, POST /validate-qr, POST /check-out, POST /check-in, GET /active-outpasses, GET /history
- **backend/src/routes/hostel.routes.ts** - Hostel routes: GET /hostels (auth), POST /hostels (admin), PUT /hostels/:id (admin), DELETE /hostels/:id (admin)
- **backend/src/routes/notification.routes.ts** - Notification routes (all require auth): GET /, GET /unread-count, PATCH /:id/read, PATCH /read-all, DELETE /:id

#### Utils
- **backend/src/utils/index.ts** - Export all utils
- **backend/src/utils/logger.ts** - Winston logger: log to console and files (combined.log, error.log), log levels: error, warn, info, debug
- **backend/src/utils/hash.ts** - Password hashing: hashPassword() (bcrypt with 10 salt rounds), comparePassword() (compare with hash)
- **backend/src/utils/validators.ts** - Validation: validateEmail() (regex), validatePhone() (10 digits), validateRollNumber(), validateDate()
- **backend/src/utils/helpers.ts** - Helper functions: formatDate(), calculateDuration(), generateRandomString(), sanitizeInput()

#### Types
- **backend/src/types/index.ts** - TypeScript interfaces: IUser, IOutpass, INotification, IHostel, ISystemSettings, ISecurityLog, IAdminActionLog, IStudentOverride. Enums: UserRole (STUDENT=1, WARDEN=2, SECURITY=3, ADMIN=4), OutpassStatus, OutpassPurpose. Request/Response types

#### Socket
- **backend/src/socket/handlers.ts** - WebSocket event handlers: handleConnection() (new connection), handleDisconnect(), handleJoinRoom() (join user-specific room), handleLeaveRoom(). Emit real-time notifications

#### Scripts
- **backend/src/scripts/seed.ts** - Database seeding: create sample users (10 students, 2 wardens, 1 security, 1 admin), create 3 hostels, create 100 sample outpasses with varied dates, create system settings. Usage: `npm run seed`
- **backend/src/scripts/checkData.ts** - Data verification: check database connection, verify data integrity, count documents, display statistics. Usage: `npm run check-data`
- **backend/src/scripts/seedData.ts** - Alternative seed script (if exists)
- **backend/src/scripts/createOutpasses.ts** - Script to create additional outpasses
- **backend/src/scripts/migrateHostels.ts** - Migration script for hostel data

#### Logs
- **backend/logs/combined.log** - All logs (info, warn, error)
- **backend/logs/error.log** - Error logs only

---

## Detailed Flow Examples

### Example 1: Student Creates Outpass (Complete 15-Step Flow)

```
STEP 1: USER ACTION
Location: frontend/src/pages/student/CreateOutpass.tsx
User fills form: purpose, reason, destination, dates, emergency contact
Clicks "Create Outpass" button

STEP 2: FRONTEND VALIDATION
Location: frontend/src/pages/student/CreateOutpass.tsx (handleSubmit function)
Code checks:
- if (!user?.canCreateOutpass) → Show toast "Contact admin", STOP
- if (!departureDate) → Show error, STOP
- if (!returnDate) → Show error, STOP
- if (departureDate >= returnDate) → Show error, STOP
- if (departureDate < new Date()) → Show error, STOP
All validations pass → Continue

STEP 3: API CALL PREPARATION
Location: frontend/src/pages/student/CreateOutpass.tsx
Prepare data object:
{
  reason: formData.reason,
  destination: formData.destination,
  fromDate: departureDate.toISOString(),
  toDate: returnDate.toISOString(),
  purpose: formData.purpose,
  emergencyContact: formData.emergencyContact
}

STEP 4: SERVICE CALL
Location: frontend/src/services/outpassService.ts
Method: createOutpass(outpassData)
Makes HTTP request: POST /api/student/outpasses
Headers: { Authorization: `Bearer ${token}` }
Body: outpassData

STEP 5: BACKEND ROUTE MATCHING
Location: backend/src/routes/student.routes.ts (line 17)
Fastify matches route: POST /outpasses
Applies middleware chain: authenticate → authorize(STUDENT)

STEP 6: AUTHENTICATION MIDDLEWARE
Location: backend/src/middleware/auth.middleware.ts (authenticate function)
- Extract token from Authorization header
- Verify JWT token using JWT_SECRET
- Decode token to get userId
- Query database: User.findById(userId)
- If invalid token → Return 401 Unauthorized
- If valid → Attach user to request.user, continue

STEP 7: AUTHORIZATION MIDDLEWARE
Location: backend/src/middleware/auth.middleware.ts (authorize function)
- Check if request.user.role === UserRole.STUDENT (1)
- If not student → Return 403 Forbidden
- If student → Continue to controller

STEP 8: CONTROLLER ENTRY
Location: backend/src/controllers/student.controller.ts (createOutpass method)
- Extract data from request.body
- Extract userId from request.user._id
- Call StudentService.validateOutpassCreation()

STEP 9: VALIDATION SERVICE
Location: backend/src/services/StudentService.ts (validateOutpassCreation method)
Parallel queries:
- SystemSettings.findOne() → Get system settings
- User.findById(userId) → Get user details

Validation checks:
1. if (!settings?.isSystemActive) → Return error "System inactive"
2. if (!user.canCreateOutpass) → Return error "Not allowed, contact admin"
3. if (user.overdueCount >= 3) → Return error "Exceeded overdue limit"
4. Calculate duration = (toDate - fromDate) / (1000 * 60 * 60 * 24)
5. if (duration > settings.maxOutpassDuration) → Return error "Duration exceeds max"

All validations pass → Return { valid: true }

STEP 10: OUTPASS CREATION SERVICE
Location: backend/src/services/OutpassService.ts (createOutpass method)
Create new Outpass document:
{
  student: userId,
  hostel: user.hostel,
  fromDate: data.fromDate,
  toDate: data.toDate,
  reason: data.reason,
  destination: data.destination,
  purpose: data.purpose,
  emergencyContact: data.emergencyContact,
  status: 'pending'
}
Save to database: outpass.save()

STEP 11: FIND WARDEN
Location: backend/src/services/NotificationService.ts
Query: User.findOne({ role: UserRole.WARDEN, hostel: user.hostel })
Get warden for student's hostel

STEP 12: CREATE NOTIFICATION
Location: backend/src/services/NotificationService.ts (create method)
Create Notification document:
{
  user: wardenId,
  title: "New Outpass Request",
  message: `${student.name} (${student.rollNumber}) has requested an outpass`,
  type: "info",
  relatedOutpass: outpassId,
  isRead: false
}
Save to database: notification.save()

STEP 13: WEBSOCKET NOTIFICATION
Location: backend/src/services/SocketService.ts (sendToUser method)
Emit to warden via WebSocket:
socket.to(wardenId).emit('notification', notification)
Warden receives real-time notification

STEP 14: RESPONSE TO FRONTEND
Location: backend/src/controllers/student.controller.ts
Return response:
{
  success: true,
  message: "Outpass created successfully",
  data: outpass
}
HTTP Status: 200

STEP 15: FRONTEND NAVIGATION
Location: frontend/src/pages/student/CreateOutpass.tsx
- Receive response
- Extract outpass._id
- navigate(`/student/outpass/${response._id}`)
- Redirect to outpass details page
- Student sees "Status: Pending"
```

---

### Example 2: Warden Approves Outpass (Complete 15-Step Flow)

```
STEP 1: WARDEN VIEWS OUTPASS
Location: frontend/src/pages/warden/Dashboard.tsx
Warden sees outpass in pending list
Clicks "Approve" button on outpass row

STEP 2: MODAL OPENS
Location: frontend/src/components/warden/ApproveModal.tsx
Modal displays:
- Student name and details
- Outpass information
- Optional remarks input field
- "Confirm Approval" button

STEP 3: WARDEN CONFIRMS
Warden enters remarks (optional): "Approved for family function"
Clicks "Confirm Approval" button

STEP 4: API CALL
Location: frontend/src/services/wardenService.ts (approveOutpass method)
POST /api/warden/outpasses/:id/approve
Headers: { Authorization: `Bearer ${token}` }
Body: { remarks: "Approved for family function" }

STEP 5: BACKEND ROUTE
Location: backend/src/routes/warden.routes.ts (line 19)
Route matched: POST /outpasses/:id/approve
Middleware: authenticate → authorize(WARDEN)

STEP 6: AUTHENTICATION & AUTHORIZATION
- Verify JWT token
- Check role === WARDEN
- Attach warden user to request

STEP 7: CONTROLLER
Location: backend/src/controllers/warden.controller.ts (approveOutpassNew method)
- Extract outpassId from params
- Extract remarks from body
- Extract wardenId from request.user._id
- Call WardenService.approveOutpass()

STEP 8: SERVICE - FIND & VERIFY OUTPASS
Location: backend/src/services/WardenService.ts (approveOutpass method)
Query: Outpass.findById(outpassId).populate('student')
Verifications:
- if (!outpass) → Return error "Outpass not found"
- if (outpass.hostel !== warden.hostel) → Return error "Not your hostel"
- if (outpass.status !== 'pending') → Return error "Not pending"
All checks pass → Continue

STEP 9: GENERATE QR CODE
Location: backend/src/services/QRService.ts (generateQRCode method)
Create QR data object:
{
  outpassId: outpass._id,
  studentId: outpass.student._id,
  timestamp: Date.now()
}
Generate QR code image using qrcode library
Convert to base64 string
Return qrCodeBase64

STEP 10: UPDATE OUTPASS
Location: backend/src/services/WardenService.ts
Update outpass fields:
- outpass.status = 'approved'
- outpass.approvedBy = wardenId
- outpass.approvedAt = new Date()
- outpass.qrCode = qrCodeBase64
- outpass.remarks = remarks
Save: outpass.save()

STEP 11: CREATE NOTIFICATION FOR STUDENT
Location: backend/src/services/NotificationService.ts
Create Notification:
{
  user: studentId,
  title: "Outpass Approved",
  message: "Your outpass request has been approved by the warden",
  type: "success",
  relatedOutpass: outpassId,
  isRead: false
}
Save: notification.save()

STEP 12: WEBSOCKET TO STUDENT
Location: backend/src/services/SocketService.ts
Emit to student:
socket.to(studentId).emit('notification', notification)
Student receives real-time notification

STEP 13: RESPONSE
Location: backend/src/controllers/warden.controller.ts
Return:
{
  success: true,
  message: "Outpass approved successfully",
  data: outpass
}

STEP 14: FRONTEND UPDATE
Location: frontend/src/pages/warden/Dashboard.tsx
- Close approval modal
- Show success toast: "Outpass approved successfully"
- Refresh outpass list
- Decrement pending count
- Increment approved count

STEP 15: STUDENT SEES UPDATE
Location: frontend/src/pages/student/Dashboard.tsx
- Student receives WebSocket notification
- Notification badge updates
- Student can now:
  - View QR code in outpass details
  - Download PDF with QR code
  - Show QR at security gate for check-out
```

---

### Example 3: Security Checks Out Student (Complete 19-Step Flow)

```
STEP 1: SECURITY OPENS SCANNER
Location: frontend/src/pages/security/ScanQR.tsx
Security guard clicks "Scan QR Code" button
Camera access requested

STEP 2: CAMERA ACCESS
Location: frontend/src/components/security/QRScanner.tsx
Browser requests camera permission
User grants permission
Camera feed starts

STEP 3: QR CODE SCAN
Student shows QR code on phone
QR scanner detects and reads QR code
Extract QR code data (base64 string)

STEP 4: VALIDATE QR API CALL
Location: frontend/src/services/securityService.ts (validateQR method)
POST /api/security/validate-qr
Headers: { Authorization: `Bearer ${token}` }
Body: { qrCode: "base64_qr_string" }

STEP 5: BACKEND ROUTE
Location: backend/src/routes/security.routes.ts (line 23-26)
Route: POST /validate-qr
Middleware chain:
1. authenticate
2. authorize(SECURITY)
3. rateLimitScan (max 10 scans per minute)
4. validateQRCode (check QR format)

STEP 6: RATE LIMIT CHECK
Location: backend/src/middleware/security.middleware.ts (rateLimitScan)
Check scan rate for this security user
If > 10 scans in last minute → Return 429 Too Many Requests
If OK → Continue

STEP 7: QR VALIDATION MIDDLEWARE
Location: backend/src/middleware/security.middleware.ts (validateQRCode)
- Check QR code format
- Attempt to decode QR code
- Extract outpassId from QR data
- If invalid format → Return 400 Bad Request
- If valid → Attach outpassId to request, continue

STEP 8: CONTROLLER
Location: backend/src/controllers/security.controller.ts (validateQR method)
- Extract qrCode from body
- Call SecurityService.validateQR()

STEP 9: SERVICE - DECODE & FIND
Location: backend/src/services/SecurityService.ts (validateQR method)
- Decode QR code to extract outpassId
- Query: Outpass.findById(outpassId).populate('student')
- if (!outpass) → Return error "Invalid QR code"

STEP 10: SERVICE - VALIDATE STATUS & DATES
Check outpass status:
- if (status !== 'approved' && status !== 'checked_out') → Return error "Invalid status"

Check dates:
- currentTime = new Date()
- if (currentTime < outpass.fromDate) → Return error "Too early"
- if (currentTime > outpass.toDate) → Return error "Expired"

STEP 11: SERVICE - DETERMINE ACTIONS
Determine available actions:
- if (status === 'approved' && currentTime >= fromDate):
  canCheckOut = true, canCheckIn = false
  message = "Valid outpass - Ready for check-out"
- if (status === 'checked_out'):
  canCheckOut = false, canCheckIn = true
  message = "Student is checked out - Ready for check-in"

STEP 12: RESPONSE WITH OUTPASS DATA
Return:
{
  success: true,
  data: {
    outpass: {
      _id, student: { name, rollNumber, hostel, photo },
      fromDate, toDate, destination, purpose
    },
    canCheckOut: true,
    canCheckIn: false,
    message: "Valid outpass - Ready for check-out"
  }
}

STEP 13: FRONTEND DISPLAYS RESULT
Location: frontend/src/components/security/ScanResultCard.tsx
Display:
- Student photo (if available)
- Student name and roll number
- Hostel name
- Outpass details (dates, destination)
- "Check Out" button (enabled, green)
- "Check In" button (disabled, gray)
- Validation message

STEP 14: SECURITY CLICKS CHECK OUT
Security guard verifies student identity
Clicks "Check Out" button

STEP 15: CHECK OUT API CALL
Location: frontend/src/services/securityService.ts (checkOut method)
POST /api/security/check-out
Body: { outpassId, remarks: "Checked out at main gate" }

STEP 16: BACKEND CHECK OUT
Location: backend/src/routes/security.routes.ts → SecurityController.checkOut → SecurityService.checkOut()
- Find outpass
- Verify status === 'approved'
- Update: outpass.status = 'checked_out'
- Update: outpass.checkOutTime = new Date()
- Update: outpass.checkOutBy = securityId
- Save: outpass.save()

STEP 17: CREATE SECURITY LOG
Location: backend/src/models/SecurityLog.ts
Create SecurityLog:
{
  outpass: outpassId,
  action: 'check_out',
  performedBy: securityId,
  timestamp: new Date(),
  remarks: "Checked out at main gate"
}
Save: log.save()

STEP 18: NOTIFY STUDENT
Location: backend/src/services/NotificationService.ts
Create notification:
{
  user: studentId,
  title: "Checked Out",
  message: "You have been checked out successfully",
  type: "info"
}
Emit via WebSocket to student

STEP 19: FRONTEND UPDATE
Location: frontend/src/pages/security/ScanQR.tsx
- Show success message: "Student checked out successfully"
- Clear scanner
- Update statistics:
  - Increment activeOutpasses count
  - Increment checkedOutToday count
- Ready for next scan
```

---

### Example 4: Admin Toggles Student Outpass Permission (Complete 10-Step Flow)

```
STEP 1: ADMIN VIEWS USER LIST
Location: frontend/src/pages/admin/Users.tsx
Admin sees list of users with filters
Finds student: "John Doe (CS2021001)"
Clicks "View Details" button

STEP 2: USER DETAILS MODAL OPENS
Location: frontend/src/pages/admin/Users.tsx (UserDetailsModal component)
Modal displays:
- Name: John Doe
- Email: john@example.com
- Roll Number: CS2021001
- Hostel: Hostel A
- Overdue Count: 0
- Override Count: 2
- Outpass Permission: Toggle switch (currently ON/green)

STEP 3: ADMIN TOGGLES PERMISSION
Admin clicks toggle switch to disable outpass permission
Toggle animates from green (ON) to gray (OFF)
handleToggleOutpassPermission() function called immediately

STEP 4: API CALL
Location: frontend/src/services/adminService.ts (toggleOutpassPermission method)
PATCH /api/admin/users/:id/outpass-permission
Headers: { Authorization: `Bearer ${token}` }
Body: { canCreateOutpass: false }

STEP 5: BACKEND ROUTE
Location: backend/src/routes/admin.routes.ts (line 26)
Route: PATCH /users/:id/outpass-permission
Middleware: authenticate → adminOnly

STEP 6: ADMIN AUTHORIZATION
Location: backend/src/middleware/role.middleware.ts (adminOnly)
- Verify user.role === UserRole.ADMIN (4)
- If not admin → Return 403 Forbidden
- If admin → Continue

STEP 7: CONTROLLER
Location: backend/src/controllers/admin.controller.ts (toggleOutpassPermission method)
- Extract userId from params
- Extract canCreateOutpass from body (false)
- Extract adminId from request.user._id
- Call AdminService.toggleOutpassPermission()

STEP 8: SERVICE - UPDATE USER
Location: backend/src/services/AdminService.ts (toggleOutpassPermission method)
Query: User.findById(userId)
Update fields:
- user.canCreateOutpass = false
- user.overrideCount = user.overrideCount + 1 (now 3)
- user.lastOverrideDate = new Date()
- user.lastOverrideBy = adminId
Save: user.save()

Create AdminActionLog:
{
  admin: adminId,
  action: 'toggle_outpass_permission',
  targetUser: userId,
  details: { canCreateOutpass: false },
  timestamp: new Date()
}
Save: log.save()

STEP 9: RESPONSE
Return:
{
  success: true,
  message: "Outpass permission updated successfully",
  data: { canCreateOutpass: false }
}

STEP 10: FRONTEND UPDATE & STUDENT IMPACT
Location: frontend/src/pages/admin/Users.tsx
- Show success toast: "Outpass permission disabled successfully"
- Refresh user list automatically
- Update modal: Override Count now shows 3
- Close modal

STUDENT IMPACT:
When student (John Doe) tries to create outpass:
Location: frontend/src/pages/student/CreateOutpass.tsx (handleSubmit)
- Check: if (!user?.canCreateOutpass)
- Show toast: "Please contact admin to enable outpass creation permission"
- Form submission blocked
- Student cannot create outpass until admin re-enables permission
```

---

## Database Collections Structure

### users Collection
```javascript
{
  _id: ObjectId,
  name: String,
  email: String (unique, indexed),
  password: String (hashed, excluded by default),
  role: Number (1=Student, 2=Warden, 3=Security, 4=Admin),
  phone: String,
  rollNumber: String (for students),
  department: String,
  year: Number,
  hostel: String (indexed),
  roomNumber: String,
  parentPhone: String,
  profileImage: String,
  isActive: Boolean,
  overdueCount: Number (default: 0),
  canCreateOutpass: Boolean (default: true),
  lastOverdueDate: Date,
  overrideCount: Number (default: 0),
  lastOverrideDate: Date,
  lastOverrideBy: ObjectId (ref: User),
  createdAt: Date,
  updatedAt: Date
}
```

### outpasses Collection
```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User, indexed),
  hostel: String (indexed),
  fromDate: Date,
  toDate: Date,
  reason: String,
  destination: String,
  purpose: String (enum: home, medical, personal, emergency, other),
  emergencyContact: String,
  status: String (enum: pending, approved, rejected, checked_out, checked_in, expired, cancelled, overdue, indexed),
  qrCode: String (base64),
  approvedBy: ObjectId (ref: User),
  approvedAt: Date,
  rejectedBy: ObjectId (ref: User),
  rejectedAt: Date,
  rejectionReason: String,
  checkOutTime: Date,
  checkOutBy: ObjectId (ref: User),
  checkInTime: Date,
  checkInBy: ObjectId (ref: User),
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### hostels Collection
```javascript
{
  _id: ObjectId,
  name: String (unique),
  capacity: Number,
  currentOccupancy: Number,
  wardenName: String,
  wardenContact: String,
  createdAt: Date,
  updatedAt: Date
}
```

### notifications Collection
```javascript
{
  _id: ObjectId,
  user: ObjectId (ref: User, indexed),
  title: String,
  message: String,
  type: String (enum: info, success, warning, error),
  isRead: Boolean (indexed),
  relatedOutpass: ObjectId (ref: Outpass),
  createdAt: Date (indexed),
  updatedAt: Date
}
```

### systemsettings Collection
```javascript
{
  _id: ObjectId,
  isSystemActive: Boolean (default: true),
  maxOutpassDuration: Number (default: 7 days),
  autoApprovalEnabled: Boolean (default: false),
  reminderHoursBefore: Number (default: 24),
  createdAt: Date,
  updatedAt: Date
}
// Note: Only one document exists (singleton pattern)
```

### securitylogs Collection
```javascript
{
  _id: ObjectId,
  outpass: ObjectId (ref: Outpass, indexed),
  action: String (enum: check_out, check_in),
  performedBy: ObjectId (ref: User, indexed),
  timestamp: Date (indexed),
  remarks: String,
  createdAt: Date,
  updatedAt: Date
}
```

### adminactionlogs Collection
```javascript
{
  _id: ObjectId,
  admin: ObjectId (ref: User, indexed),
  action: String,
  targetUser: ObjectId (ref: User),
  targetOutpass: ObjectId (ref: Outpass),
  details: Object,
  timestamp: Date (indexed),
  createdAt: Date,
  updatedAt: Date
}
```

### studentoverrides Collection
```javascript
{
  _id: ObjectId,
  student: ObjectId (ref: User),
  admin: ObjectId (ref: User),
  reason: String,
  overrideType: String,
  timestamp: Date,
  createdAt: Date,
  updatedAt: Date
}
```

---

## Environment Variables

### Backend (.env)
```
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/campuspass
JWT_SECRET=your_jwt_secret_key_here_change_in_production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (.env)
```
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
```

---

## Testing Credentials (After Seeding)

**Admin:**
- Email: admin@campus.com
- Password: admin123
- Access: Full system control

**Warden (Hostel A):**
- Email: warden.a@campus.com
- Password: warden123
- Access: Hostel A outpasses only

**Security:**
- Email: security@campus.com
- Password: security123
- Access: QR scanning, check-in/out

**Student:**
- Email: student1@campus.com
- Password: student123
- Access: Create outpasses, view own outpasses

---

## Quick Start Guide

### 1. Setup Backend
```bash
cd backend
npm install
# Create .env file with MongoDB URI and JWT secret
npm run seed  # Seed database with sample data
npm run dev   # Start backend server on port 5000
```

### 2. Setup Frontend
```bash
cd frontend
npm install
# Create .env file with API URL
npm run dev   # Start frontend on port 5173
```

### 3. Access Application
- Open browser: http://localhost:5173
- Login with test credentials above
- Explore different role dashboards

---

## Common Issues & Solutions

**Issue 1: MongoDB Connection Failed**
- Solution: Ensure MongoDB is running on localhost:27017
- Check: `mongod --version` and `mongo` command

**Issue 2: JWT Token Expired**
- Solution: Login again to get new token
- Token expires after 7 days (JWT_EXPIRES_IN)

**Issue 3: CORS Errors**
- Solution: Verify FRONTEND_URL in backend .env matches frontend URL
- Default: http://localhost:5173

**Issue 4: QR Code Not Scanning**
- Solution: Grant camera permissions in browser
- Use HTTPS in production for camera access

**Issue 5: Notifications Not Appearing**
- Solution: Check WebSocket connection in browser console
- Verify VITE_SOCKET_URL in frontend .env

**Issue 6: Rate Limit Errors (429)**
- Solution: Wait 1 minute or increase limit in rateLimit.middleware.ts
- Current limit: 1000 requests per minute

---

## API Response Format Standards

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

### 4. State Management (Zustand)
```
authStore: Stores user and token, persisted to localStorage
notificationStore: Stores notifications and unread count
```

### 5. Real-time Updates (WebSocket)
```
Backend emits events → Frontend listens → Updates UI immediately
Used for: Notifications, live outpass updates
```

### 6. Error Handling
```
Try-catch in services → Error middleware in backend → User-friendly messages → Toast notifications in frontend
```

---

## Conclusion

This documentation provides:
- **54 API endpoints** with complete request/response formats
- **Every frontend file** (100+ files) with purpose
- **Every backend file** (80+ files) with purpose
- **4 detailed flow examples** with 10-19 steps each
- **Database schema** for all 8 collections
- **Environment setup** and testing guide

For beginners: Start with the flow examples to understand data movement, then explore specific files mentioned in the flows.

For developers: Use as API reference and codebase map when implementing features or debugging issues.

---

**Last Updated**: February 8, 2026
**Version**: 2.0.0 (Complete)
**File Count**: Frontend: 100+ files, Backend: 80+ files
**Total API Endpoints**: 54
**Maintained By**: Campus Pass Development Team
