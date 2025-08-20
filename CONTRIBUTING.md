# Contributing to Personalized LMS

Thank you for your interest in contributing to the Personalized Learning Management System! This document provides guidelines and information for contributors.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Contributing Guidelines](#contributing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Issue Reporting](#issue-reporting)
- [Community Support](#community-support)
- [Recognition](#recognition)

## Code of Conduct

This project adheres to our [Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code. Please report unacceptable behavior to the project maintainers.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Git
- Basic knowledge of Svelte/SvelteKit, TypeScript, and Supabase
- Familiarity with AI/LLM concepts (for AI-related contributions)

### Development Setup

1. **Fork and Clone**
   ```bash
   git clone https://github.com/yourusername/personalized-lms.git
   cd personalized-lms
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run db:setup
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```

6. **Verify Setup**
   - Visit `http://localhost:5173`
   - Check that all features load correctly
   - Run tests: `npm run test`

## Contributing Guidelines

### Types of Contributions

We welcome various types of contributions:

- **Bug fixes**: Fix issues and improve stability
- **Feature development**: Implement new features from our roadmap
- **Documentation**: Improve guides, API docs, and examples
- **Testing**: Add test coverage and improve test quality
- **Accessibility**: Enhance accessibility features and compliance
- **Performance**: Optimize performance and reduce resource usage
- **Translations**: Add support for additional languages
- **AI improvements**: Enhance AI algorithms and personalization

### Development Workflow

1. **Check existing issues** before starting work
2. **Create an issue** for new features or significant changes
3. **Fork the repository** and create a feature branch
4. **Follow coding standards** (see below)
5. **Write tests** for new functionality
6. **Update documentation** as needed
7. **Submit a pull request** with clear description

### Coding Standards

#### TypeScript/JavaScript
- Use TypeScript for all new code
- Follow existing code style and patterns
- Use meaningful variable and function names
- Add JSDoc comments for public APIs
- Prefer functional programming patterns where appropriate

#### Svelte Components
- Use Svelte 5 runes (`$state`, `$derived`, `$props`)
- Follow component naming conventions (PascalCase)
- Implement proper accessibility features
- Use Tailwind CSS for styling
- Include prop type definitions

#### Database
- Use proper SQL formatting and indentation
- Include migration scripts for schema changes
- Follow RLS (Row Level Security) patterns
- Document complex queries and procedures

#### AI Integration
- Handle AI service failures gracefully
- Implement fallback mechanisms
- Add proper error handling and logging
- Consider rate limiting and cost implications
- Document AI prompt engineering decisions

### Testing Requirements

- **Unit tests**: Required for new functions and components
- **Integration tests**: Required for API endpoints
- **Accessibility tests**: Required for UI components
- **End-to-end tests**: Required for critical user journeys

Run tests before submitting:
```bash
npm run test
npm run test:e2e
npm run check
```

### Documentation Standards

- Update relevant documentation for changes
- Use clear, concise language
- Include code examples where helpful
- Follow markdown formatting standards
- Update API documentation for interface changes

## Pull Request Process

### Before Submitting

1. **Sync with main branch**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-feature-branch
   git rebase main
   ```

2. **Run quality checks**
   ```bash
   npm run check
   npm run test
   npm run build
   ```

3. **Update documentation** if needed

### PR Requirements

- **Clear title** describing the change
- **Detailed description** explaining what and why
- **Link to related issues** using keywords (fixes #123)
- **Screenshots** for UI changes
- **Test coverage** for new functionality
- **Breaking changes** clearly documented

### PR Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update
- [ ] Performance improvement
- [ ] Accessibility improvement

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Accessibility testing completed

## Screenshots (if applicable)

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Tests added/updated
- [ ] No breaking changes (or documented)
```

### Review Process

1. **Automated checks** must pass
2. **Code review** by maintainers
3. **Testing** in development environment
4. **Approval** from at least one maintainer
5. **Merge** using squash and merge

## Issue Reporting

### Bug Reports

Use the bug report template and include:
- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (browser, OS, etc.)
- Screenshots or error messages
- Minimal reproduction case if possible

### Feature Requests

Use the feature request template and include:
- Clear description of the feature
- Use case and motivation
- Proposed implementation approach
- Potential impact on existing features
- Willingness to contribute implementation

### Security Issues

**Do not** create public issues for security vulnerabilities. Instead:
- Email security@personalized-lms.org
- Include detailed description and reproduction steps
- Allow reasonable time for response before disclosure

## Community Support

### Getting Help

- **Documentation**: Check our comprehensive docs first
- **Discussions**: Use GitHub Discussions for questions
- **Discord**: Join our community Discord server
- **Stack Overflow**: Tag questions with `personalized-lms`

### Providing Help

- Answer questions in discussions
- Help review pull requests
- Improve documentation
- Share your use cases and experiences
- Mentor new contributors

### Communication Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Ask questions when unclear
- Share knowledge and resources
- Celebrate contributions and achievements

## Recognition

We value all contributions and recognize contributors through:

### Contributor Levels

- **Contributor**: Made accepted contributions
- **Regular Contributor**: Multiple significant contributions
- **Core Contributor**: Ongoing significant contributions
- **Maintainer**: Trusted with project governance

### Recognition Methods

- **Contributors file**: All contributors listed
- **Release notes**: Significant contributions highlighted
- **Social media**: Contributors featured and thanked
- **Conference opportunities**: Speaking and representation opportunities
- **Swag and rewards**: Stickers, t-shirts, and other recognition items

### Contribution Tracking

We track contributions including:
- Code contributions (commits, PRs)
- Documentation improvements
- Issue reporting and triage
- Community support and mentoring
- Testing and quality assurance
- Design and user experience improvements

## Development Resources

### Useful Links

- [Project Roadmap](ROADMAP.md)
- [Architecture Documentation](docs/architecture.md)
- [API Documentation](docs/api.md)
- [Database Schema](docs/database-schema.md)
- [Deployment Guide](docs/deployment.md)

### Learning Resources

- [Svelte Tutorial](https://svelte.dev/tutorial)
- [SvelteKit Documentation](https://kit.svelte.dev/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

### Development Tools

- **VS Code Extensions**: Svelte, TypeScript, Tailwind CSS
- **Browser Extensions**: Svelte DevTools, React DevTools
- **Database Tools**: Supabase Studio, pgAdmin
- **Testing Tools**: Playwright, Vitest

## Questions?

If you have questions not covered in this guide:
- Check our [FAQ](FAQ.md)
- Search existing [GitHub Discussions](https://github.com/personalized-lms/personalized-lms/discussions)
- Create a new discussion
- Join our Discord community

Thank you for contributing to making education more personalized and accessible!