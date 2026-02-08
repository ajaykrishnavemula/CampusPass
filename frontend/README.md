# Campus Pass Frontend

React + TypeScript + Vite frontend for the Campus Pass Management System.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📁 Project Structure

```
frontend/
├── src/
│   ├── assets/              # Static assets
│   ├── components/          # Reusable components
│   ├── layouts/             # Layout components
│   │   ├── AuthLayout.tsx   # Layout for login/register
│   │   └── MainLayout.tsx   # Layout for authenticated pages
│   ├── pages/               # Page components
│   │   ├── auth/
│   │   │   ├── Login.tsx
│   │   │   └── Register.tsx
│   │   ├── student/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── CreateOutpass.tsx
│   │   │   ├── OutpassHistory.tsx
│   │   │   ├── OutpassDetails.tsx
│   │   │   └── Profile.tsx
│   │   ├── warden/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── PendingRequests.tsx
│   │   │   ├── AllOutpasses.tsx
│   │   │   ├── OutpassDetails.tsx
│   │   │   └── Profile.tsx
│   │   ├── security/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── ScanQR.tsx
│   │   │   ├── ActivePasses.tsx
│   │   │   ├── History.tsx
│   │   │   └── Profile.tsx
│   │   ├── NotFound.tsx
│   │   └── Unauthorized.tsx
│   ├── router/              # Routing configuration
│   │   └── index.tsx        # ✅ Created - Route definitions
│   ├── services/            # API services
│   │   ├── api.ts           # ✅ Created - Axios instance
│   │   ├── authService.ts   # ✅ Created - Auth API calls
│   │   ├── outpassService.ts # ✅ Created - Outpass API calls
│   │   ├── notificationService.ts # ✅ Created - Notification API
│   │   └── socketService.ts # ✅ Created - Socket.io client
│   ├── store/               # Zustand stores
│   │   ├── authStore.ts     # ✅ Created - Auth state
│   │   └── notificationStore.ts # ✅ Created - Notification state
│   ├── types/               # TypeScript types
│   │   └── index.ts         # ✅ Created - Type definitions
│   ├── App.tsx              # ✅ Created - Main App component
│   ├── main.tsx             # ✅ Created - Entry point
│   └── index.css            # ✅ Created - Global styles
├── public/                  # Static files
├── index.html               # ✅ Created - HTML template
├── package.json             # ✅ Created - Dependencies
├── tsconfig.json            # ✅ Created - TypeScript config
├── vite.config.ts           # ✅ Created - Vite config
├── tailwind.config.js       # ✅ Created - Tailwind config
├── postcss.config.js        # ✅ Created - PostCSS config
└── .env.example             # ✅ Created - Environment template
```

## 📝 Remaining Files to Create

### Layouts (2 files)
1. **src/layouts/AuthLayout.tsx** - Simple centered layout for login/register
2. **src/layouts/MainLayout.tsx** - Main layout with header, sidebar, notifications

### Auth Pages (2 files)
3. **src/pages/auth/Login.tsx** - Login form with email/password
4. **src/pages/auth/Register.tsx** - Registration form for students

### Student Pages (5 files)
5. **src/pages/student/Dashboard.tsx** - Student dashboard with stats
6. **src/pages/student/CreateOutpass.tsx** - Form to create outpass request
7. **src/pages/student/OutpassHistory.tsx** - List of all outpasses
8. **src/pages/student/OutpassDetails.tsx** - Single outpass view with QR code
9. **src/pages/student/Profile.tsx** - Student profile page

### Warden Pages (5 files)
10. **src/pages/warden/Dashboard.tsx** - Warden dashboard with stats
11. **src/pages/warden/PendingRequests.tsx** - List of pending approvals
12. **src/pages/warden/AllOutpasses.tsx** - All outpasses in hostel
13. **src/pages/warden/OutpassDetails.tsx** - View & approve/reject outpass
14. **src/pages/warden/Profile.tsx** - Warden profile page

### Security Pages (5 files)
15. **src/pages/security/Dashboard.tsx** - Security dashboard
16. **src/pages/security/ScanQR.tsx** - QR code scanner for check-in/out
17. **src/pages/security/ActivePasses.tsx** - Currently checked-out students
18. **src/pages/security/History.tsx** - Check-in/out history
19. **src/pages/security/Profile.tsx** - Security profile page

### Error Pages (2 files)
20. **src/pages/NotFound.tsx** - 404 page
21. **src/pages/Unauthorized.tsx** - 403 page

## 🎨 Component Guidelines

### Layout Components
- **AuthLayout**: Centered card with gradient background
- **MainLayout**: Header with logo, user menu, notifications bell, sidebar navigation

### Page Components
Each page should:
- Use React Hook Form for forms
- Use Zod for validation
- Show loading states
- Handle errors gracefully
- Use Tailwind CSS for styling
- Be responsive (mobile-first)

### Common Patterns

#### API Call Pattern
```typescript
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);

const fetchData = async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await someService.getData();
    // Handle success
  } catch (err: any) {
    setError(err.response?.data?.message || 'An error occurred');
    toast.error(error);
  } finally {
    setLoading(false);
  }
};
```

#### Form Pattern
```typescript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  field: z.string().min(1, 'Required'),
});

type FormData = z.infer<typeof schema>;

const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
  resolver: zodResolver(schema),
});
```

## 🎯 Key Features to Implement

### Student Features
- Create outpass with form validation
- View outpass history with filters
- Display QR code for approved outpasses
- Download PDF outpass
- Cancel pending requests

### Warden Features
- View pending requests with priority
- Approve with optional remarks
- Reject with mandatory reason
- View all outpasses with filters
- Track overdue students

### Security Features
- QR code scanner using device camera
- Verify QR code authenticity
- Check-out students (scan QR)
- Check-in students (manual or scan)
- View active and overdue passes

## 🔔 Real-time Features

Socket.io events handled:
- `notification` - New notification
- `outpass:created` - New request (for wardens)
- `outpass:approved` - Approval (for students)
- `outpass:rejected` - Rejection (for students)
- `outpass:checked-out` - Check-out (for students)
- `outpass:checked-in` - Check-in (for students)
- `outpass:overdue` - Overdue alert

## 🎨 Styling

Using Tailwind CSS with custom theme:
- Primary color: `#667eea` (purple-blue)
- Secondary color: `#764ba2` (purple)
- Custom utility classes in `index.css`

## 📱 Responsive Design

All pages should be responsive:
- Mobile: Single column, hamburger menu
- Tablet: Adjusted spacing
- Desktop: Full layout with sidebar

## 🔐 Authentication Flow

1. User logs in → Token stored in Zustand + localStorage
2. Token attached to all API requests via Axios interceptor
3. Socket.io connects with token
4. Protected routes check authentication
5. Role-based routing to appropriate dashboard

## 🚀 Next Steps

1. Create all layout components
2. Create all page components
3. Test authentication flow
4. Test all user roles
5. Test real-time notifications
6. Test QR code scanning
7. Ensure responsive design
8. Add loading states
9. Add error handling
10. Test production build

## 📚 Resources

- [React Documentation](https://react.dev/)
- [TypeScript Documentation](https://www.typescriptlang.org/)
- [Vite Documentation](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Zustand](https://github.com/pmndrs/zustand)
- [React Hook Form](https://react-hook-form.com/)
- [Zod](https://zod.dev/)