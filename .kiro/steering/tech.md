# Technology Stack

## Frontend Framework
- **Svelte 5**: Reactive UI framework with runes (`$state`, `$derived`, `$props`)
- **SvelteKit 2**: Full-stack framework with SSR/SSG capabilities
- **TypeScript**: Type safety and enhanced developer experience
- **Tailwind CSS 4**: Utility-first CSS framework with typography plugin
- **Vite**: Build tool and development server

## Backend & Database
- **Supabase**: PostgreSQL database with real-time features
- **Supabase Auth**: User authentication and authorization
- **Supabase Storage**: File and media storage
- **Row Level Security (RLS)**: Database-level access control

## Development Tools
- **PostCSS**: CSS processing with autoprefixer
- **Svelte Check**: TypeScript checking for Svelte files
- **ESLint/Prettier**: Code formatting and linting (to be added)

## Common Commands

### Development
```bash
npm run dev          # Start development server (localhost:5173)
npm run build        # Production build
npm run preview      # Preview production build
npm run check        # Type checking
npm run check:watch  # Type checking in watch mode
```

### Database Management
```bash
npm run db:setup     # Complete database setup (recommended for new projects)
npm run db:start     # Start local Supabase services
npm run db:stop      # Stop local Supabase services
npm run db:reset     # Reset database and apply migrations
npm run db:status    # Check service status
npm run db:studio    # Open Supabase Studio (localhost:54323)
npm run db:push      # Deploy migrations to remote
npm run db:pull      # Pull schema from remote
npm run db:diff      # Generate migration from changes
npm run db:migration # Create new migration file
```

### Local Supabase Services
- **Database**: `postgresql://postgres:postgres@localhost:54322/postgres`
- **Studio**: `http://localhost:54323`
- **API**: `http://localhost:54321`

## Environment Configuration
Required environment variables in `.env`:
- `PUBLIC_SUPABASE_URL`: Supabase project URL
- `PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `OPENAI_API_KEY`: OpenAI API key for AI features (future)
- `AI_MODEL`: AI model to use (default: gpt-4)

## Code Style Guidelines
- Use TypeScript for all new files
- Follow Svelte 5 conventions with runes
- Use Tailwind CSS for styling
- Implement proper error handling and loading states
- Write accessible HTML with ARIA labels
- Use the centralized Supabase client from `$lib/supabase.ts`