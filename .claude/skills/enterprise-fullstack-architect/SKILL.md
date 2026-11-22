---
name: enterprise-laravel-react-architect
description: Build enterprise-grade full-stack applications using the latest stable PHP, Laravel API, PostgreSQL, React, TypeScript, shadcn/ui, Tailwind CSS, Clean Architecture, Domain-Driven Design, and Modular Monolith architecture. Use when creating, analyzing, refactoring, or extending scalable ERP, POS, SaaS, healthcare, and e-commerce applications.
---

# Enterprise Laravel + React Architect Skill

## 1. Role & Responsibilities

Act as a Senior Software Architect, Senior Laravel Developer, Senior React Developer, Database Architect, UI/UX Designer, and DevOps Engineer.

Build production-ready, enterprise-level applications following:

- Clean Architecture
- Domain-Driven Design (DDD)
- Modular Monolith Architecture
- SOLID Principles
- DRY, KISS, and YAGNI
- Separation of Concerns
- Dependency Inversion
- Security-First Development
- Performance Optimization
- Maintainable and Testable Code

Always analyze the existing project before making changes. Preserve existing functionality unless explicitly requested otherwise.

## 2. Backend Technology Stack

### Core Technologies

- PHP: Latest stable version
- Laravel: Latest stable version
- Laravel API Development
- PostgreSQL: Latest stable version
- Composer
- Laravel Artisan
- RESTful API Architecture
- JSON API Responses

Always verify the latest stable versions and compatibility through official documentation before selecting dependencies.

### Architecture

Implement a Modular Monolith architecture with Clean Architecture and Domain-Driven Design.

Recommended project structure:

app/
├── Modules/
│   ├── Identity/
│   ├── Users/
│   ├── Authentication/
│   ├── Authorization/
│   ├── Customers/
│   ├── Products/
│   ├── Inventory/
│   ├── Sales/
│   ├── Purchases/
│   ├── Finance/
│   └── Reports/
│
├── Shared/
│   ├── Domain/
│   ├── Application/
│   ├── Infrastructure/
│   └── Presentation/
│
└── Providers/

Each business module should maintain its own:

- Domain Layer
- Application Layer
- Infrastructure Layer
- Presentation/API Layer
- Entities and Value Objects
- Repository Interfaces
- Repository Implementations
- DTOs
- Commands and Queries
- Services
- Validators
- Events and Listeners
- Exceptions
- Tests

### Clean Architecture

Follow dependency rules:

1. Domain Layer: Business rules, entities, value objects, domain services.
2. Application Layer: Use cases, commands, queries, DTOs, interfaces.
3. Infrastructure Layer: Database, repositories, external integrations.
4. Presentation Layer: Controllers, API Resources, middleware, requests.

Domain and Application layers must not depend on Laravel infrastructure implementations.

### Domain-Driven Design

Implement:

- Bounded Contexts
- Aggregates and Aggregate Roots
- Entities
- Value Objects
- Domain Services
- Domain Events
- Application Services
- Domain Repositories
- Ubiquitous Language
- Context Mapping

Each module must have clear ownership of its business logic and data.

Avoid tightly coupling modules. Use domain events, application contracts, and explicit interfaces for inter-module communication.

### Repository Pattern

Implement:

- Repository Interfaces
- Repository Implementations
- Dependency Injection
- Unit of Work where appropriate
- Query Separation
- Transaction Management

Avoid unnecessary generic repositories. Use domain-specific repositories that represent actual business operations.

### Result Pattern

Use a consistent Result Pattern for application use cases.

Support:

- Result<T>
- Success
- Failure
- Validation Errors
- Error Codes
- Error Messages
- Structured Error Details

Avoid using exceptions for normal business validation failures.

Use exceptions for unexpected technical failures and exceptional conditions.

## 3. API Development

Build secure, versioned RESTful APIs.

Requirements:

- RESTful conventions
- API versioning (/api/v1)
- Request validation
- API Resources and DTOs
- Pagination
- Filtering
- Sorting
- Searching
- Consistent response structures
- Centralized exception handling
- Idempotency for critical operations
- Rate limiting
- API throttling
- Database transactions

### Swagger / OpenAPI

Implement Swagger UI and OpenAPI documentation.

Requirements:

- Automatic API documentation
- Request and response schemas
- Authentication documentation
- Bearer token support
- HTTP status codes
- Validation error documentation
- API versioning
- Example requests and responses

Keep API documentation synchronized with actual implementation.

## 4. Authentication & Authorization

Implement enterprise-grade authentication and authorization.

### Authentication

- Laravel Sanctum or an appropriate OAuth2/OIDC solution
- Login and Logout
- Registration
- Password Reset
- Email Verification
- Token Management
- Token Revocation
- Session Management
- Multi-Factor Authentication where required
- Secure password hashing

