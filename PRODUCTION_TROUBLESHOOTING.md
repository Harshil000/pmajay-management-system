# Production Deployment Troubleshooting Guide

## Current Issues & Solutions

### 1. 500 Internal Server Errors
**Cause**: Missing environment variables or database connection issues

**Solution Steps**:
1. Verify all environment variables are set in Vercel dashboard:
   - `MONGODB_URI`: `mongodb+srv://techshock01:sih%28sih%29@cluster0.yocrbtv.mongodb.net/pmajay?retryWrites=true&w=majority&appName=Cluster0`
   - `NEXTAUTH_SECRET`: `yfq+vjwX3ZlI4dyPOXvtDTVpDfPRNYOMY/qqkFvG64c=`
   - `NEXTAUTH_URL`: `https://pmajay-management-system.vercel.app`
   - `ADMIN_EMAIL`: `admin@pmajay.gov.in`
   - `ADMIN_PASSWORD`: `Admin@2024`

2. Check Vercel Function logs for specific errors

### 2. Localhost Redirects
**Cause**: Environment variables not properly configured

**Fixed**: Updated NextAuth configuration and next.config.ts

### 3. Database Connection Issues
**Status**: Enhanced with better error handling and validation

## Testing Production Endpoints

### 1. Test Database Connection & Admin Creation
```
GET https://pmajay-management-system.vercel.app/api/seed/admin
```
Expected Response:
```json
{
  "success": true,
  "message": "Admin user created successfully" | "Admin user already exists",
  "data": {
    "email": "admin@pmajay.gov.in",
    "role": "Super Admin",
    "environment": "production"
  }
}
```

### 2. Test Authentication
```
POST https://pmajay-management-system.vercel.app/api/auth/signin
```

### 3. Test API Routes
```
GET https://pmajay-management-system.vercel.app/api/states
GET https://pmajay-management-system.vercel.app/api/agencies
GET https://pmajay-management-system.vercel.app/api/projects
```

## Environment Variable Checklist

### Required in Vercel Dashboard:
- [x] MONGODB_URI (with URL encoding)
- [x] NEXTAUTH_SECRET (secure random string)
- [x] NEXTAUTH_URL (production URL)
- [x] ADMIN_EMAIL (admin login email)
- [x] ADMIN_PASSWORD (admin login password)

### Verification Commands:
```bash
# Check if environment variables are accessible
curl https://pmajay-management-system.vercel.app/api/seed/admin
```

## Production URLs

### Main Application:
- **Production**: https://pmajay-management-system.vercel.app
- **Login**: https://pmajay-management-system.vercel.app/login
- **Dashboard**: https://pmajay-management-system.vercel.app/dashboard
- **Admin Panel**: https://pmajay-management-system.vercel.app/admin

### API Endpoints:
- **Admin Seeding**: https://pmajay-management-system.vercel.app/api/seed/admin
- **General Seeding**: https://pmajay-management-system.vercel.app/api/seed
- **Authentication**: https://pmajay-management-system.vercel.app/api/auth/signin

## Deployment Steps

### 1. Environment Variables Setup (Vercel Dashboard)
1. Go to https://vercel.com/dashboard
2. Select "pmajay-management-system" project
3. Go to Settings → Environment Variables
4. Add all required variables (see checklist above)

### 2. Deploy & Test
1. Trigger new deployment (automatic after git push)
2. Test admin seeding endpoint first
3. Test login functionality
4. Verify dashboard access

### 3. Initialize Database
1. Visit: https://pmajay-management-system.vercel.app/api/seed/admin
2. Confirm admin user creation
3. Login with: admin@pmajay.gov.in / Admin@2024

## Common Issues & Fixes

### Issue: "Cannot connect to database"
**Solution**: Check MongoDB Atlas whitelist (0.0.0.0/0 for Vercel)

### Issue: "NextAuth configuration error"
**Solution**: Verify NEXTAUTH_SECRET and NEXTAUTH_URL are set

### Issue: "Admin login fails"
**Solution**: Run admin seeding endpoint first

### Issue: "API routes return 500"
**Solution**: Check Vercel function logs for specific error details

## Success Criteria

✅ Main page loads without errors
✅ Admin seeding endpoint works
✅ Login functionality works
✅ Dashboard displays data
✅ API routes return proper responses
✅ No localhost redirects in production

## Next Steps After Fix

1. **Test all functionality** in production
2. **Seed additional data** using /api/seed endpoint
3. **Verify performance** and loading times
4. **Document demo credentials** for SIH presentation
5. **Prepare backup deployment** if needed