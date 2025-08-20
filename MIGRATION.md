# Migration Guide

This document provides guidance for migrating between versions of the Personalized LMS and maintaining backward compatibility.

## Table of Contents

- [Migration Overview](#migration-overview)
- [Version Compatibility](#version-compatibility)
- [Database Migrations](#database-migrations)
- [Configuration Migrations](#configuration-migrations)
- [Data Export and Import](#data-export-and-import)
- [Breaking Changes](#breaking-changes)
- [Migration Tools](#migration-tools)
- [Troubleshooting](#troubleshooting)

## Migration Overview

### Migration Philosophy

The Personalized LMS follows semantic versioning (SemVer) and maintains backward compatibility within major versions:

- **Patch versions (x.y.Z)**: Bug fixes, no breaking changes
- **Minor versions (x.Y.z)**: New features, backward compatible
- **Major versions (X.y.z)**: Breaking changes, migration required

### Migration Types

#### Automatic Migrations
- Database schema updates
- Configuration format updates
- Dependency updates

#### Manual Migrations
- Custom configuration changes
- Data format changes
- API integration updates

#### Optional Migrations
- Performance optimizations
- New feature adoption
- UI/UX improvements

## Version Compatibility

### Current Version Support

| Version | Status | Support Level | End of Life |
|---------|--------|---------------|-------------|
| 1.x.x   | Current | Full support | TBD |
| 0.9.x   | Previous | Security fixes only | 6 months after 1.0 |
| 0.8.x   | Legacy | Critical fixes only | 3 months after 1.0 |
| < 0.8   | Unsupported | None | Immediate |

### Compatibility Matrix

#### Database Compatibility
- **PostgreSQL**: 12+ (recommended 14+)
- **Supabase**: Latest stable version
- **Migration Scripts**: Backward compatible within major versions

#### Browser Compatibility
- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS Safari 14+, Chrome Mobile 90+
- **Accessibility**: Screen readers and assistive technology

#### API Compatibility
- **REST API**: Versioned endpoints maintain compatibility
- **GraphQL**: Schema evolution with deprecation notices
- **Webhooks**: Payload format maintained within major versions

## Database Migrations

### Migration Process

#### Automatic Database Migrations

1. **Backup Database**
   ```bash
   npm run db:backup
   ```

2. **Run Migrations**
   ```bash
   npm run db:migrate
   ```

3. **Verify Migration**
   ```bash
   npm run db:status
   ```

#### Manual Migration Steps

For complex migrations requiring manual intervention:

1. **Pre-migration Checks**
   ```bash
   npm run migration:check
   ```

2. **Create Backup**
   ```bash
   npm run db:backup --name="pre-migration-$(date +%Y%m%d)"
   ```

3. **Run Migration with Confirmation**
   ```bash
   npm run db:migrate --confirm
   ```

4. **Post-migration Validation**
   ```bash
   npm run migration:validate
   ```

### Migration Scripts

#### Example Migration Script Structure

```sql
-- Migration: 20241201000001_add_new_feature.sql
-- Description: Add support for new personalization features
-- Breaking: false
-- Manual: false

BEGIN;

-- Add new columns
ALTER TABLE student_progress 
ADD COLUMN personalization_data JSONB DEFAULT '{}';

-- Create new tables
CREATE TABLE learning_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) NOT NULL,
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update existing data (if needed)
UPDATE student_progress 
SET personalization_data = '{}'
WHERE personalization_data IS NULL;

-- Create indexes
CREATE INDEX idx_learning_preferences_user_id 
ON learning_preferences(user_id);

-- Update RLS policies
CREATE POLICY "Users can manage own learning preferences" 
ON learning_preferences
FOR ALL USING (auth.uid() = user_id);

COMMIT;
```

#### Rollback Scripts

```sql
-- Rollback: 20241201000001_add_new_feature_rollback.sql
-- Description: Rollback new personalization features

BEGIN;

-- Drop policies
DROP POLICY IF EXISTS "Users can manage own learning preferences" 
ON learning_preferences;

-- Drop indexes
DROP INDEX IF EXISTS idx_learning_preferences_user_id;

-- Drop tables
DROP TABLE IF EXISTS learning_preferences;

-- Remove columns
ALTER TABLE student_progress 
DROP COLUMN IF EXISTS personalization_data;

COMMIT;
```

### Migration Validation

#### Pre-migration Checks

```javascript
// scripts/migration-checks.js
export async function preMigrationChecks() {
  const checks = [
    checkDatabaseConnection,
    checkDiskSpace,
    checkBackupExists,
    checkUserPermissions,
    validateCurrentSchema
  ];
  
  for (const check of checks) {
    const result = await check();
    if (!result.success) {
      throw new Error(`Pre-migration check failed: ${result.error}`);
    }
  }
}
```

#### Post-migration Validation

```javascript
// scripts/migration-validation.js
export async function postMigrationValidation() {
  const validations = [
    validateSchemaVersion,
    validateDataIntegrity,
    validateIndexes,
    validateConstraints,
    validateRLSPolicies
  ];
  
  const results = await Promise.all(validations.map(v => v()));
  const failures = results.filter(r => !r.success);
  
  if (failures.length > 0) {
    throw new Error(`Migration validation failed: ${failures.map(f => f.error).join(', ')}`);
  }
}
```

## Configuration Migrations

### Configuration File Updates

#### Environment Variables

When environment variables change between versions:

```bash
# Migration script for environment variables
# scripts/migrate-env.sh

#!/bin/bash

echo "Migrating environment variables..."

# Backup current .env
cp .env .env.backup.$(date +%Y%m%d)

# Update variable names
sed -i 's/OLD_VARIABLE_NAME/NEW_VARIABLE_NAME/g' .env

# Add new required variables
if ! grep -q "NEW_REQUIRED_VAR" .env; then
  echo "NEW_REQUIRED_VAR=default_value" >> .env
fi

echo "Environment migration complete. Please review .env file."
```

#### Configuration Schema Updates

```typescript
// src/lib/config/migration.ts
export interface ConfigMigration {
  version: string;
  migrate: (oldConfig: any) => any;
  validate: (config: any) => boolean;
}

export const configMigrations: ConfigMigration[] = [
  {
    version: '0.9.0',
    migrate: (oldConfig) => ({
      ...oldConfig,
      ai: {
        ...oldConfig.ai,
        rateLimiting: {
          enabled: true,
          requestsPerMinute: 60
        }
      }
    }),
    validate: (config) => config.ai?.rateLimiting !== undefined
  }
];
```

### Supabase Configuration

#### Project Settings Migration

```javascript
// scripts/migrate-supabase-config.js
export async function migrateSupabaseConfig() {
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);
  
  // Update RLS policies
  await updateRLSPolicies(client);
  
  // Update storage policies
  await updateStoragePolicies(client);
  
  // Update edge functions
  await updateEdgeFunctions(client);
}
```

## Data Export and Import

### Export Tools

#### Full Data Export

```bash
# Export all user data
npm run export:data --format=json --output=backup.json

# Export specific data types
npm run export:courses --output=courses.json
npm run export:assessments --output=assessments.json
npm run export:progress --output=progress.json
```

#### Selective Export

```javascript
// scripts/export-data.js
export async function exportUserData(userId, options = {}) {
  const data = {
    profile: await exportUserProfile(userId),
    courses: await exportUserCourses(userId),
    progress: await exportUserProgress(userId),
    assessments: await exportUserAssessments(userId)
  };
  
  if (options.includePersonalization) {
    data.personalization = await exportPersonalizationData(userId);
  }
  
  return data;
}
```

### Import Tools

#### Data Import with Validation

```javascript
// scripts/import-data.js
export async function importData(dataFile, options = {}) {
  const data = JSON.parse(fs.readFileSync(dataFile, 'utf8'));
  
  // Validate data format
  const validation = validateImportData(data);
  if (!validation.valid) {
    throw new Error(`Invalid data format: ${validation.errors.join(', ')}`);
  }
  
  // Import with transaction
  await db.transaction(async (tx) => {
    if (options.clearExisting) {
      await clearExistingData(tx);
    }
    
    await importProfiles(tx, data.profiles);
    await importCourses(tx, data.courses);
    await importAssessments(tx, data.assessments);
    await importProgress(tx, data.progress);
  });
}
```

### Data Format Migrations

#### Content Format Updates

```typescript
// src/lib/migrations/content-format.ts
export function migrateContentFormat(oldContent: any): any {
  // Migrate rich text content
  if (oldContent.type === 'rich_text' && oldContent.format === 'html') {
    return {
      ...oldContent,
      content: {
        html: oldContent.content,
        plain_text: stripHtml(oldContent.content)
      }
    };
  }
  
  // Migrate media content
  if (oldContent.type === 'media' && oldContent.url) {
    return {
      ...oldContent,
      type: oldContent.mediaType || 'image',
      content: {
        url: oldContent.url,
        alt_text: oldContent.altText || '',
        caption: oldContent.caption
      }
    };
  }
  
  return oldContent;
}
```

## Breaking Changes

### Version 1.0 Breaking Changes

#### API Changes
- **Authentication**: JWT token format updated
- **Endpoints**: Some endpoint URLs restructured
- **Response Format**: Standardized error response format

#### Database Schema
- **User Roles**: Extended role system with new permissions
- **Assessment Structure**: Enhanced assessment data model
- **Progress Tracking**: More granular progress tracking

#### Configuration
- **Environment Variables**: Some variables renamed for clarity
- **Feature Flags**: New feature flag system

### Migration Path for Breaking Changes

#### API Migration

```typescript
// src/lib/api/v1-compatibility.ts
export class APICompatibilityLayer {
  // Handle old authentication format
  static migrateAuthToken(oldToken: string): string {
    // Convert old token format to new format
    return convertTokenFormat(oldToken);
  }
  
  // Handle old endpoint calls
  static migrateEndpoint(oldEndpoint: string): string {
    const migrations = {
      '/api/user/profile': '/api/v1/profile',
      '/api/course/list': '/api/v1/courses',
      '/api/assessment/submit': '/api/v1/assessments/submit'
    };
    
    return migrations[oldEndpoint] || oldEndpoint;
  }
}
```

#### Component Migration

```svelte
<!-- Migration wrapper for old components -->
<script lang="ts">
  import { onMount } from 'svelte';
  import { migrateProps } from '$lib/migrations/component-props';
  
  export let legacyProps: any;
  
  let migratedProps: any;
  
  onMount(() => {
    migratedProps = migrateProps(legacyProps);
  });
</script>

{#if migratedProps}
  <NewComponent {...migratedProps} />
{/if}
```

## Migration Tools

### Command Line Tools

#### Migration CLI

```bash
# Check migration status
npm run migrate:status

# Run pending migrations
npm run migrate:up

# Rollback last migration
npm run migrate:down

# Create new migration
npm run migrate:create --name="add_new_feature"

# Validate migrations
npm run migrate:validate
```

#### Data Migration Tools

```bash
# Export data before migration
npm run data:export --version=current

# Import data after migration
npm run data:import --file=backup.json --validate

# Compare data before/after
npm run data:compare --before=backup.json --after=current
```

### Web-based Migration Interface

#### Migration Dashboard

```typescript
// src/routes/admin/migrations/+page.svelte
<script lang="ts">
  import { onMount } from 'svelte';
  import { getMigrationStatus, runMigration } from '$lib/services/migration';
  
  let migrations = [];
  let isRunning = false;
  
  onMount(async () => {
    migrations = await getMigrationStatus();
  });
  
  async function runPendingMigrations() {
    isRunning = true;
    try {
      await runMigration();
      migrations = await getMigrationStatus();
    } finally {
      isRunning = false;
    }
  }
</script>

<div class="migration-dashboard">
  <h1>Database Migrations</h1>
  
  <div class="migration-status">
    {#each migrations as migration}
      <div class="migration-item" class:pending={!migration.applied}>
        <span class="migration-name">{migration.name}</span>
        <span class="migration-status">{migration.applied ? 'Applied' : 'Pending'}</span>
      </div>
    {/each}
  </div>
  
  <button 
    on:click={runPendingMigrations} 
    disabled={isRunning}
    class="btn btn-primary"
  >
    {isRunning ? 'Running...' : 'Run Pending Migrations'}
  </button>
</div>
```

### Automated Migration Testing

#### Migration Test Suite

```typescript
// tests/migrations/migration.test.ts
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createTestDatabase, runMigration, rollbackMigration } from './test-utils';

describe('Database Migrations', () => {
  let testDb: any;
  
  beforeEach(async () => {
    testDb = await createTestDatabase();
  });
  
  afterEach(async () => {
    await testDb.destroy();
  });
  
  it('should migrate from v0.8 to v0.9', async () => {
    // Setup v0.8 schema
    await testDb.loadSchema('v0.8');
    await testDb.seedData('v0.8-sample-data');
    
    // Run migration
    await runMigration(testDb, 'v0.9');
    
    // Verify migration
    const schema = await testDb.getSchema();
    expect(schema.tables).toContain('learning_preferences');
    
    // Verify data integrity
    const userData = await testDb.query('SELECT * FROM profiles');
    expect(userData.length).toBeGreaterThan(0);
  });
  
  it('should rollback v0.9 to v0.8', async () => {
    // Setup v0.9 schema
    await testDb.loadSchema('v0.9');
    
    // Rollback to v0.8
    await rollbackMigration(testDb, 'v0.8');
    
    // Verify rollback
    const schema = await testDb.getSchema();
    expect(schema.tables).not.toContain('learning_preferences');
  });
});
```

## Troubleshooting

### Common Migration Issues

#### Database Connection Issues

```bash
# Check database connectivity
npm run db:ping

# Check database permissions
npm run db:check-permissions

# Reset database connection
npm run db:reconnect
```

#### Migration Failures

```bash
# Check migration logs
npm run migrate:logs

# Rollback failed migration
npm run migrate:rollback --steps=1

# Force migration state
npm run migrate:force --version=20241201000001
```

#### Data Integrity Issues

```bash
# Validate data integrity
npm run data:validate

# Repair data inconsistencies
npm run data:repair --dry-run
npm run data:repair --confirm

# Rebuild indexes
npm run db:reindex
```

### Recovery Procedures

#### Backup Recovery

```bash
# List available backups
npm run backup:list

# Restore from backup
npm run backup:restore --file=backup-20241201.sql

# Verify restoration
npm run db:verify
```

#### Emergency Rollback

```bash
# Emergency rollback to last known good state
npm run emergency:rollback

# Restore from automatic backup
npm run emergency:restore

# Validate system state
npm run system:validate
```

### Support Resources

#### Getting Help

- **Documentation**: Check migration-specific docs
- **Community**: Ask in Discord #migrations channel
- **Issues**: Create GitHub issue with migration tag
- **Support**: Email support@personalized-lms.org

#### Reporting Migration Issues

When reporting migration issues, include:

1. **Version Information**: Current and target versions
2. **Error Messages**: Complete error logs
3. **Environment**: Database version, OS, Node.js version
4. **Steps**: Exact steps that led to the issue
5. **Data**: Sample data that reproduces the issue (anonymized)

---

**Last Updated**: December 2024
**Next Review**: March 2025

This migration guide is updated with each release. Check the latest version before performing migrations.