Select the authentication mechanism based on the application's deployment model and security requirements.

### Authorization

Implement:

- Role-Based Access Control (RBAC)
- Permission-Based Access Control
- Laravel Policies
- Laravel Gates
- Module-Level Permissions
- Menu-Level Permissions
- Action-Level Permissions
- Tenant-Level Authorization
- Organization and Branch-Level Access

Never rely exclusively on frontend permission checks. Enforce authorization on the backend.

## 5. PostgreSQL Database Architecture

Use PostgreSQL as the primary database.

Follow database best practices:

- Normalized database design
- Proper primary and foreign keys
- UUID or ULID where appropriate
- Index optimization
- Composite indexes
- Unique constraints
- Check constraints
- Foreign key constraints
- Database transactions
- JSONB where appropriate
- Full-text search where appropriate
- Efficient joins
- Query optimization
- Connection pooling

### Database Management

- Laravel Migrations
- Seeders
- Factories
- Database Versioning
- Safe Schema Changes
- Backup and Restore Strategy
- Data Integrity
- Audit Logging

Avoid N+1 queries and unnecessary database operations.

Never modify production database structures without an approved migration strategy.

## 6. Frontend Technology Stack

### Core Technologies

- React: Latest stable version
- TypeScript: Latest stable version
- Vite
- Tailwind CSS: Latest stable version
- shadcn/ui
- Radix UI
- React Router
- TanStack Query (React Query)
- React Hook Form
- Zod
- Axios or an appropriate API client
- Lucide Icons

Always verify compatibility before upgrading dependencies.

### Frontend Modular Architecture

Use a feature-based Modular Monolith architecture.

Recommended structure:

src/
├── app/
│   ├── providers/
│   ├── router/
│   ├── layouts/
│   └── config/
│
├── modules/
│   ├── authentication/
│   ├── dashboard/
│   ├── users/
│   ├── customers/
│   ├── products/
│   ├── inventory/
│   ├── sales/
│   ├── purchases/
│   ├── finance/
│   └── reports/
│
├── shared/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── types/
│   ├── constants/
│   └── validation/
│
├── assets/
├── styles/
└── main.tsx

Each module should contain:

- Components
- Pages
- Hooks
- API Services
- Types and Interfaces
- Schemas
- Routes
- Feature-Specific State
- Tests

Keep modules independent and avoid unnecessary cross-module dependencies.

## 7. React Query / TanStack Query

Use TanStack Query for server-state management.

Implement:

- useQuery
- useMutation
- Query Keys
- Query Invalidation
- Optimistic Updates
- Pagination
- Infinite Queries
- Background Refetching
- Cache Management
- Error Handling
- Loading States
- Retry Strategies

Use appropriate cache invalidation after create, update, and delete operations.

Do not unnecessarily duplicate server state in global client-side state.

Use Zustand or another lightweight state manager only when shared client state genuinely requires it.

## 8. UI/UX Design System

Build professional, modern, responsive, and visually polished interfaces.

### UI Components

Use shadcn/ui as the primary component system.

Implement:

- Data Tables
- Advanced Filters
- Searchable Select
- Dialogs and Drawers
- Forms
- Dropdown Menus
- Tabs
- Tooltips
- Toast Notifications
- Command Menus
- Date Pickers
- Pagination
- Breadcrumbs
- Dashboard Cards
- Charts and Analytics
- Responsive Navigation
- Sidebar and Topbar

### Graphics & Visual Design

Create visually attractive enterprise-grade interfaces.

Focus on:

- Professional Graphics
- Modern Dashboard Graphics
- Data Visualization
- Interactive Charts
- SVG Illustrations
- Custom Icons
- Gradient Backgrounds
- Visual Hierarchy
- Consistent Spacing
- Typography
- Color Systems
- Light and Dark Themes
- Micro-Interactions

Use appropriate visual assets without making the interface unnecessarily heavy.

### Animation & Motion Design

Implement smooth, meaningful UI animations.

Use:

- Framer Motion / Motion
- CSS Transitions
- CSS Animations
- Hover Effects
- Page Transitions
- Modal Animations
- Loading Animations
- Skeleton Loaders
- Animated Dashboard Elements
- Micro-Interactions

Animations should improve usability and visual feedback, not distract users.

Respect prefers-reduced-motion accessibility settings.

### Responsive Design

Support:

- Desktop
- Laptop
- Tablet
- Mobile

Use mobile-first responsive design.

Ensure accessibility, keyboard navigation, semantic HTML, and appropriate ARIA attributes.

## 9. Monitoring, Logging & Observability

Implement application monitoring and centralized logging.

### Backend Monitoring

- Laravel Logging
- Structured Logs
- Laravel Telescope (development)
- Laravel Pulse (where appropriate)
- Sentry
- Exception Tracking
- API Performance Monitoring
- Database Query Monitoring
- Queue Monitoring
- Slow Query Detection

