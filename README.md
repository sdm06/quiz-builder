# Quiz Builder

A production-grade full-stack Quiz Builder application with a NestJS backend and Next.js frontend.

## Architecture

- **Backend**: NestJS 12 (ESM) + Prisma 7 + SQLite
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui
- **Validation**: class-validator + class-transformer (backend), Zod (frontend)
- **Forms**: React Hook Form + useFieldArray
- **Data Fetching**: Server Components + Server Actions with Next.js 16 cache tags
- **Package Manager**: pnpm 10 (workspace)

## Quick Start (Local Development)

### Prerequisites

- Node.js ≥ 20.19.0
- pnpm 10.28.0 (`corepack enable && corepack prepare pnpm@10.28.0 --activate`)

### Setup

```bash
# Install dependencies
pnpm install

# Generate Prisma client and run migrations
pnpm db:generate
pnpm db:migrate

# Seed the database with 3 sample quizzes
pnpm db:seed

# Start both frontend and backend in development mode
pnpm dev
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/health

### Individual Commands

```bash
# Backend only
pnpm dev:backend

# Frontend only
pnpm dev:frontend

# Run tests
pnpm test

# Type checking
pnpm typecheck

# Linting
pnpm lint

# Format code
pnpm format

# Database operations (run from backend/)
cd backend
pnpm db:studio      # Open Prisma Studio
pnpm db:reset       # Reset database and re-seed
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/quizzes` | Create a new quiz with questions |
| `GET` | `/quizzes` | List all quizzes with question counts |
| `GET` | `/quizzes/:id` | Get quiz details with ordered questions |
| `DELETE` | `/quizzes/:id` | Delete a quiz (cascades to questions/options) |
| `GET` | `/health` | Health check endpoint |

### Example Requests

```bash
# Create a quiz with all three question types
curl -X POST http://localhost:4000/quizzes \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Sample Quiz",
    "questions": [
      {"type": "BOOLEAN", "text": "TypeScript is a superset of JavaScript.", "booleanAnswer": true},
      {"type": "INPUT", "text": "What does HTML stand for?", "textAnswer": "HyperText Markup Language"},
      {"type": "CHECKBOX", "text": "Select all JS primitives:", "options": [
        {"text": "string", "isCorrect": true},
        {"text": "number", "isCorrect": true},
        {"text": "integer", "isCorrect": false}
      ]}
    ]
  }'

# List all quizzes
curl http://localhost:4000/quizzes

# Get quiz details
curl http://localhost:4000/quizzes/<quiz-id>

# Delete a quiz
curl -X DELETE http://localhost:4000/quizzes/<quiz-id>
```

## Question Types & Validation Rules

| Type | Required Fields | Validation Rules |
|------|-----------------|------------------|
| `BOOLEAN` | `booleanAnswer` | Must be `true` or `false` (not null) |
| `INPUT` | `textAnswer` | Must be a non-empty string |
| `CHECKBOX` | `options[]` | At least 2 options, at least 1 with `isCorrect: true` |

Validation is enforced both client-side (Zod) and server-side (class-validator + custom pipe).

## Docker Deployment

```bash
# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down

