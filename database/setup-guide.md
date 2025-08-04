# Supabase Database Setup Guide

This guide will help you set up Supabase for the Challenge Management System.

## 🚀 **Step 1: Create Supabase Project**

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Enter project details:
   - **Name**: Challenge Management System
   - **Database Password**: (choose a strong password)
   - **Region**: (choose closest to your users)
5. Click "Create new project"
6. Wait for the project to initialize (2-3 minutes)

## 🔑 **Step 2: Get Your Credentials**

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following values:
   - **Project URL** (looks like: `https://xyz123.supabase.co`)
   - **Project API Keys** → **anon/public** key

## 📝 **Step 3: Set Environment Variables**

Create a `.env` file in your project root with:

```bash
# Supabase Configuration
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here

# Frontend Configuration  
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# API Configuration
VITE_API_URL=http://localhost:3000
```

## 🗄️ **Step 4: Run Database Schema**

1. In Supabase Dashboard, go to **SQL Editor**
2. Copy the contents of `database/supabase-schema.sql`
3. Paste into the SQL Editor
4. Click "Run" to create all tables, indexes, and policies

## 📊 **Step 5: Add Sample Data**

1. In SQL Editor, create a new query
2. Copy the contents of `database/sample-data.sql`  
3. Paste and run to populate with sample challenges and users

## 🔧 **Step 6: Verify Setup**

Run these queries in SQL Editor to verify:

```sql
-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check sample data
SELECT * FROM challenges;
SELECT * FROM users;
SELECT * FROM challenge_acceptances;
```

## 🔴 **Step 7: Update Your App**

1. Install dependencies: `npm install`
2. Start your dev server: `npm run dev`
3. Your app should now use Supabase instead of localStorage!

## 🔄 **Step 8: Migrate Existing Data (Optional)**

If you have existing localStorage data you want to preserve:

1. Open your browser's Developer Tools
2. Go to Application → Local Storage
3. Export data from keys:
   - `challengeHub_acceptances`
   - `challengeHub_submissions` 
   - `challengeHub_reviews`
4. Use the migration script (coming next) to import into Supabase

## 🎯 **Features You'll Get:**

✅ **Persistent Data** - No more data loss on browser refresh
✅ **Real-time Updates** - See changes instantly across devices
✅ **Proper Authentication** - Row-level security
✅ **Scalability** - Handles multiple users seamlessly
✅ **Backup & Recovery** - Your data is safe
✅ **Analytics** - Built-in database insights

## 🆘 **Troubleshooting**

### API Connection Issues:
- Verify your `SUPABASE_URL` and `SUPABASE_ANON_KEY` are correct
- Check that your project is not paused (Supabase pauses inactive projects)
- Ensure your environment variables are loaded (restart dev server)

### Database Errors:
- Check RLS (Row Level Security) policies are enabled
- Verify your user has the correct permissions
- Check Supabase logs in Dashboard → Logs

### Real-time Issues:
- Ensure real-time is enabled for your tables
- Check your subscription code for syntax errors
- Verify your API key has real-time permissions

## 📞 **Need Help?**

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com/)
- Check the console for error messages
- Review Supabase Dashboard logs
