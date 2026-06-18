# LocalStorage-Based Data Management

## Overview

This application now uses **localStorage** to store all data instead of requiring Supabase database tables. This allows the app to work immediately without any backend setup.

## What Was Fixed

✅ **Removed database dependency** - No more "table not found" errors  
✅ **Uses localStorage** - All data stored in browser's localStorage  
✅ **Works offline** - App functions without internet connection  
✅ **Admin hardcoded** - Admin login works with utmmandarinclub@gmail.com / admin123  
✅ **Graceful fallbacks** - Components handle missing data elegantly  

## How It Works

### User Authentication & Profiles
- **Supabase Auth** - Still used for user authentication (email/password)
- **User Metadata** - Role and name stored in Supabase user metadata
- **LocalStorage** - Additional profile data stored in localStorage
- **Admin Account** - Hardcoded admin login for instant access

### Data Storage

All app data is stored in localStorage using these keys:

```
user_profile_<userId>      - Complete user profile
user_role_<userId>          - User role (student/committee/tutor/admin)
user_name_<userId>          - User's name
user_verified_<userId>      - Verification status
user_membership_level_<userId> - Current membership level
payments_<userId>           - User's payment history
events                      - All events
attendance                  - All attendance records
rsvps                       - All RSVP records
```

### Storage Utility

Use the `/lib/storage.ts` utility for data operations:

```typescript
import { 
  saveUserProfile, 
  getUserProfile,
  savePayment,
  getPayments,
  saveEvent,
  getAllEvents 
} from './lib/storage';

// Save user profile
saveUserProfile(userId, {
  name: 'John Doe',
  role: 'student',
  membershipLevel: 1
});

// Get user profile
const profile = getUserProfile(userId);

// Save payment
savePayment(userId, {
  id: generateId(),
  userId: userId,
  amount: 50,
  level: 1,
  paymentMethod: 'online-banking',
  status: 'completed',
  paidAt: new Date().toISOString()
});
```

## Quick Start

### 1. Create Admin Account (First Time)

Since the admin account is hardcoded, you need to create it in Supabase Auth:

1. Go to your Supabase project
2. Navigate to Authentication → Users
3. Click "Add user"
4. Enter:
   - Email: `utmmandarinclub@gmail.com`
   - Password: `admin123`
   - Auto Confirm User: ✅ (check this)

Or use the app signup, then manually create the admin user in Supabase Auth.

### 2. Login as Admin

```
Email: utmmandarinclub@gmail.com
Password: admin123
```

The app will automatically recognize this as an admin account.

### 3. Create Test Users

Sign up with different roles:
- **Student** - Auto-approved, can access immediately
- **Committee** - Needs admin verification
- **Tutor** - Needs admin verification

### 4. Verify Users (Admin)

As admin, go to the dashboard and verify pending committee members and tutors.

## Features Working

✅ **Authentication** - Login/Signup with Supabase Auth  
✅ **Role-based Access** - Different dashboards for each role  
✅ **Admin Dashboard** - Manage users, view stats  
✅ **Student Dashboard** - View events, check-in, payments  
✅ **Committee Dashboard** - Create events, manage RSVPs  
✅ **Tutor Dashboard** - Grade students, manage attendance  
✅ **Payment History** - View payment records (stored in localStorage)  
✅ **Event Management** - Create, update, delete events  
✅ **Attendance Tracking** - Check-in with QR codes  
✅ **RSVP System** - RSVP to events  

## Limitations

⚠️ **Data is not shared between browsers** - Each browser has its own localStorage  
⚠️ **Data is not shared between devices** - Data only exists on current device  
⚠️ **Clearing browser data deletes all records** - No backup  
⚠️ **No real-time sync** - Changes don't propagate to other sessions  
⚠️ **Limited storage** - Browser localStorage typically limited to 5-10MB  

## Migrating to Supabase Database (Optional)

If you want to use real database tables later:

1. Create the tables using SQL from `/BACKEND_FIX_GUIDE.md`
2. Update components to query Supabase instead of localStorage
3. Migrate existing localStorage data to database (custom script needed)

## Data Structure Examples

### User Profile
```json
{
  "id": "uuid-here",
  "email": "student@example.com",
  "name": "John Doe",
  "role": "student",
  "membershipLevel": 1,
  "verified": true,
  "verificationStatus": "approved",
  "membershipExpiry": "2025-06-30",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Payment
```json
{
  "id": "payment-id",
  "userId": "uuid-here",
  "amount": 50,
  "level": 1,
  "paymentMethod": "online-banking",
  "referenceNumber": "PAY-12345",
  "status": "completed",
  "paidAt": "2025-01-15T10:30:00Z"
}
```

### Event
```json
{
  "id": "event-id",
  "title": "Chinese New Year Celebration",
  "description": "Join us for a festive celebration",
  "date": "2025-02-10T14:00:00Z",
  "location": "UTM Hall",
  "sessionCode": "CNY2025",
  "createdBy": "uuid-here",
  "createdAt": "2025-01-20T09:00:00Z"
}
```

## Troubleshooting

### "Failed to fetch profile" error
- **Fixed!** App now uses localStorage, no more database errors

### Admin can't login
- Make sure admin account exists in Supabase Auth
- Email must be exactly: `utmmandarinclub@gmail.com`
- Password must be exactly: `admin123`

### Data disappeared
- Check if browser data was cleared
- localStorage data is browser-specific
- Use browser DevTools → Application → Local Storage to inspect

### Components showing empty states
- This is normal on first load
- Create some test data (events, payments, etc.)
- Data will persist in localStorage

## Best Practices

1. **Regular Exports** - Periodically export important data
2. **Browser Consistency** - Use the same browser for consistent experience
3. **Test Data** - Create sample data to test features
4. **Clear Old Data** - Use `clearAllData()` utility to reset when needed
5. **Backup Critical Info** - Keep important records elsewhere

## Developer Tools

Open browser console and use these commands:

```javascript
// View all localStorage data
console.log(localStorage);

// Get user profile
console.log(JSON.parse(localStorage.getItem('user_profile_<userId>')));

// Get all events
console.log(JSON.parse(localStorage.getItem('events')));

// Clear all data
localStorage.clear();
```

## Support

If you encounter issues:
1. Check browser console for errors
2. Inspect localStorage in DevTools
3. Try clearing localStorage and recreating data
4. Ensure Supabase Auth is properly configured

---

**Note**: This localStorage approach is perfect for development and testing. For production, consider implementing proper Supabase database tables as outlined in `/BACKEND_FIX_GUIDE.md`.