# Remove volumes (destroys database)
docker compose down -v
```

The Docker Compose file creates:
- `backend` service on port 4000 with SQLite volume
- `frontend` service on port 3000
- Shared volume for SQLite database persistence

## Project Structure

```
quiz-builder/
├── README.md
├── package.json              # Workspace root
├── pnpm-workspace.yaml
├── compose.yaml              # Docker Compose
├── .prettierrc
├── .editorconfig
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .oxlintrc.json        # oxlint config (replaces ESLint)
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── seed.ts           # Database seeding script
│   │   └── migrations/
│   ├── prisma.config.ts      # Prisma 7 config
│   ├── src/
│   │   ├── main.ts           # Application entry point
│   │   ├── app.module.ts
│   │   ├── config/env.ts     # Zod-validated environment config
│   │   ├── common/
│   │   │   └── filters/      # Global exception filter
│   │   ├── prisma/           # PrismaService + PrismaModule
│   │   ├── quizzes/          # Quizzes module
│   │   │   ├── quizzes.controller.ts
│   │   │   ├── quizzes.service.ts
│   │   │   ├── quizzes.module.ts
│   │   │   ├── dto/          # DTOs with class-validator
│   │   │   ├── pipes/        # Custom validation pipe
│   │   │   └── *.spec.ts     # Unit tests
│   │   └── health/           # Health check endpoint
│   └── Dockerfile
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── next.config.ts
│   ├── eslint.config.mjs     # Flat config ESLint
│   ├── components.json       # shadcn/ui config
│   ├── src/
│   │   ├── app/              # Next.js App Router pages
│   │   │   ├── page.tsx              # Redirects to /quizzes
│   │   │   ├── layout.tsx            # Root layout with providers
│   │   │   ├── quizzes/
│   │   │   │   ├── page.tsx          # Dashboard (list + create)
│   │   │   │   ├── create/page.tsx   # Quiz creation form
│   │   │   │   └── [id]/page.tsx     # Quiz detail view
│   │   │   └── actions/quizzes.ts    # Server Actions
│   │   ├── components/
│   │   │   ├── site-header.tsx
│   │   │   ├── quiz-card.tsx
│   │   │   ├── question-badge.tsx
│   │   │   ├── delete-quiz-button.tsx
│   │   │   └── quiz-form/            # Form sub-components
│   │   └── lib/
│   │       ├── api.ts           # Server-side API client with cache tags
│   │       ├── tags.ts          # Cache tag constants
│   │       └── schemas/quiz.ts  # Zod schemas (form + API)
│   └── Dockerfile
└── Dockerfile (not used - compose uses individual Dockerfiles)
```

## Key Technical Decisions

### Backend
- **NestJS 12 ESM**: Modern ESM-first setup with `emitDecoratorMetadata` for decorator metadata
- **Prisma 7**: New `prisma-client` generator with explicit output, driver adapter for SQLite
- **Validation**: Global `ValidationPipe` + per-route `ValidationPipe` with DTO class for proper type inference
- **Custom Validation Pipe**: `QuestionTypeRulesPipe` enforces per-type business rules on the full quiz DTO
- **Global Exception Filter**: Standardized error responses `{statusCode, message, error, timestamp}`
- **Environment Config**: Zod-validated via `@nestjs/config`
- **Testing**: Vitest with unit tests for validation pipe and service

### Frontend
- **Next.js 16**: App Router, Server Components, `force-dynamic` for data fetching
- **Server Actions**: Mutations (`createQuizAction`, `deleteQuizAction`) with `updateTag` for read-your-writes
- **Cache Tags**: `quizzes` (list) + `quiz:{id}` (detail) with `revalidateTag('quizzes', 'max')`
- **Form State**: React Hook Form + `useFieldArray` for dynamic questions/options
- **Validation**: Zod discriminated union schemas with `superRefine` for cross-field rules
- **Type Switching**: Radio-group selector that conditionally renders sub-form fields
- **Reordering**: `useFieldArray` swap/move for question reordering
- **UI**: shadcn/ui (Radix) + Tailwind 4 + Sonner for toasts

## Spec Deviations (Documented)

1. **ESLint Config**: Used flat config (`eslint.config.mjs`) instead of `.eslintrc.json` because ESLint 10 removed legacy config support. Backend uses `oxlint` (NestJS 12 default) with `typescript/no-explicit-any: error`.

2. **Prisma 7**: Uses new `prisma-client` generator, driver adapter (`@prisma/adapter-better-sqlite3`), and `prisma.config.ts`. Requires `pnpm.onlyBuiltDependencies` for native modules.

3. **NestJS 12 ESM**: Required explicit `ValidationPipe` on the create route for proper DTO type inference (global pipe alone didn't infer DTO class in ESM).

4. **Database**: SQLite chosen for zero-setup local development (enums and cascades supported since Prisma 6.2). Production can switch to PostgreSQL by changing `DATABASE_URL`.

5. **Frontend Data Fetching**: Server Components + Server Actions instead of TanStack Query. Uses Next.js 16 `updateTag` for read-your-writes consistency.

## License

UNLICENSED - Private project