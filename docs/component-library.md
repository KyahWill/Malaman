# Component Library Documentation

This document provides comprehensive documentation for all UI components in the Personalized LMS application, including usage examples, props documentation, and accessibility guidelines.

## Implementation Status

✅ **Completed Components:**
- All base UI components (Button, Input, Label, Modal, Toast, ProgressBar, Card, Loading, Badge)
- Complete layout system (AppLayout, Header, Navigation, Sidebar)
- Responsive design foundation with Tailwind CSS
- Accessibility features and ARIA support
- Toast notification system
- Authentication store integration

## Table of Contents

- [UI Components](#ui-components)
  - [Button](#button)
  - [Input](#input)
  - [Label](#label)
  - [Modal](#modal)
  - [Toast](#toast)
  - [ProgressBar](#progressbar)
  - [Card](#card)
  - [Loading](#loading)
  - [Badge](#badge)
- [Shared Components](#shared-components)
  - [AppLayout](#applayout)
  - [Header](#header)
  - [Navigation](#navigation)
  - [Sidebar](#sidebar)
- [Store Integration](#store-integration)
  - [Auth Store](#auth-store)
  - [Toast Store](#toast-store)
- [Responsive Design Patterns](#responsive-design-patterns)
- [Accessibility Guidelines](#accessibility-guidelines)
- [Testing Procedures](#testing-procedures)

## UI Components

### Button

A versatile button component with multiple variants and states.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'primary' \| 'secondary' \| 'outline' \| 'ghost'` | `'primary'` | Button style variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Button size |
| `disabled` | `boolean` | `false` | Disable the button |
| `loading` | `boolean` | `false` | Show loading spinner |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `class` | `string` | `''` | Additional CSS classes |
| `onclick` | `() => void` | `undefined` | Click handler |

#### Usage Examples

```svelte
<script>
  import { Button } from '$lib/components/ui';
  
  function handleClick() {
    console.log('Button clicked!');
  }
</script>

<!-- Primary button -->
<Button onclick={handleClick}>
  Save Changes
</Button>

<!-- Secondary button with loading state -->
<Button variant="secondary" loading={isLoading}>
  {isLoading ? 'Saving...' : 'Save Draft'}
</Button>

<!-- Large outline button -->
<Button variant="outline" size="lg" disabled={!isValid}>
  Submit Form
</Button>
```

#### Accessibility Features

- Full keyboard navigation support
- ARIA attributes for screen readers
- Focus management with visible focus indicators
- Loading state announced to screen readers

### Input

A form input component with validation support and accessibility features.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `type` | `'text' \| 'email' \| 'password' \| 'number' \| 'tel' \| 'url'` | `'text'` | Input type |
| `placeholder` | `string` | `undefined` | Placeholder text |
| `value` | `string` | `''` | Input value (bindable) |
| `disabled` | `boolean` | `false` | Disable the input |
| `required` | `boolean` | `false` | Mark as required |
| `class` | `string` | `''` | Additional CSS classes |
| `id` | `string` | `undefined` | HTML id attribute |
| `name` | `string` | `undefined` | HTML name attribute |

#### Usage Examples

```svelte
<script>
  import { Input, Label } from '$lib/components/ui';
  
  let email = '';
  let password = '';
</script>

<!-- Email input with label -->
<div>
  <Label for="email" required>Email Address</Label>
  <Input 
    id="email"
    type="email" 
    bind:value={email}
    placeholder="Enter your email"
    required
  />
</div>

<!-- Password input -->
<div>
  <Label for="password" required>Password</Label>
  <Input 
    id="password"
    type="password" 
    bind:value={password}
    required
  />
</div>
```

### Label

A form label component that pairs with input fields.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `for` | `string` | `undefined` | Associated input id |
| `required` | `boolean` | `false` | Show required indicator |
| `class` | `string` | `''` | Additional CSS classes |

### Modal

A modal dialog component with focus management and accessibility features.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Modal visibility |
| `onClose` | `() => void` | Required | Close handler |
| `title` | `string` | `undefined` | Modal title |
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Modal size |
| `closable` | `boolean` | `true` | Show close button |
| `class` | `string` | `''` | Additional CSS classes |

#### Usage Examples

```svelte
<script>
  import { Modal, Button } from '$lib/components/ui';
  
  let showModal = false;
  
  function openModal() {
    showModal = true;
  }
  
  function closeModal() {
    showModal = false;
  }
</script>

<Button onclick={openModal}>Open Modal</Button>

<Modal 
  open={showModal} 
  onClose={closeModal}
  title="Confirm Action"
  size="md"
>
  <p>Are you sure you want to delete this item?</p>
  
  <div class="flex justify-end space-x-3 mt-6">
    <Button variant="outline" onclick={closeModal}>
      Cancel
    </Button>
    <Button variant="primary" onclick={handleDelete}>
      Delete
    </Button>
  </div>
</Modal>
```

#### Accessibility Features

- Focus trap within modal
- Escape key to close
- ARIA attributes for screen readers
- Focus restoration when closed
- Backdrop click to close (optional)

### Toast

A notification system for displaying temporary messages.

#### Usage

```svelte
<script>
  import { toastHelpers } from '$lib/stores/toast';
  
  function showSuccess() {
    toastHelpers.success('Success!', 'Your changes have been saved.');
  }
  
  function showError() {
    toastHelpers.error('Error', 'Something went wrong. Please try again.');
  }
</script>

<Button onclick={showSuccess}>Show Success</Button>
<Button onclick={showError}>Show Error</Button>
```

#### Toast Types

- `success`: Green styling for positive actions
- `error`: Red styling for errors (persistent by default)
- `warning`: Yellow styling for warnings
- `info`: Blue styling for informational messages

### ProgressBar

A progress indicator component with multiple variants.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `value` | `number` | Required | Current progress value |
| `max` | `number` | `100` | Maximum value |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Progress bar size |
| `variant` | `'primary' \| 'success' \| 'warning' \| 'error'` | `'primary'` | Color variant |
| `showLabel` | `boolean` | `false` | Show percentage label |
| `label` | `string` | `undefined` | Custom label text |
| `animated` | `boolean` | `false` | Animate striped pattern |
| `striped` | `boolean` | `false` | Show striped pattern |

#### Usage Examples

```svelte
<script>
  import { ProgressBar } from '$lib/components/ui';
  
  let progress = 65;
</script>

<!-- Basic progress bar -->
<ProgressBar value={progress} showLabel />

<!-- Course completion progress -->
<ProgressBar 
  value={completedLessons} 
  max={totalLessons}
  variant="success"
  label="Course Progress"
  striped
  animated
/>
```

### Card

A flexible container component for grouping related content.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'outlined' \| 'elevated'` | `'default'` | Card style variant |
| `padding` | `'none' \| 'sm' \| 'md' \| 'lg'` | `'md'` | Internal padding |
| `hover` | `boolean` | `false` | Hover effects |
| `clickable` | `boolean` | `false` | Make card clickable |
| `onclick` | `() => void` | `undefined` | Click handler |

#### Usage Examples

```svelte
<script>
  import { Card, Badge } from '$lib/components/ui';
</script>

<!-- Course card -->
<Card variant="elevated" hover clickable onclick={viewCourse}>
  <h3 class="text-lg font-semibold mb-2">Introduction to JavaScript</h3>
  <p class="text-gray-600 mb-4">Learn the fundamentals of JavaScript programming.</p>
  
  <div class="flex justify-between items-center">
    <Badge variant="primary">Beginner</Badge>
    <span class="text-sm text-gray-500">2 hours</span>
  </div>
</Card>
```

### Loading

A loading indicator component with multiple variants.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'sm' \| 'md' \| 'lg' \| 'xl'` | `'md'` | Loading indicator size |
| `variant` | `'spinner' \| 'dots' \| 'pulse'` | `'spinner'` | Loading animation type |
| `text` | `string` | `undefined` | Loading text |
| `center` | `boolean` | `false` | Center the indicator |
| `overlay` | `boolean` | `false` | Show as full-screen overlay |

### Badge

A small status indicator component.

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'default' \| 'primary' \| 'success' \| 'warning' \| 'error' \| 'info'` | `'default'` | Badge color variant |
| `size` | `'sm' \| 'md' \| 'lg'` | `'md'` | Badge size |
| `rounded` | `boolean` | `false` | Fully rounded badge |

## Shared Components

### AppLayout

The main application layout component that provides the overall structure for authenticated users.

#### Features

- Responsive sidebar navigation with mobile overlay
- Header with user menu and profile information
- Breadcrumb navigation system
- Toast notification integration
- Mobile-friendly design with touch support
- Focus management and keyboard navigation

#### Usage

```svelte
<script>
  import AppLayout from '$lib/components/shared/AppLayout.svelte';
</script>

<AppLayout>
  <!-- Your page content goes here -->
  <h1>Dashboard</h1>
  <p>Welcome to your dashboard!</p>
</AppLayout>
```

#### Implementation Details

- Automatically shows/hides based on authentication state
- Integrates with auth store for user information
- Handles responsive sidebar state management
- Provides consistent layout across all authenticated pages

### Header

The application header with user menu and navigation controls.

#### Features

- User avatar with initials generation
- Dropdown menu with profile and logout options
- Mobile menu toggle button for sidebar
- Logout confirmation modal
- Responsive design with mobile-optimized layout
- Keyboard navigation and accessibility support

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `toggleSidebar` | `() => void` | Function to toggle sidebar visibility |

#### User Menu Items

- Profile Settings (links to `/profile`)
- Dashboard (links to `/dashboard`)
- Sign Out (with confirmation modal)

### Navigation

Breadcrumb navigation component that automatically generates navigation paths.

#### Features

- Automatic breadcrumb generation from current route
- Role-aware navigation labels
- Accessible navigation structure with ARIA labels
- Smart filtering of dynamic route segments
- Responsive design

#### Implementation Details

- Parses `$page.route.id` to generate breadcrumbs
- Filters out dynamic segments like `[id]`
- Provides role-specific labels (e.g., "Student Dashboard", "Instructor Dashboard")
- Only shows when there are multiple navigation levels

### Sidebar

Role-based navigation sidebar with collapsible design and mobile support.

#### Features

- Role-specific navigation items based on user permissions
- Active state indicators with visual feedback
- Mobile-responsive with overlay and backdrop
- Keyboard navigation support
- Profile settings link in footer
- Smooth animations and transitions

#### Props

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Controls sidebar visibility |
| `isMobile` | `boolean` | Indicates mobile viewport |
| `onClose` | `() => void` | Callback when sidebar should close |

#### Navigation Structure

**Student Navigation:**
- Dashboard
- My Courses
- Learning Path
- Assessments
- Progress

**Instructor Navigation:**
- Dashboard
- My Courses
- Create Course
- Students
- Analytics

**Admin Navigation:**
- All instructor items plus:
- User Management
- System Settings

#### Mobile Behavior

- Overlay mode on mobile devices
- Backdrop click to close
- Automatic close on navigation
- Touch-friendly interactions

## Responsive Design Patterns

### Breakpoints

The application uses Tailwind CSS breakpoints:

- `sm`: 640px and up
- `md`: 768px and up
- `lg`: 1024px and up
- `xl`: 1280px and up

### Mobile-First Approach

All components are designed mobile-first with progressive enhancement:

```css
/* Mobile styles (default) */
.component {
  @apply p-4 text-sm;
}

/* Tablet and up */
@media (min-width: 768px) {
  .component {
    @apply p-6 text-base;
  }
}

/* Desktop and up */
@media (min-width: 1024px) {
  .component {
    @apply p-8 text-lg;
  }
}
```

### Responsive Utilities

Common responsive patterns used throughout the application:

- `hidden md:block` - Hide on mobile, show on tablet+
- `block md:hidden` - Show on mobile, hide on tablet+
- `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` - Responsive grid layouts
- `text-sm md:text-base lg:text-lg` - Responsive typography

## Accessibility Guidelines

### WCAG 2.1 AA Compliance

All components are designed to meet WCAG 2.1 AA standards:

#### Color Contrast

- Text contrast ratio of at least 4.5:1
- Large text contrast ratio of at least 3:1
- Interactive elements have sufficient contrast

#### Keyboard Navigation

- All interactive elements are keyboard accessible
- Logical tab order throughout the application
- Visible focus indicators on all focusable elements
- Escape key support for dismissing modals and menus

#### Screen Reader Support

- Semantic HTML elements used throughout
- ARIA labels and descriptions where needed
- Proper heading hierarchy (h1, h2, h3, etc.)
- Form labels associated with inputs
- Status messages announced to screen readers

#### Focus Management

- Focus trapped within modals
- Focus restored when modals close
- Skip links for main content navigation
- Focus indicators clearly visible

### Accessibility Testing Checklist

- [ ] All images have descriptive alt text
- [ ] Form inputs have associated labels
- [ ] Interactive elements are keyboard accessible
- [ ] Color is not the only way to convey information
- [ ] Text can be resized up to 200% without loss of functionality
- [ ] Page has proper heading structure
- [ ] ARIA attributes are used correctly
- [ ] Focus indicators are visible
- [ ] Screen reader testing completed

## Testing Procedures

### Component Testing

Each component should be tested for:

1. **Functionality**: All props work as expected
2. **Accessibility**: Keyboard navigation and screen reader compatibility
3. **Responsive Design**: Proper display across all breakpoints
4. **Error Handling**: Graceful handling of invalid props or states

### Automated Testing

```bash
# Run component tests
npm run test

# Run accessibility tests
npm run test:a11y

# Run visual regression tests
npm run test:visual
```

### Manual Testing

1. **Keyboard Navigation**: Tab through all interactive elements
2. **Screen Reader**: Test with NVDA, JAWS, or VoiceOver
3. **Mobile Testing**: Test on actual mobile devices
4. **Browser Testing**: Test across Chrome, Firefox, Safari, and Edge

### Testing Tools

- **Vitest**: Unit and integration testing
- **Testing Library**: Component testing utilities
- **axe-core**: Automated accessibility testing
- **Playwright**: End-to-end testing
- **Storybook**: Component development and testing

## Store Integration

### Auth Store

The authentication store manages user state and provides reactive authentication data throughout the application.

#### Store Structure

```typescript
interface AuthState {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  initialized: boolean;
  error: string | null;
}
```

#### Derived Stores

- `user`: Current authenticated user
- `profile`: User profile with role and preferences
- `isAuthenticated`: Boolean authentication status
- `isLoading`: Loading state indicator
- `userRole`: User's role (student, instructor, admin)

#### Usage in Components

```svelte
<script>
  import { profile, userRole, authHelpers } from '$lib/stores/auth';
  
  // Reactive user data
  $: displayName = $profile?.first_name || $profile?.email || 'User';
  $: isInstructor = $userRole === 'instructor';
  
  // Logout functionality
  async function handleLogout() {
    await authHelpers.logout();
  }
</script>
```

### Toast Store

The toast notification system provides user feedback for actions and errors.

#### Toast Types

- `success`: Positive feedback (auto-dismiss after 5s)
- `error`: Error messages (persistent by default)
- `warning`: Warning messages (auto-dismiss after 7s)
- `info`: Informational messages (auto-dismiss after 5s)

#### Usage

```svelte
<script>
  import { toastHelpers } from '$lib/stores/toast';
  
  function saveData() {
    try {
      // Save logic here
      toastHelpers.success('Success!', 'Your changes have been saved.');
    } catch (error) {
      toastHelpers.error('Error', 'Failed to save changes. Please try again.');
    }
  }
</script>
```

#### Toast Component Integration

The Toast component is automatically included in AppLayout and displays notifications from the toast store.

## Best Practices

### Component Development

1. **Single Responsibility**: Each component should have one clear purpose
2. **Prop Validation**: Use TypeScript interfaces for all props with proper typing
3. **Accessibility First**: Consider accessibility from the start of development
4. **Responsive Design**: Design for mobile first with progressive enhancement
5. **Performance**: Optimize for fast loading and smooth interactions
6. **State Management**: Use Svelte stores for shared state, local state for component-specific data

### Styling Guidelines

1. **Utility Classes**: Use Tailwind CSS utility classes for consistent styling
2. **Consistent Spacing**: Use the spacing scale (4, 8, 12, 16, etc.) from Tailwind
3. **Color System**: Use the defined color palette with CSS custom properties
4. **Typography**: Follow the typography scale for consistent text sizing
5. **Component Variants**: Provide multiple style options through props
6. **Focus States**: Always provide visible focus indicators for accessibility

### State Management

1. **Local State**: Use `$state` runes for component-specific state
2. **Derived State**: Use `$derived` for computed values
3. **Global State**: Use Svelte stores for shared application state
4. **Store Helpers**: Provide helper functions for common store operations
5. **Reactive Updates**: Leverage Svelte's reactivity for automatic UI updates

### Documentation

1. **Props Documentation**: Document all props with types and descriptions
2. **Usage Examples**: Provide clear, practical usage examples
3. **Accessibility Notes**: Document accessibility features and requirements
4. **Testing Guidelines**: Include testing recommendations and examples
5. **Migration Guides**: Document breaking changes and migration paths
6. **Store Integration**: Document how components integrate with global stores