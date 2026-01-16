# Marketing Agency Platform - Demo

A functional demo of a subscription-based marketing agency platform built with Next.js, TypeScript, Supabase, and shadcn/ui.
Besat

## Features

- **Authentication**: Email/password authentication with Supabase Auth
- **Role-Based Access**: Separate dashboards for clients and admins
- **Project Management**: Clients can create and manage projects
- **Task Management**: Clients can create tasks, admins can assign and update task status
- **Clean UI**: Modern SaaS interface using shadcn/ui components

## Tech Stack

- **Framework**: Next.js 16+ with App Router
- **Language**: TypeScript
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **UI**: shadcn/ui + Tailwind CSS
- **Forms**: React Hook Form + Zod validation
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ installed
- A Supabase account and project

## Setup Instructions

### 1. Clone and Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Go to SQL Editor in your Supabase dashboard
3. Run the migration file: `supabase/migrations/001_initial_schema.sql`
   - This creates the `profiles`, `projects`, and `tasks` tables
   - Sets up Row Level Security (RLS) policies
   - Creates a trigger to auto-create profiles on user signup

### 3. Configure Environment Variables

1. Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

   You can find these in your Supabase project settings under API.

### 4. Create an Admin User

By default, new users are created with the `client` role. To create an admin:

1. Sign up a new user through the app
2. Go to Supabase Dashboard → Table Editor → `profiles`
3. Find the user you just created
4. Change their `role` from `client` to `admin`

### 5. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
SBMap/
├── app/
│   ├── (auth)/
│   │   ├── login/          # Login page
│   │   └── signup/          # Signup page
│   ├── (dashboard)/
│   │   └── dashboard/
│   │       ├── client/     # Client dashboard and pages
│   │       └── admin/       # Admin dashboard and pages
│   └── layout.tsx
├── components/
│   ├── ui/                  # shadcn/ui components
│   ├── dashboard/           # Dashboard components
│   ├── tasks/               # Task-related components
│   └── projects/            # Project-related components
├── lib/
│   ├── supabase/            # Supabase client utilities
│   ├── auth.ts              # Auth helper functions
│   └── validations.ts       # Zod schemas
├── types/
│   └── database.ts          # TypeScript types for database
└── supabase/
    └── migrations/          # SQL migration files
```

## User Roles

### Client
- View dashboard with task statistics
- Create and view projects
- Create and view tasks
- View own tasks and projects only

### Admin
- View dashboard with all system statistics
- View all projects from all clients
- View all tasks
- Assign tasks to designers
- Update task status

## Database Schema

### profiles
- `id` (UUID, references auth.users)
- `role` ('client' | 'admin')
- `full_name` (text)
- `is_active` (boolean)

### projects
- `id` (UUID)
- `client_id` (UUID, references profiles)
- `name` (text)
- `description` (text)
- `status` (text)
- `created_at` (timestamp)

### tasks
- `id` (UUID)
- `project_id` (UUID, references projects)
- `client_id` (UUID, references profiles)
- `title` (text)
- `content_type` (text)
- `platform` (text)
- `duration_seconds` (integer, nullable)
- `dimensions` (text, nullable)
- `brief` (text)
- `status` ('new' | 'accepted' | 'in_progress' | 'completed')
- `assigned_to` (UUID, nullable, references profiles)
- `created_at` (timestamp)

## Security

Row Level Security (RLS) is enabled on all tables:
- Clients can only access their own projects and tasks
- Admins can access all data
- Policies are enforced at the database level

## Demo Notes

- Designer role is not fully implemented (tasks can be assigned to mock designer IDs)
- Payments and subscriptions are out of scope for this demo
- File uploads/revisions are not included
- Notifications are not implemented

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint code
npm run lint
```

## Deployment to Vercel

This project is ready for deployment on Vercel. Follow these steps:

### 1. Push to GitHub

Make sure your code is pushed to GitHub (already done if you're reading this).

### 2. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) and sign in with your GitHub account
2. Click "Add New Project"
3. Import your GitHub repository: `fazla-cloud/thunder-agency-platform`
4. Vercel will automatically detect it's a Next.js project

### 3. Configure Environment Variables

In the Vercel project settings, add these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

You can find these values in your Supabase project:
- Go to Project Settings → API
- Copy the "Project URL" and "anon public" key

### 4. Deploy

Click "Deploy" and Vercel will:
- Install dependencies
- Build your Next.js application
- Deploy it to a production URL

### 5. Post-Deployment Setup

After deployment:
1. Make sure your Supabase database has the schema applied (run `supabase/migrations/001_initial_schema.sql`)
2. Create an admin user by signing up through the deployed app, then updating the role in Supabase Dashboard

### Vercel Configuration

The project uses Next.js 16+ with App Router, which Vercel supports out of the box. No additional configuration files are needed.

**Note:** Make sure your Supabase project allows connections from your Vercel domain. Check Supabase Dashboard → Settings → API → CORS settings if you encounter CORS issues.

## License

This is a demo project for demonstration purposes.
