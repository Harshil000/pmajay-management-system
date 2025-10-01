# PM-JAY Management System# PM-AJAY Management System



A comprehensive management system for PM-JAY (Pradhan Mantri Jana Arogya Yojana) scheme coordination across Central, State, and Local agencies.A comprehensive, research-driven management system for PM-AJAY (Prime Minister's Ayushman Bharat Jana Arogya Yojana) built with Next.js 15, React 19, TypeScript, and MongoDB.



## Features## Research Foundation



### 🏥 Agency ManagementThis system is developed based on extensive research and analysis of:

- Multi-level agency hierarchy (Central, State, Local)- **National Health Authority (NHA) Annual Reports** - Identifying coordination gaps

- Real-time coordination between agencies- **NITI Aayog Digital Governance Framework** - Best practices implementation

- Automated workflow management- **CAG Audit Reports** - Addressing transparency issues

- **Academic Research** - Evidence-based solution design

### 💬 Communication System

- Advanced message threading and categorization> *See [RESEARCH_FOUNDATION.md](./RESEARCH_FOUNDATION.md) for detailed research analysis*

- Priority-based message handling (Critical, High, Medium, Low)

- Real-time read receipts and status tracking## Problem Statement (Research-Validated)

- Resolved message isolation system

- Visual differentiation for message typesCurrent PM-JAY implementation faces:

- **40% delays** due to poor inter-agency coordination (NHA Report 2024)

### 💰 Fund Management- **Manual fund tracking** causing 2-3 week disbursement delays

- Fund allocation and disbursement tracking- **Communication gaps** between implementing and executing agencies

- Budget monitoring and approval workflows- **Lack of real-time monitoring** across project components

- Multi-tier fund request processing

## Features (Research-Driven Solutions)

### 📊 Project Management

- Comprehensive project lifecycle management- **Multi-Agency Coordination Panel**: Addresses NITI Aayog's coordination framework recommendations

- Progress tracking and milestone monitoring- **Real-Time Fund Flow Tracking**: Solves CAG-identified transparency issues  

- Inter-agency project coordination- **Component-Based Project Management**: Aligned with PM-JAY's Adarsh Gram, GIA, Hostel structure

- **Digital Communication Center**: Eliminates inter-agency communication bottlenecks

### 🔄 Workflow Engine- **Live Monitoring Dashboard**: Implements government real-time monitoring standards

- Automated approval workflows- **Role-Based Access Control**: Follows Digital India security guidelines

- Dynamic task assignment- **State-wise Implementation Tracking**: Based on NHA operational structure

- Progress tracking and escalation- **Responsive Design**: Mobile-friendly interface for field officers



### 📈 Dashboard & Analytics## Tech Stack

- Real-time system metrics

- Performance monitoring- **Frontend**: Next.js 15.5.4, React 19.1.0, TypeScript 5

- Compliance tracking- **Styling**: Tailwind CSS 4 with custom dark theme

- **Database**: MongoDB with Mongoose 8.18.2

## Tech Stack- **Authentication**: NextAuth.js 4.24.11

- **UI Components**: Custom components with Heroicons

- **Frontend**: Next.js 15.5.4 with TypeScript- **Development**: ESLint, Turbopack for fast builds

- **Backend**: Next.js API Routes

- **Database**: MongoDB Atlas## Environment Variables

- **Authentication**: NextAuth.js

- **Styling**: Tailwind CSSCreate a `.env.local` file in the root directory:

- **UI Components**: Heroicons

```env

## Getting Started# Database

MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/pmajay?retryWrites=true&w=majority

### Prerequisites

- Node.js 18+ # NextAuth

- MongoDB Atlas accountNEXTAUTH_URL=http://localhost:3000

- Environment variables setupNEXTAUTH_SECRET=your-secret-key-here



### Installation# Admin Credentials

ADMIN_EMAIL=admin@pmajay.gov.in

1. Clone the repository:ADMIN_PASSWORD=your-secure-password

```bash

git clone https://github.com/Harshil000/pmajay-management-system.git# Environment

cd pmajay-management-systemNODE_ENV=development

``````



2. Install dependencies:## Getting Started

```bash

npm install1. **Install dependencies**

```   ```bash

   npm install

3. Set up environment variables:   ```

Create `.env.local` with:

```env2. **Set up environment variables**

MONGODB_URI=your_mongodb_connection_string   - Copy `.env.example` to `.env.local`

NEXTAUTH_SECRET=your_nextauth_secret   - Update with your actual credentials

NEXTAUTH_URL=http://localhost:3000

```3. **Run development server**

   ```bash

4. Run the development server:   npm run dev

```bash   ```

npm run dev

```4. **Access the application**

   - Main app: http://localhost:3000

5. Open [http://localhost:3000](http://localhost:3000) in your browser.   - Admin panel: http://localhost:3000/admin

   - Dashboard: http://localhost:3000/dashboard

## Production Deployment

## Deployment to Vercel

The application is optimized for deployment on Vercel:

### Quick Deploy

```bash1. Push to GitHub

npm run build2. Import to Vercel

```3. Set environment variables

4. Deploy automatically

## API Documentation

### Environment Variables for Production

### Core Endpoints```

MONGODB_URI=<mongodb-atlas-connection>

- `/api/agencies` - Agency managementNEXTAUTH_URL=<your-vercel-domain>

- `/api/communications` - Message systemNEXTAUTH_SECRET=<random-secret>

- `/api/funds` - Fund managementADMIN_EMAIL=admin@pmajay.gov.in

- `/api/projects` - Project operationsADMIN_PASSWORD=<secure-password>

- `/api/workflow` - Workflow engineNODE_ENV=production

- `/api/coordination` - Inter-agency coordination```



## Project Structure### Post-deployment Setup

```bash

```# Seed states data

├── app/                    # Next.js app directorycurl https://your-app.vercel.app/api/states/seed

│   ├── components/         # React components

│   ├── api/               # API routes# Create admin user  

│   └── [pages]/           # Application pagescurl https://your-app.vercel.app/api/seed/admin

├── lib/                   # Utility functions and configurations```

├── types/                 # TypeScript type definitions

└── public/                # Static assets## Project Structure

```

```

## Contributingapp/

├── admin/                 # Admin panel pages

1. Fork the repository├── api/                   # API routes

2. Create a feature branch├── components/            # React components

3. Make your changes├── dashboard/             # Dashboard page

4. Test thoroughly└── globals.css           # Global styles

5. Submit a pull request

lib/

## License├── models.ts             # MongoDB schemas

├── db.ts                 # Database connection

This project is licensed under the MIT License.└── dataUtils.ts          # Data utilities

```

## Support

## Key Features

For support and questions, please open an issue in the GitHub repository.
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
