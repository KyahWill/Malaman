# Deployment Guide

This comprehensive guide covers deploying the Personalized LMS to production environments, including setup, configuration, monitoring, and maintenance procedures.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Database Configuration](#database-configuration)
4. [Application Deployment](#application-deployment)
5. [CI/CD Pipeline](#cicd-pipeline)
6. [Monitoring and Logging](#monitoring-and-logging)
7. [Backup and Recovery](#backup-and-recovery)
8. [Security Configuration](#security-configuration)
9. [Performance Optimization](#performance-optimization)
10. [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

**Minimum Production Requirements:**
- CPU: 2 vCPUs
- RAM: 4GB
- Storage: 50GB SSD
- Network: 1Gbps

**Recommended Production Requirements:**
- CPU: 4 vCPUs
- RAM: 8GB
- Storage: 100GB SSD
- Network: 1Gbps

### Required Software

- Node.js 20.x or later
- Docker and Docker Compose
- Nginx (for reverse proxy)
- SSL certificates
- Git

### External Services

- **Supabase**: Database and authentication
- **OpenAI**: AI/LLM services (optional)
- **Vercel/Netlify**: Application hosting (alternative to self-hosting)
- **CloudFlare**: CDN and DDoS protection (recommended)

## Environment Setup

### 1. Production Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Application
NODE_ENV=production
PUBLIC_SUPABASE_URL=https://your-project.supabase.co
PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# AI Services (Optional)
OPENAI_API_KEY=your-openai-key
AI_MODEL=gpt-4

# Monitoring
GRAFANA_PASSWORD=secure-password
WEBHOOK_URL=https://hooks.slack.com/your-webhook

# Backup
CLOUD_STORAGE_BUCKET=your-backup-bucket
RETENTION_DAYS=30

# Security
ENCRYPTION_KEY=your-32-character-encryption-key
```

### 2. Supabase Production Setup

#### Create Production Project

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Create a new project for production
3. Note down the project URL and anon key
4. Configure custom domain (optional)

#### Database Configuration

```sql
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Configure connection pooling
ALTER SYSTEM SET max_connections = 200;
ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
SELECT pg_reload_conf();
```

#### Row Level Security Policies

Ensure all RLS policies are properly configured:

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
-- ... (continue for all tables)

-- Verify policies are in place
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'public';
```

### 3. Storage Configuration

#### Supabase Storage Buckets

```sql
-- Create storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES 
('media', 'media', true),
('private', 'private', false);

-- Set up storage policies
CREATE POLICY "Public media access" ON storage.objects 
FOR SELECT USING (bucket_id = 'media');

CREATE POLICY "Authenticated upload" ON storage.objects 
FOR INSERT WITH CHECK (
  bucket_id = 'media' AND 
  auth.role() = 'authenticated'
);
```

## Database Configuration

### 1. Migration Deployment

Deploy all migrations to production:

```bash
# Link to production project
supabase link --project-ref your-production-project-id

# Deploy migrations
supabase db push

# Verify migration status
supabase migration list
```

### 2. Performance Optimization

#### Indexes

```sql
-- Create performance indexes
CREATE INDEX CONCURRENTLY idx_student_progress_student_course 
ON student_progress(student_id, course_id);

CREATE INDEX CONCURRENTLY idx_assessment_attempts_student_assessment 
ON assessment_attempts(student_id, assessment_id);

CREATE INDEX CONCURRENTLY idx_content_blocks_lesson_order 
ON content_blocks(lesson_id, order_index);

-- Analyze tables
ANALYZE;
```

#### Connection Pooling

Configure PgBouncer for connection pooling:

```ini
[databases]
lms_production = host=db.your-project.supabase.co port=5432 dbname=postgres

[pgbouncer]
pool_mode = transaction
max_client_conn = 100
default_pool_size = 25
```

## Application Deployment

### 1. Docker Deployment

#### Build and Deploy

```bash
# Build production image
docker build -f Dockerfile.prod -t lms-app:latest .

# Deploy with Docker Compose
docker-compose -f docker-compose.prod.yml up -d

# Verify deployment
docker-compose -f docker-compose.prod.yml ps
```

#### Health Checks

```bash
# Check application health
curl -f http://localhost:3000/api/health

# Check all services
docker-compose -f docker-compose.prod.yml exec app curl -f http://localhost:3000/api/health
```

### 2. Vercel Deployment

#### Configuration

Create `vercel.json`:

```json
{
  "version": 2,
  "builds": [
    {
      "src": "package.json",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "/api/$1"
    },
    {
      "src": "/(.*)",
      "dest": "/$1"
    }
  ],
  "env": {
    "PUBLIC_SUPABASE_URL": "@supabase_url",
    "PUBLIC_SUPABASE_ANON_KEY": "@supabase_anon_key",
    "OPENAI_API_KEY": "@openai_api_key"
  }
}
```

#### Deploy

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy to production
vercel --prod

# Set environment variables
vercel env add PUBLIC_SUPABASE_URL production
vercel env add PUBLIC_SUPABASE_ANON_KEY production
vercel env add OPENAI_API_KEY production
```

### 3. Custom Server Deployment

#### Nginx Configuration

Use the provided `nginx.conf` with SSL certificates:

```bash
# Install SSL certificates
sudo certbot --nginx -d yourdomain.com

# Test Nginx configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

#### Process Management

Use PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Create ecosystem file
cat > ecosystem.config.js << EOF
module.exports = {
  apps: [{
    name: 'lms-app',
    script: 'build/index.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
EOF

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save
pm2 startup
```

## CI/CD Pipeline

### 1. GitHub Actions Setup

The provided workflows handle:
- Automated testing
- Database migrations
- Application deployment
- Health checks

#### Required Secrets

Configure these secrets in your GitHub repository:

```
SUPABASE_ACCESS_TOKEN
SUPABASE_PROJECT_ID
PROD_SUPABASE_URL
PROD_SUPABASE_ANON_KEY
VERCEL_TOKEN
VERCEL_ORG_ID
VERCEL_PROJECT_ID
PROD_APP_URL
```

### 2. Deployment Process

1. **Development**: Push to `develop` branch triggers staging deployment
2. **Production**: Push to `main` branch triggers production deployment
3. **Testing**: All deployments run full test suite
4. **Health Checks**: Post-deployment verification

### 3. Rollback Procedures

#### Automatic Rollback

```bash
# Rollback to previous version
vercel rollback

# Or with Docker
docker-compose -f docker-compose.prod.yml down
docker-compose -f docker-compose.prod.yml up -d --scale app=0
docker-compose -f docker-compose.prod.yml up -d
```

#### Manual Rollback

```bash
# Identify previous deployment
git log --oneline -10

# Create rollback branch
git checkout -b rollback-to-commit-hash commit-hash

# Deploy rollback
git push origin rollback-to-commit-hash
```

## Monitoring and Logging

### 1. Prometheus and Grafana Setup

#### Start Monitoring Stack

```bash
# Start monitoring services
docker-compose -f docker-compose.prod.yml up -d monitoring grafana

# Access Grafana
open http://localhost:3001
```

#### Key Metrics to Monitor

- **Application Health**: Uptime, response times, error rates
- **Database Performance**: Query times, connection counts
- **System Resources**: CPU, memory, disk usage
- **User Activity**: Registrations, logins, assessments
- **Security**: Failed login attempts, suspicious activity

### 2. Log Management

#### Centralized Logging

```bash
# View application logs
docker-compose -f docker-compose.prod.yml logs -f app

# View all service logs
docker-compose -f docker-compose.prod.yml logs -f
```

#### Log Rotation

```bash
# Configure log rotation
sudo tee /etc/logrotate.d/lms-app << EOF
/var/log/lms-app/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    postrotate
        docker-compose -f /path/to/docker-compose.prod.yml restart app
    endscript
}
EOF
```

### 3. Alerting

#### Slack Integration

Configure webhook URL in environment variables:

```bash
WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

#### Email Alerts

Configure SMTP settings for email notifications:

```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
ALERT_EMAIL=admin@yourdomain.com
```

## Backup and Recovery

### 1. Automated Backups

#### Schedule Daily Backups

```bash
# Add to crontab
crontab -e

# Add this line for daily backups at 2 AM
0 2 * * * /path/to/scripts/backup-database.sh >> /var/log/backup.log 2>&1
```

#### Backup Configuration

```bash
# Set environment variables for backup script
export SUPABASE_PROJECT_ID=your-project-id
export SUPABASE_ACCESS_TOKEN=your-access-token
export BACKUP_DIR=/backups
export RETENTION_DAYS=30
export CLOUD_STORAGE_BUCKET=your-backup-bucket
```

### 2. Disaster Recovery

#### Recovery Time Objectives (RTO)

- **Database**: 15 minutes
- **Application**: 5 minutes
- **Full System**: 30 minutes

#### Recovery Point Objectives (RPO)

- **Database**: 1 hour (hourly backups)
- **Files**: 24 hours (daily backups)

#### Recovery Procedures

1. **Database Recovery**:
   ```bash
   # List available backups
   ./scripts/restore-database.sh --list
   
   # Restore from backup
   ./scripts/restore-database.sh lms_backup_20240101_120000
   ```

2. **Application Recovery**:
   ```bash
   # Redeploy application
   docker-compose -f docker-compose.prod.yml up -d --force-recreate
   ```

3. **Full System Recovery**:
   ```bash
   # Restore database
   ./scripts/restore-database.sh latest
   
   # Redeploy application
   docker-compose -f docker-compose.prod.yml up -d --force-recreate
   
   # Verify health
   curl -f http://localhost:3000/api/health
   ```

## Security Configuration

### 1. SSL/TLS Setup

#### Certificate Installation

```bash
# Install Let's Encrypt certificates
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Verify certificate
sudo certbot certificates

# Test auto-renewal
sudo certbot renew --dry-run
```

#### Security Headers

The provided Nginx configuration includes:
- HSTS (HTTP Strict Transport Security)
- CSP (Content Security Policy)
- X-Frame-Options
- X-Content-Type-Options

### 2. Firewall Configuration

```bash
# Configure UFW firewall
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. Rate Limiting

Nginx configuration includes rate limiting:
- API endpoints: 10 requests/second
- Login endpoints: 5 requests/minute

### 4. Security Monitoring

Monitor for:
- Failed login attempts
- Unusual traffic patterns
- Security incidents
- Unauthorized access attempts

## Performance Optimization

### 1. Database Optimization

#### Query Optimization

```sql
-- Monitor slow queries
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements
ORDER BY mean_time DESC
LIMIT 10;

-- Optimize frequently used queries
EXPLAIN ANALYZE SELECT * FROM courses WHERE instructor_id = $1;
```

#### Connection Pooling

Configure connection pooling for better performance:

```javascript
// In your database service
const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 2. Application Optimization

#### Caching Strategy

```javascript
// Implement Redis caching
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// Cache frequently accessed data
async function getCachedCourses(instructorId) {
  const cacheKey = `courses:instructor:${instructorId}`;
  const cached = await redis.get(cacheKey);
  
  if (cached) {
    return JSON.parse(cached);
  }
  
  const courses = await fetchCoursesFromDB(instructorId);
  await redis.setex(cacheKey, 300, JSON.stringify(courses)); // 5 min cache
  
  return courses;
}
```

#### CDN Configuration

Configure CloudFlare or similar CDN:
- Cache static assets for 1 year
- Cache API responses for 5 minutes
- Enable Brotli compression
- Enable HTTP/2

### 3. Monitoring Performance

Key performance metrics:
- Page load times < 2 seconds
- API response times < 500ms
- Database query times < 100ms
- 99.9% uptime

## Troubleshooting

### 1. Common Issues

#### Application Won't Start

```bash
# Check logs
docker-compose -f docker-compose.prod.yml logs app

# Check environment variables
docker-compose -f docker-compose.prod.yml exec app env

# Check health endpoint
curl -v http://localhost:3000/api/health
```

#### Database Connection Issues

```bash
# Test database connectivity
psql $DATABASE_URL -c "SELECT 1;"

# Check connection pool
SELECT * FROM pg_stat_activity WHERE datname = 'postgres';

# Check for long-running queries
SELECT pid, now() - pg_stat_activity.query_start AS duration, query 
FROM pg_stat_activity 
WHERE (now() - pg_stat_activity.query_start) > interval '5 minutes';
```

#### High Memory Usage

```bash
# Check memory usage
docker stats

# Check for memory leaks
docker-compose -f docker-compose.prod.yml exec app node --inspect=0.0.0.0:9229 build/index.js
```

### 2. Performance Issues

#### Slow Database Queries

```sql
-- Enable query logging
ALTER SYSTEM SET log_min_duration_statement = 1000; -- Log queries > 1s
SELECT pg_reload_conf();

-- Analyze slow queries
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

#### High CPU Usage

```bash
# Check CPU usage
top -p $(pgrep -f "node.*build")

# Profile application
docker-compose -f docker-compose.prod.yml exec app node --prof build/index.js
```

### 3. Emergency Procedures

#### Service Outage

1. Check health endpoints
2. Review recent deployments
3. Check system resources
4. Review error logs
5. Implement rollback if necessary
6. Notify stakeholders

#### Data Corruption

1. Stop application immediately
2. Assess extent of corruption
3. Restore from latest backup
4. Verify data integrity
5. Resume service
6. Conduct post-incident review

#### Security Incident

1. Isolate affected systems
2. Preserve evidence
3. Assess impact
4. Implement containment
5. Notify relevant parties
6. Conduct forensic analysis
7. Implement remediation

## Maintenance Procedures

### 1. Regular Maintenance

#### Weekly Tasks

- Review system logs
- Check backup integrity
- Monitor performance metrics
- Update security patches

#### Monthly Tasks

- Review and rotate logs
- Update dependencies
- Performance optimization review
- Security audit

#### Quarterly Tasks

- Disaster recovery testing
- Capacity planning review
- Security penetration testing
- Documentation updates

### 2. Update Procedures

#### Application Updates

```bash
# Test in staging first
git checkout develop
git pull origin main
npm run test

# Deploy to production
git checkout main
git merge develop
git push origin main
```

#### Database Updates

```bash
# Create migration
supabase migration new update_description

# Test migration
supabase db reset
supabase db push

# Deploy to production
supabase db push --linked
```

### 3. Scaling Procedures

#### Horizontal Scaling

```bash
# Scale application containers
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Configure load balancer
# Update Nginx upstream configuration
```

#### Vertical Scaling

```bash
# Update resource limits
# Modify docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G
```

This deployment guide provides comprehensive coverage of all aspects needed for a successful production deployment of the Personalized LMS. Regular review and updates of these procedures ensure optimal system performance and reliability.