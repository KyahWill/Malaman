# Personalized Learning Management System (LMS)

An open-source, AI-powered Learning Management System built with Svelte 5, SvelteKit 2, and Supabase. This system creates personalized learning roadmaps based on individual students' prior knowledge and learning progress, supporting various media types and assessment-driven progression.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![GitHub Stars](https://img.shields.io/github/stars/personalized-lms/personalized-lms?style=social)](https://github.com/personalized-lms/personalized-lms/stargazers)
[![Discord](https://img.shields.io/discord/DISCORD_ID?color=7289da&label=Discord&logo=discord&logoColor=white)](https://discord.gg/personalized-lms)
[![Contributors](https://img.shields.io/github/contributors/personalized-lms/personalized-lms)](https://github.com/personalized-lms/personalized-lms/graphs/contributors)

## 🚀 Features

- **AI-Powered Personalization**: Intelligent learning roadmaps tailored to each student's knowledge profile
- **Complete Course Management**: Full-featured course creation, editing, and publishing system
- **Advanced Course Discovery**: Search, filtering, and categorization for easy course finding
- **Enrollment System**: Streamlined student enrollment with progress tracking
- **Rich Analytics Dashboard**: Comprehensive course performance and student engagement metrics
- **Rich Content Support**: Images, videos, files, rich text, and YouTube integration
- **Assessment-Driven Progress**: Mandatory assessments ensure mastery before progression
- **Role-Based Access**: Separate interfaces for students, instructors, and administrators
- **Responsive Design**: Mobile-friendly interface with accessibility features
- **Open Source**: MIT licensed with community contribution support

## 🏗️ Architecture

### Technology Stack

**Frontend:**
- Svelte 5 - Reactive UI framework
- SvelteKit 2 - Full-stack framework with SSR/SSG
- TypeScript - Type safety and better developer experience
- Tailwind CSS - Utility-first CSS framework
- Tiptap - Rich text editor for content creation

**Backend:**
- Supabase - PostgreSQL database with real-time features
- Supabase Auth - User authentication and authorization
- Supabase Storage - File and media storage
- Row Level Security (RLS) - Data access control

**AI Integration:**
- OpenAI GPT-4 (or compatible LLM) - Content analysis and roadmap generation
- Custom AI tools for assessment creation and personalization

### Project Structure

```
src/
├── lib/
│   ├── components/
│   │   ├── ui/              # Reusable UI components
│   │   ├── student/         # Student-specific components
│   │   ├── instructor/      # Instructor-specific components
│   │   └── shared/          # Shared components
│   ├── services/            # API and business logic
│   ├── stores/              # Svelte stores for state management
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── supabase.ts          # Supabase client configuration
├── routes/
│   ├── auth/                # Authentication routes
│   ├── dashboard/           # User dashboards
│   ├── courses/             # Course management
│   ├── lessons/             # Lesson content
│   └── assessments/         # Assessment system
└── app.css                  # Global styles with Tailwind
```

## 🛠️ Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Supabase account and project
- OpenAI API key (for AI features)

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd personalized-lms
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Configuration:**
   
   Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   
   Update `.env` with your configuration:
   ```env
   # Supabase Configuration
   PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   
   # AI/LLM Configuration
   OPENAI_API_KEY=your-openai-api-key-here
   AI_MODEL=gpt-4
   
   # Application Configuration
   PUBLIC_APP_NAME="Personalized LMS"
   PUBLIC_APP_VERSION="1.0.0"
   ```

4. **Database Setup:**
   
   **Option A: Automated Setup (Recommended)**
   ```bash
   npm run db:setup
   ```
   
   **Option B: Manual Setup**
   ```bash
   # Install Supabase CLI if not already installed
   npm install -g supabase
   
   # Initialize Supabase project
   supabase init
   
   # Start local Supabase services
   supabase start
   
   # Apply database migrations
   supabase db reset
   ```
   
   This will:
   - Create all database tables and relationships
   - Set up Row Level Security (RLS) policies
   - Configure custom PostgreSQL types
   - Start local Supabase services on:
     - Database: `postgresql://postgres:postgres@localhost:54322/postgres`
     - Studio: `http://localhost:54323`
     - API: `http://localhost:54321`

5. **Start Development Server:**
   ```bash
   npm run dev
   ```
   
   Open [http://localhost:5173](http://localhost:5173) in your browser.

## 📋 Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `PUBLIC_SUPABASE_URL` | Your Supabase project URL | Yes | - |
| `PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key | Yes | - |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Yes | - |
| `AI_MODEL` | AI model to use | No | `gpt-4` |
| `PUBLIC_APP_NAME` | Application name | No | `Personalized LMS` |
| `PUBLIC_APP_VERSION` | Application version | No | `1.0.0` |
| `NODE_ENV` | Environment mode | No | `development` |

## 🔧 Development Guidelines

### Code Style

- Use TypeScript for all new files
- Follow Svelte 5 conventions with runes (`$state`, `$derived`, `$props`)
- Use Tailwind CSS for styling with custom component classes
- Implement proper error handling and loading states
- Write accessible HTML with proper ARIA labels

### Component Structure

```typescript
<script lang="ts">
  // Props interface
  interface Props {
    // Define props with types
  }
  
  // Props destructuring with defaults
  let { prop1, prop2 = 'default' }: Props = $props();
  
  // Local state
  let localState = $state(initialValue);
  
  // Derived values
  let computed = $derived(localState * 2);
</script>

<!-- Template with proper accessibility -->
<div class="component-wrapper">
  <!-- Content -->
</div>

<style>
  /* Component-specific styles if needed */
</style>
```

### State Management

- Use Svelte stores for global state
- Keep component state local when possible
- Use derived stores for computed values
- Implement proper error handling in stores

### API Integration

- Use the centralized Supabase client
- Implement proper error handling
- Use TypeScript interfaces for API responses
- Handle loading and error states in components

## 🗄️ Database

### Schema Overview
The system uses PostgreSQL with Supabase, featuring:
- **Custom Types**: User roles, difficulty levels, content types, progress status
- **Core Tables**: Profiles, courses, lessons, content blocks, assessments
- **Security**: Row Level Security (RLS) policies for data isolation
- **Performance**: Optimized indexes and query patterns

### Database Commands
```bash
npm run db:setup     # Complete database setup
npm run db:start     # Start local Supabase services
npm run db:stop      # Stop local Supabase services
npm run db:reset     # Reset database and apply migrations
npm run db:status    # Check service status
npm run db:studio    # Open Supabase Studio
npm run db:push      # Deploy migrations to remote
npm run db:pull      # Pull schema from remote
npm run db:diff      # Generate migration from changes
```

### Documentation
- [Database Schema](docs/database-schema.md) - Complete schema documentation
- [Setup Guide](docs/database-setup.md) - Detailed setup instructions
- [Migration Guide](docs/database-setup.md#migration-management) - Managing database changes

## 🧪 Testing Strategy

### Unit Testing
- Component testing with Svelte Testing Library
- Service layer testing with Vitest
- Database function testing with pgTAP

### Integration Testing
- API endpoint testing
- Database integration testing
- End-to-end testing with Playwright

### Accessibility Testing
- Automated testing with axe-core
- Manual screen reader testing
- WCAG 2.1 AA compliance verification

## 📦 Dependencies

### Core Dependencies
- `@supabase/supabase-js` - Supabase client library
- `svelte` - Reactive UI framework
- `@sveltejs/kit` - Full-stack Svelte framework

### Development Dependencies
- `typescript` - Type checking
- `tailwindcss` - CSS framework
- `@tailwindcss/typography` - Typography plugin
- `postcss` - CSS processing
- `autoprefixer` - CSS vendor prefixes

### Future Dependencies (to be added)
- `@tiptap/core` - Rich text editor
- `@tiptap/starter-kit` - Tiptap starter extensions
- `openai` - OpenAI API client
- `@playwright/test` - End-to-end testing
- `vitest` - Unit testing framework

## 🚀 Deployment

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

### Deployment Platforms
- Vercel (recommended for SvelteKit)
- Netlify
- Supabase Edge Functions
- Traditional VPS with Node.js

## 🤝 Community & Contributing

### Join Our Community

We're building an inclusive, welcoming community of educators, developers, and learners!

- 💬 **Discord**: [Join our Discord server](https://discord.gg/personalized-lms) for real-time discussions
- 🗣️ **GitHub Discussions**: [Ask questions and share ideas](https://github.com/personalized-lms/personalized-lms/discussions)
- 📧 **Mailing List**: Subscribe to our newsletter for updates
- 🐦 **Twitter**: Follow [@PersonalizedLMS](https://twitter.com/PersonalizedLMS) for news

### Contributing

We welcome contributions from everyone! Here's how you can help:

#### 🚀 Quick Contributions
- ⭐ Star the repository
- 🐛 Report bugs using our [issue templates](.github/ISSUE_TEMPLATE/)
- 💡 Suggest features
- 📖 Improve documentation
- 🌍 Help with translations

#### 🔧 Code Contributions
- 🧪 Write tests
- 🎨 Improve UI/UX
- ♿ Enhance accessibility
- 🤖 Improve AI algorithms
- 🔒 Strengthen security

#### 👥 Community Contributions
- 📝 Write tutorials and blog posts
- 🎤 Speak at conferences
- 🏫 Use in educational settings
- 🤝 Mentor new contributors

### Development Workflow
1. Read our [Contributing Guide](CONTRIBUTING.md)
2. Check our [Code of Conduct](CODE_OF_CONDUCT.md)
3. Fork the repository
4. Create a feature branch
5. Make your changes with proper tests
6. Submit a pull request with detailed description

### Recognition
We celebrate our contributors! Check out our:
- [Contributors Hall of Fame](CONTRIBUTORS.md)
- [Monthly Contributor Spotlights](https://blog.personalized-lms.org/contributors)
- [Conference Speaking Opportunities](https://personalized-lms.org/speaking)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

### What this means:
- ✅ **Commercial Use**: Use in commercial projects
- ✅ **Modification**: Modify the source code
- ✅ **Distribution**: Distribute original or modified versions
- ✅ **Private Use**: Use privately without restrictions
- ⚠️ **Attribution**: Include copyright notice and license

## 🔒 Security

Security is a top priority. We:
- 🛡️ Follow security best practices
- 🔍 Conduct regular security audits
- 📢 Maintain a responsible disclosure policy
- 🏆 Recognize security researchers

Found a security issue? Please report it responsibly through our [Security Policy](SECURITY.md).

## 🆘 Support & Resources

### Getting Help
- 📚 **Documentation**: [Comprehensive guides and API docs](docs/)
- 🐛 **Issues**: [Report bugs on GitHub Issues](https://github.com/personalized-lms/personalized-lms/issues)
- 💬 **Discussions**: [Community Q&A](https://github.com/personalized-lms/personalized-lms/discussions)
- 🔒 **Security**: [Report security issues](SECURITY.md)
- ❓ **FAQ**: [Frequently Asked Questions](FAQ.md)

### Professional Services
While the software is free, we offer professional services:
- 🏗️ **Custom Development**: Tailored features and integrations
- 🚀 **Deployment Support**: Professional setup and configuration
- 📞 **Technical Support**: Priority support and consulting
- 🎓 **Training**: Team training and workshops

Contact us at [enterprise@personalized-lms.org](mailto:enterprise@personalized-lms.org) for more information.

### Community Resources
- [Roadmap](ROADMAP.md) - Project roadmap and future plans
- [Migration Guide](MIGRATION.md) - Version migration assistance
- [Governance](GOVERNANCE.md) - Project governance and decision making

## 🗺️ Roadmap

This project follows a spec-driven development approach. See the `.kiro/specs/personalized-lms/` directory for detailed requirements, design, and implementation tasks.

### Current Status: Rich Text Editor Integration 🔄
- [x] Project initialization with SvelteKit 2 and TypeScript
- [x] Tailwind CSS configuration and responsive design foundation
- [x] Supabase client setup and database integration
- [x] Basic project structure with organized component architecture
- [x] **Core type definitions and validation utilities**
- [x] **Database schema implementation with full CRUD operations**
- [x] **Row Level Security (RLS) policies and access control**
- [x] **Authentication system with role-based access**
- [x] **Complete UI component library (Button, Input, Modal, Toast, etc.)**
- [x] **Application layout system with responsive navigation**
- [x] **User authentication flows and profile management**
- [x] **State management with Svelte stores**
- [x] **Accessibility features and WCAG 2.1 AA compliance**
- [x] **Complete course management system for instructors**
- [x] **Course creation and editing functionality**
- [x] **Course catalog with search and filtering**
- [x] **Student enrollment system**
- [x] **Course publishing and visibility controls**
- [x] **Comprehensive course analytics dashboard**
- [x] **Content sanitization and security framework**
- [ ] **Rich text editor integration (Tiptap) - IN PROGRESS**

### Next Steps:
- [ ] Complete rich text editor with full formatting toolbar
- [ ] Lesson content management with media support
- [ ] Assessment system with AI-powered generation
- [ ] Student progress tracking and analytics
- [ ] AI-powered personalized learning roadmaps

## 🙏 Acknowledgments

### Core Technologies
- Built with [Svelte](https://svelte.dev/) and [SvelteKit](https://kit.svelte.dev/)
- Powered by [Supabase](https://supabase.com/)
- AI capabilities provided by [OpenAI](https://openai.com/)
- UI components styled with [Tailwind CSS](https://tailwindcss.com/)

### Contributors
Special thanks to all our [contributors](https://github.com/personalized-lms/personalized-lms/graphs/contributors) who make this project possible!

### Sponsors
We're grateful to our sponsors who support the project's development:
- [Become a sponsor](https://github.com/sponsors/personalized-lms) to support ongoing development

## 📞 Contact

- **General Questions**: [hello@personalized-lms.org](mailto:hello@personalized-lms.org)
- **Technical Support**: [support@personalized-lms.org](mailto:support@personalized-lms.org)
- **Security Issues**: [security@personalized-lms.org](mailto:security@personalized-lms.org)
- **Partnership Inquiries**: [partnerships@personalized-lms.org](mailto:partnerships@personalized-lms.org)

---

<div align="center">

**Made with ❤️ by the open source community**

[⭐ Star us on GitHub](https://github.com/personalized-lms/personalized-lms) • [💬 Join Discord](https://discord.gg/personalized-lms) • [📖 Read the Docs](https://docs.personalized-lms.org) • [🚀 Try the Demo](https://demo.personalized-lms.org)

</div>