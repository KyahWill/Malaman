# Database Setup Guide

## Prerequisites

Before setting up the database, ensure you have:

1. **Supabase Account**: Sign up at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Install the Supabase CLI
3. **Node.js**: Version 18 or higher
4. **Git**: For version control

## Installation

### 1. Install Supabase CLI

```bash
# Using npm
npm install -g supabase

# Using Homebrew (macOS)
brew install supabase/tap/supabase

# Using Scoop (Windows)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
```

### 2. Verify Installation

```bash
supabase --version
```

## Local Development Setup

### 1. Initialize Supabase Project

```bash
# In your project root directory
supabase init
```

This creates the `supabase/` directory with configuration files.

### 2. Start Local Development Environment

```bash
# Start all Supabase services locally
supabase start
```

This will:
- Start PostgreSQL database on port 54322
- Start Supabase Studio on port 54323
- Start API server on port 54321
- Start Auth server
- Start Storage server

### 3. Apply Database Migrations

```bash
# Apply all migrations to local database
supabase db reset
```

### 4. Verify Local Setup

Visit `http://localhost:54323` to access Supabase Studio and verify:
- All tables are created
- RLS policies are applied
- Custom types are defined

## Production Setup

### 1. Create Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose organization and enter project details:
   - **Name**: `personalized-lms`
   - **Database Password**: Generate a strong password
   - **Region**: Choose closest to your users

### 2. Configure Environment Variables

Create `.env` file in your project root:

```bash
# Copy from .env.example
cp .env.example .env
```

Update `.env` with your Supabase project details:

```bash
# Get these from your Supabase project settings
PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional: For AI features
OPENAI_API_KEY=your-openai-api-key
AI_MODEL=gpt-4

# Application settings
PUBLIC_APP_NAME="Personalized LMS"
PUBLIC_APP_VERSION="1.0.0"
NODE_ENV=production
```

### 3. Link Local Project to Remote

```bash
# Link to your Supabase project
supabase link --project-ref your-project-id
```

### 4. Deploy Database Schema

```bash
# Push local migrations to remote database
supabase db push
```

### 5. Verify Production Setup

1. Check Supabase Dashboard for:
   - All tables created
   - RLS policies enabled
   - Indexes created
2. Test authentication flow
3. Verify API endpoints

## Migration Management

### Creating New Migrations

```bash
# Create a new migration file
supabase migration new migration_name

# Example: Add new column
supabase migration new add_user_preferences_column
```

### Migration File Structure

```sql
-- Migration: 20240101000003_add_user_preferences_column.sql
-- Description: Add preferences column to profiles table

-- Forward migration
ALTER TABLE profiles ADD COLUMN preferences JSONB DEFAULT '{}';

-- Create index for performance
CREATE INDEX idx_profiles_preferences ON profiles USING GIN (preferences);

-- Update RLS policies if needed
-- (Add any policy changes here)

-- Rollback instructions (in comments)
-- To rollback this migration:
-- DROP INDEX IF EXISTS idx_profiles_preferences;
-- ALTER TABLE profiles DROP COLUMN IF EXISTS preferences;
```

### Applying Migrations

```bash
# Apply to local database
supabase db reset

# Apply to production
supabase db push
```

### Rolling Back Migrations

```bash
# Reset to specific migration
supabase db reset --db-url "your-database-url" --target-migration 20240101000001
```

## Storage Configuration

### 1. Create Storage Buckets

```sql
-- Create media storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
  ('media', 'media', true),
  ('profiles', 'profiles', true),
  ('temp', 'temp', false);
```

### 2. Set Storage Policies

```sql
-- Allow authenticated users to upload to media bucket
CREATE POLICY "Authenticated users can upload media" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'media' AND 
    auth.role() = 'authenticated'
  );

-- Allow users to view public media
CREATE POLICY "Anyone can view media" ON storage.objects
  FOR SELECT USING (bucket_id = 'media');

-- Allow users to manage their own profile images
CREATE POLICY "Users can manage own profile images" ON storage.objects
  FOR ALL USING (
    bucket_id = 'profiles' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );
```

## Testing Database Setup

### 1. Unit Tests for Database Functions

Create `tests/database.test.ts`:

```typescript
import { supabase } from '../src/lib/supabase';
import { describe, it, expect, beforeEach } from 'vitest';

describe('Database Schema', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  });

  it('should create user profile on signup', async () => {
    // Test profile creation trigger
    const { data, error } = await supabase.auth.signUp({
      email: 'test@example.com',
      password: 'testpassword123'
    });

    expect(error).toBeNull();
    expect(data.user).toBeDefined();

    // Verify profile was created
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', data.user!.id)
      .single();

    expect(profile).toBeDefined();
    expect(profile.email).toBe('test@example.com');
    expect(profile.role).toBe('student');
  });

  it('should enforce RLS policies', async () => {
    // Test that users can only access their own data
    const { data: courses } = await supabase
      .from('courses')
      .select('*');

    // Should only return published courses or user's own courses
    expect(courses).toBeDefined();
  });
});
```

