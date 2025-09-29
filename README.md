# PM-AJAY Management System

A comprehensive management system for PM-AJAY (Prime Minister's Ayushman Bharat Jana Arogya Yojana) built with Next.js 15, React 19, TypeScript, and MongoDB.

## Features

- **Admin Panel**: Complete CRUD operations for states, agencies, projects, and fund flows
- **Dark Theme**: Modern, luxury dark interface with glassmorphism effects
- **Real-time Dashboard**: Live data monitoring with component-wise statistics
- **State Management**: Indian states dropdown with manual entry option
- **Agency Management**: Dropdown selections for implementing, executing, nodal, and monitoring agencies
- **Project Tracking**: Project progress monitoring with agency relationships
- **Fund Flow Management**: Track fund allocation and disbursement
- **Authentication**: Secure login with NextAuth.js
- **Responsive Design**: Mobile-friendly responsive layout

## Tech Stack

- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript 5
- **Styling**: Tailwind CSS 4 with custom dark theme
- **Database**: MongoDB with Mongoose 8.18.2
- **Authentication**: NextAuth.js 4.24.11
- **UI Components**: Custom components with Heroicons
- **Development**: ESLint, Turbopack for fast builds

## Environment Variables

Create a `.env.local` file in the root directory:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pmajay?retryWrites=true&w=majority

# NextAuth
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-key-here

# Admin Credentials
ADMIN_EMAIL=admin@pmajay.gov.in
ADMIN_PASSWORD=your-secure-password

# Environment
NODE_ENV=development
```

## Getting Started

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up environment variables**
   - Copy `.env.example` to `.env.local`
   - Update with your actual credentials

3. **Run development server**
   ```bash
   npm run dev
   ```

4. **Access the application**
   - Main app: http://localhost:3000
   - Admin panel: http://localhost:3000/admin
   - Dashboard: http://localhost:3000/dashboard

## Deployment to Vercel

### Quick Deploy
1. Push to GitHub
2. Import to Vercel
3. Set environment variables
4. Deploy automatically

### Environment Variables for Production
```
MONGODB_URI=<mongodb-atlas-connection>
NEXTAUTH_URL=<your-vercel-domain>
NEXTAUTH_SECRET=<random-secret>
ADMIN_EMAIL=admin@pmajay.gov.in
ADMIN_PASSWORD=<secure-password>
NODE_ENV=production
```

### Post-deployment Setup
```bash
# Seed states data
curl https://your-app.vercel.app/api/states/seed

# Create admin user  
curl https://your-app.vercel.app/api/seed/admin
```

## Project Structure

```
app/
├── admin/                 # Admin panel pages
├── api/                   # API routes
├── components/            # React components
├── dashboard/             # Dashboard page
└── globals.css           # Global styles

lib/
├── models.ts             # MongoDB schemas
├── db.ts                 # Database connection
└── dataUtils.ts          # Data utilities
```

## Key Features

- **Real-time Dashboard**: Live data with auto-refresh
- **CRUD Operations**: Full management for all entities
- **Indian States Integration**: Complete states data with validation
- **Agency Relationships**: Proper linking between agencies and projects
- **Fund Flow Tracking**: Monitor allocation and disbursement
- **Dark Theme UI**: Professional admin interface

## Build Status

✅ Production build successful
✅ All routes optimized  
✅ TypeScript validation configured
✅ ESLint warnings resolved
✅ Vercel deployment ready

## API Endpoints

- `/api/states` - State management
- `/api/agencies` - Agency operations
- `/api/projects` - Project tracking
- `/api/funds` - Fund flow management
- `/api/admin/login` - Authentication

Built for Smart India Hackathon (SIH) 2024
