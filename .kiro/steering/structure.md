# Project Structure

## Root Directory
```
├── .env                    # Environment variables (not committed)
├── .env.example           # Environment template
├── .kiro/                 # Kiro configuration and specs
├── docs/                  # Project documentation
├── scripts/               # Setup and utility scripts
├── src/                   # Source code
├── static/                # Static assets
├── supabase/              # Database migrations and config
└── package.json           # Dependencies and scripts
```

## Source Code Organization (`src/`)
```
src/
├── app.css                # Global styles with Tailwind
├── app.d.ts              # Global type definitions
├── app.html              # HTML template
├── lib/                  # Shared library code
│   ├── components/       # Reusable components
│   │   ├── ui/          # Base UI components (Button, Input, etc.)
│   │   ├── student/     # Student-specific components
│   │   ├── instructor/  # Instructor-specific components
│   │   └── shared/      # Cross-role shared components
│   ├── services/        # API and business logic
│   ├── stores/          # Svelte stores for state management
│   ├── types/           # TypeScript type definitions
│   ├── utils/           # Utility functions
│   └── supabase.ts      # Supabase client configuration
└── routes/              # SvelteKit routes (pages and API)
    ├── +layout.svelte   # Root layout
    ├── +page.svelte     # Home page
    ├── auth/            # Authentication routes
    ├── dashboard/       # User dashboards
    ├── courses/         # Course management
    ├── lessons/         # Lesson content
    └── assessments/     # Assessment system
```

## Database Structure (`supabase/`)
```
supabase/
├── config.toml          # Supabase configuration
└── migrations/          # Database migrations
    ├── 20240101000001_initial_schema.sql    # Core tables and types
    └── 20240101000002_rls_policies.sql      # Row Level Security
```

## Component Architecture

### UI Components (`src/lib/components/ui/`)
- Base components with consistent styling
- Props interface with TypeScript
- Tailwind CSS classes with variants
- Accessibility features built-in
- Example: `Button.svelte`, `Input.svelte`

### Role-Specific Components
- **Student components**: Learning interface, progress tracking
- **Instructor components**: Course creation, student management
- **Shared components**: Navigation, modals, forms

## Database Schema Overview

### Core Tables
- `profiles`: User profiles extending Supabase auth
- `courses`: Course definitions and metadata
- `lessons`: Individual lessons within courses
- `content_blocks`: Rich content within lessons
- `assessments`: Quizzes and evaluations
- `enrollments`: Student-course relationships
- `student_progress`: Learning progress tracking
- `personalized_roadmaps`: AI-generated learning paths

### Custom Types
- `user_role`: 'student' | 'instructor' | 'admin'
- `difficulty_level`: 'beginner' | 'intermediate' | 'advanced'
- `content_type`: 'rich_text' | 'image' | 'video' | 'file' | 'youtube'
- `progress_status`: 'not_started' | 'in_progress' | 'completed' | 'blocked'
- `roadmap_status`: 'active' | 'completed' | 'paused'

## File Naming Conventions
- **Components**: PascalCase (e.g., `Button.svelte`, `CourseCard.svelte`)
- **Routes**: kebab-case with SvelteKit conventions (e.g., `+page.svelte`, `+layout.svelte`)
- **Services**: camelCase (e.g., `auth.ts`, `courseService.ts`)
- **Types**: camelCase interfaces (e.g., `User`, `Course`, `Assessment`)
- **Utilities**: camelCase functions (e.g., `formatDate`, `validateEmail`)

## Import Patterns
- Use `$lib/` alias for library imports
- Use `$env/` for environment variables
- Relative imports for same-directory files
- Barrel exports in `index.ts` files for clean imports

## State Management
- **Local state**: Svelte runes (`$state`, `$derived`)
- **Global state**: Svelte stores in `src/lib/stores/`
- **Authentication**: Centralized auth store
- **API data**: Service layer with proper error handling

## Security Considerations
- Row Level Security (RLS) policies for all database tables
- Role-based access control in components and routes
- Input validation and sanitization
- Secure environment variable handling
- HTTPS-only in production