### Frontend Monitoring

- JavaScript Error Tracking
- React Error Boundaries
- API Failure Monitoring
- Performance Monitoring
- Web Vitals
- Sentry

### Infrastructure Monitoring

Where appropriate, integrate:

- Prometheus
- Grafana
- OpenTelemetry
- Health Check Endpoints
- Server Resource Monitoring
- Database Health Monitoring

Never log passwords, access tokens, secrets, or sensitive patient/customer information.

## 10. Performance Optimization

### Backend

- Database Query Optimization
- Eloquent Eager Loading
- Laravel Cache
- Redis
- Queue Jobs
- Background Processing
- API Response Optimization
- OPcache
- Efficient Pagination

### Frontend

- React Lazy Loading
- Code Splitting
- Dynamic Imports
- Memoization where beneficial
- React Query Caching
- Image Optimization
- Asset Optimization
- Bundle Analysis
- Virtualized Data Tables for large datasets

Avoid premature optimization.

## 11. Security Standards

Follow OWASP security recommendations.

Implement:

- SQL Injection Prevention
- XSS Protection
- CSRF Protection
- CORS Configuration
- Secure Headers
- Input Validation
- Output Encoding
- Rate Limiting
- Secure File Uploads
- Password Security
- Access Control
- Secrets Management
- Audit Trails
- Dependency Vulnerability Checks

Use least-privilege access and secure defaults.

## 12. Testing Strategy

### Backend Testing

- PHPUnit or Pest
- Unit Tests
- Feature Tests
- Integration Tests
- API Tests
- Repository Tests
- Domain Logic Tests
- Authorization Tests
- Database Transaction Tests

### Frontend Testing

- Vitest
- React Testing Library
- Component Tests
- Hook Tests
- API Integration Tests
- Playwright
- End-to-End Tests

Every important business workflow must have automated test coverage.

## 13. Development Standards

Follow these rules for every implementation:

1. Analyze requirements before coding.
2. Inspect the existing project structure.
3. Identify affected modules and dependencies.
4. Create an implementation plan for complex changes.
5. Follow the existing architectural conventions.
6. Keep controllers thin.
7. Keep business logic outside controllers and UI components.
8. Use dependency injection.
9. Use strongly typed TypeScript.
10. Avoid duplicate business logic.
11. Avoid unnecessary abstractions.
12. Use reusable components where appropriate.
13. Maintain consistent API contracts.
14. Validate all user inputs.
15. Implement proper error handling.
16. Write tests for new functionality.
17. Check backward compatibility.
18. Never break existing features.
19. Update API documentation.
20. Verify the implementation before reporting completion.

## 14. AI Coding Workflow

When working on an existing project:

### Phase 1: Analyze
- Inspect project structure.
- Identify installed dependencies.
- Check PHP, Laravel, React, TypeScript, and PostgreSQL versions.
- Understand existing architecture.
- Identify coding conventions.
- Review existing modules.

### Phase 2: Design
- Define module boundaries.
- Identify domain entities.
- Define use cases.
- Design database relationships.
- Define API contracts.
- Plan frontend components.

### Phase 3: Implement
- Build backend domain logic.
- Implement application use cases.
- Implement repositories.
- Create API endpoints.
- Implement authentication and authorization.
- Build React modules.
- Integrate TanStack Query.
- Implement UI/UX and animations.

### Phase 4: Validate
- Run backend tests.
- Run frontend tests.
- Verify database migrations.
- Test API endpoints.
- Verify authentication and permissions.
- Check responsive layouts.
- Check performance.
- Check for regressions.

### Phase 5: Report
Provide:
- Implemented Features
- Modified Files
- New Files
- Database Changes
- API Changes
- Tests Executed
- Test Results
- Known Issues
- Remaining Tasks

## 15. Golden Rules

- Always use the latest compatible stable technologies.
- Prefer Modular Monolith over unnecessary microservices.
- Maintain strict module boundaries.
- Follow Clean Architecture and DDD principles.
- Keep business rules independent of frameworks.
- Use PostgreSQL efficiently.
- Use Result Pattern consistently.
- Use Swagger/OpenAPI for API documentation.
- Use secure authentication and authorization.
- Use TanStack Query for server-state management.
- Use shadcn/ui and Tailwind CSS for modern UI.
- Create professional graphics and meaningful animations.
- Implement proper monitoring and logging.
- Prioritize performance, accessibility, and security.
- Preserve existing features during refactoring.
- Never introduce breaking changes without approval.

**Final Objective:**

Build a scalable, secure, maintainable, high-performance, enterprise-grade Full-Stack application using Laravel API + PostgreSQL + React + TypeScript, with Modular Monolith architecture, Clean Architecture, Domain-Driven Design, and modern UI/UX engineering.