### 2. Integration Tests

```typescript
describe('Database Integration', () => {
  it('should handle course enrollment workflow', async () => {
    // Create instructor
    const instructor = await createTestUser('instructor');
    
    // Create course
    const { data: course } = await supabase
      .from('courses')
      .insert({
        title: 'Test Course',
        instructor_id: instructor.id,
        is_published: true
      })
      .select()
      .single();

    // Create student
    const student = await createTestUser('student');
    
    // Enroll student
    const { data: enrollment } = await supabase
      .from('enrollments')
      .insert({
        student_id: student.id,
        course_id: course.id
      })
      .select()
      .single();

    expect(enrollment).toBeDefined();
    expect(enrollment.student_id).toBe(student.id);
    expect(enrollment.course_id).toBe(course.id);
  });
});
```

### 3. Performance Tests

```typescript
describe('Database Performance', () => {
  it('should handle concurrent user access', async () => {
    const startTime = Date.now();
    
    // Simulate 100 concurrent users
    const promises = Array.from({ length: 100 }, async (_, i) => {
      return supabase
        .from('courses')
        .select('*')
        .eq('is_published', true)
        .limit(10);
    });

    const results = await Promise.all(promises);
    const endTime = Date.now();
    
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
    expect(results.every(r => r.data)).toBe(true);
  });
});
```

## Monitoring and Maintenance

### 1. Database Health Checks

```sql
-- Check table sizes
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- Check index usage
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes
ORDER BY idx_scan DESC;

-- Check slow queries
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;
```

### 2. Automated Maintenance

Create `scripts/db-maintenance.sql`:

```sql
-- Vacuum and analyze all tables
VACUUM ANALYZE;

-- Update table statistics
ANALYZE;

-- Reindex if needed (run during maintenance window)
-- REINDEX DATABASE your_database_name;
```

### 3. Monitoring Queries

```sql
-- Active connections
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE state = 'active';

-- Long running queries
SELECT 
  pid,
  now() - pg_stat_activity.query_start AS duration,
  query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';

-- Database size
SELECT pg_size_pretty(pg_database_size(current_database()));
```

## Troubleshooting

### Common Issues

#### 1. Migration Failures

```bash
# Check migration status
supabase migration list

# Fix failed migration
supabase db reset --target-migration previous_working_migration
# Fix the problematic migration file
supabase db push
```

#### 2. RLS Policy Issues

```sql
-- Temporarily disable RLS for debugging (NEVER in production)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Check policy definitions
SELECT * FROM pg_policies WHERE tablename = 'your_table';

-- Test policy with specific user
SET ROLE your_user_role;
SELECT * FROM your_table;
RESET ROLE;
```

#### 3. Performance Issues

```sql
-- Check for missing indexes
SELECT 
  schemaname,
  tablename,
  seq_scan,
  seq_tup_read,
  idx_scan,
  idx_tup_fetch
FROM pg_stat_user_tables
WHERE seq_scan > idx_scan
ORDER BY seq_tup_read DESC;

-- Add missing indexes
CREATE INDEX CONCURRENTLY idx_table_column ON table_name(column_name);
```

#### 4. Connection Issues

```bash
# Check connection limits
SELECT * FROM pg_stat_activity;

# Increase connection limit (if needed)
ALTER SYSTEM SET max_connections = 200;
SELECT pg_reload_conf();
```

### Getting Help

1. **Supabase Documentation**: [supabase.com/docs](https://supabase.com/docs)
2. **Community Discord**: [discord.supabase.com](https://discord.supabase.com)
3. **GitHub Issues**: [github.com/supabase/supabase](https://github.com/supabase/supabase)
4. **Stack Overflow**: Tag questions with `supabase`

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Appropriate policies for each user role
- [ ] Sensitive data encrypted
- [ ] Regular security audits scheduled
- [ ] Backup and recovery procedures tested
- [ ] Environment variables secured
- [ ] API keys rotated regularly
- [ ] Database access logs monitored

## Next Steps

After completing the database setup:

1. **Test the Schema**: Run the test suite to verify everything works
2. **Set up CI/CD**: Automate migration deployment
3. **Configure Monitoring**: Set up alerts for database health
4. **Document Procedures**: Keep this guide updated with any changes
5. **Train Team**: Ensure all developers understand the schema and procedures

This setup provides a robust, scalable database foundation for the Personalized LMS with proper security, performance, and maintainability considerations.