# Quiz Builder

A production-grade full-stack Quiz Builder application with a NestJS backend and Next.js frontend.

Create quizzes with three question types, then solve them with server-side grading.

## Architecture

- **Backend**: NestJS 12 (ESM) + Prisma 7 + SQLite
- **Frontend**: Next.js 16 (App Router) + React 19 + Tailwind CSS 4 + shadcn/ui
- **Validation**: class-validator + class-transformer (backend), Zod (frontend)
- **Forms**: React Hook Form + useFieldArray
- **Data Fetching**: Server Components + Server Actions with Next.js 16 cache tags
- **Theming**: Tokyo Night palette, light/dark via `next-themes`
- **Package Manager**: pnpm 10 (workspace)

## Quick Start

### Prerequisites

- Node.js ≥ 22.0.0
- pnpm 10 (`corepack enable && corepack prepare pnpm@10.28.0 --activate`)

### One-command setup

```bash
pnpm install
pnpm bootstrap   # creates backend/.env, generates Prisma client, applies migrations, seeds sample quizzes
pnpm dev
```

Then open:

- Frontend: http://localhost:3000
- Backend API: http://localhost:4000
- Health check: http://localhost:4000/health

`pnpm bootstrap` is safe to re-run: it never overwrites an existing `backend/.env`
and skips seeding if the database already has quizzes.

### Docker

```bash
docker compose up -d --build
```

On start the backend applies migrations and seeds sample data **if the database is
empty**, so a fresh volume comes up with 4 sample quizzes already in place. Existing
data is never overwritten or duplicated on restart.

## Seeding

`backend/prisma/seed.ts` inserts 4 sample quizzes covering all question types:

| Quiz | Types |
|------|-------|
| True or False: JavaScript Fundamentals | `BOOLEAN` |
| Short Answer: Web Development Concepts | `INPUT` |
| Multiple Choice: TypeScript Features | `CHECKBOX` |
| Mixed Practice: Web Fundamentals | all three |

```bash
pnpm db:seed          # seeds only when the database is empty
pnpm db:seed:force    # wipes all quizzes and re-seeds
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/quizzes` | Create a new quiz with questions |
| `GET` | `/quizzes` | List all quizzes with question counts |
| `GET` | `/quizzes/:id` | Get quiz details including the answer key |
| `GET` | `/quizzes/:id/play` | Get a quiz **without** the answer key, for attempting it |
| `POST` | `/quizzes/:id/submit` | Grade an attempt, returns score + per-question review |
| `DELETE` | `/quizzes/:id` | Delete a quiz (cascades to questions/options) |
| `GET` | `/health` | Health check endpoint |

### Solving and grading

Grading happens **on the server**. The `/play` payload deliberately omits every
answer, so the answer key is never sent to the browser or embedded in the SSR
payload.

| Type | Grading rule |
|------|--------------|
| `BOOLEAN` | Exact match |
| `INPUT` | Case- and whitespace-insensitive (`"  tokyo  "` matches `"Tokyo"`) |
| `CHECKBOX` | Set equality, so option order does not matter |

Unanswered questions count as incorrect, so `score` always reflects the full
question count. A submission is rejected if it contains answers for questions
belonging to another quiz, duplicate answers for one question, or fields that do
not match the question type.

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

# Attempt a quiz (no answer key returned)
curl http://localhost:4000/quizzes/<quiz-id>/play

# Submit answers and get graded
curl -X POST http://localhost:4000/quizzes/<quiz-id>/submit \
  -H "Content-Type: application/json" \
  -d '{"answers": [
    {"questionId": "<q-id>", "type": "BOOLEAN", "booleanAnswer": true},
    {"questionId": "<q-id>", "type": "INPUT", "textAnswer": "Tokyo"},
    {"questionId": "<q-id>", "type": "CHECKBOX", "optionIds": ["<opt-id>"]}
  ]}'

# Delete a quiz
curl -X DELETE http://localhost:4000/quizzes/<quiz-id>
```

## Question Types & Validation Rules

| Type | Required Fields | Validation Rules |
|------|-----------------|------------------|
| `BOOLEAN` | `booleanAnswer` | Must be `true` or `false` (not null) |
| `INPUT` | `textAnswer` | Must be a non-empty string |
| `CHECKBOX` | `options[]` | At least 2 options, at least 1 with `isCorrect: true` |

Validation is enforced both client-side (Zod) and server-side (class-validator + custom pipes).

## Individual Commands

```bash
pnpm dev              # frontend + backend in parallel
pnpm dev:backend      # backend only
pnpm dev:frontend     # frontend only

pnpm test             # unit tests
pnpm typecheck        # tsc --noEmit across the workspace
pnpm lint             # oxlint (backend) + eslint (frontend)
pnpm format           # prettier

pnpm build            # production build for both packages
pnpm db:generate      # regenerate Prisma client
pnpm db:migrate       # create/apply a migration (dev)
pnpm db:deploy        # apply existing migrations (no prompts)
pnpm db:studio        # Prisma Studio
pnpm db:reset         # reset the database and re-seed

# Force re-seed
pnpm --filter @quiz-builder/backend db:seed:force
```

> **Note:** local dev and Docker both bind ports 3000 and 4000, so only one can run
> at a time. They also use **separate databases**: local dev uses
> `backend/prisma/dev.db`, Docker uses the `backend-data` volume.

## Theming

The palette is **Tokyo Night**. Surfaces are layered blue-grey rather than neutral
grey, and saturated accents (blue / green / purple / amber / red) are reserved for
meaning — question types and result states use soft tinted surfaces.

A light/dark switch sits in the header. The first visit follows your OS setting
(`defaultTheme="system"`), and the choice is then persisted. Icons are driven by CSS
keyed off the `dark` class, so there is no hydration mismatch and no flash of the
wrong theme.

All colour pairs meet WCAG AA contrast in both themes. Theme tokens live in
`frontend/src/app/globals.css`.

## Docker Deployment

```bash
docker compose up -d --build   # build and start
docker compose logs -f         # view logs
docker compose down            # stop
docker compose down -v         # stop and destroy the database volume
```

Services:

- `backend` on port 4000, SQLite persisted in the `backend-data` volume at `/data/prod.db`
- `frontend` on port 3000 (Next.js standalone output)

The database lives in `/data` rather than alongside the Prisma schema so the volume
mount cannot shadow the `migrations/` directory baked into the image.

## Project Structure

```
quiz-builder/
├── README.md
├── package.json              # Workspace root (pnpm bootstrap)
├── pnpm-workspace.yaml
├── compose.yaml              # Docker Compose
├── scripts/
│   └── ensure-backend-env.mjs # Creates backend/.env on first bootstrap
├── .prettierrc
├── .editorconfig
├── .gitignore
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   ├── .oxlintrc.json        # oxlint config
│   ├── prisma/
│   │   ├── schema.prisma     # Database schema
│   │   ├── seed.ts           # Idempotent seeding script
│   │   └── migrations/
│   ├── prisma.config.ts      # Prisma 7 config
│   ├── src/
│   │   ├── main.ts           # Application entry point
│   │   ├── app.module.ts
│   │   ├── config/env.ts     # Zod-validated environment config
│   │   ├── common/filters/   # Global exception filter
│   │   ├── prisma/           # PrismaService + PrismaModule
│   │   ├── quizzes/
│   │   │   ├── quizzes.controller.ts
│   │   │   ├── quizzes.service.ts
│   │   │   ├── quizzes.module.ts
│   │   │   ├── dto/          # DTOs with class-validator
│   │   │   ├── pipes/        # Validation pipes
│   │   │   └── *.spec.ts     # Unit tests
│   │   └── health.controller.ts
│   └── Dockerfile
└── frontend/
    ├── package.json
    ├── tsconfig.json
    ├── next.config.ts
    ├── eslint.config.mjs
    ├── components.json       # shadcn/ui config
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx              # Redirects to /quizzes
    │   │   ├── layout.tsx            # Root layout + ThemeProvider
    │   │   ├── globals.css           # Tokyo Night tokens + container utility
    │   │   ├── quizzes/
    │   │   │   ├── page.tsx          # Quiz list
    │   │   │   ├── create/page.tsx   # Quiz creation form
    │   │   │   └── [id]/
    │   │   │       ├── page.tsx      # Quiz detail (shows answer key)
    │   │   │       └── solve/page.tsx# Solve flow (no answer key)
    │   │   └── actions/quizzes.ts    # Server Actions
    │   ├── components/
    │   │   ├── site-header.tsx
    │   │   ├── theme-provider.tsx
    │   │   ├── theme-toggle.tsx
    │   │   ├── solve-quiz.tsx
    │   │   ├── quiz-card.tsx
    │   │   ├── question-badge.tsx
    │   │   ├── delete-quiz-button.tsx
    │   │   ├── ui/                   # shadcn/ui primitives
    │   │   └── quiz-form/            # Form sub-components
    │   └── lib/
    │       ├── api.ts           # Server-side API client with cache tags
    │       ├── tags.ts          # Cache tag constants
    │       └── schemas/quiz.ts  # Zod schemas (form + API)
    └── Dockerfile
```

## Key Technical Decisions

### Backend
- **NestJS 12 ESM**: Modern ESM-first setup with `emitDecoratorMetadata` for decorator metadata
- **Prisma 7**: New `prisma-client` generator with explicit output, driver adapter for SQLite
- **Validation**: Global `ValidationPipe` + per-route `ValidationPipe` with DTO class for proper type inference
- **Custom Validation Pipes**: `QuestionTypeRulesPipe` enforces per-type rules on quiz creation; `AnswerTypeRulesPipe` does the same for submitted answers
- **Server-side grading**: The answer key is never serialised to the client
- **Global Exception Filter**: Standardized error responses `{statusCode, message, error, timestamp}`
- **Environment Config**: Zod-validated via `@nestjs/config`
- **Testing**: Vitest with unit tests for validation pipes and the service

### Frontend
- **Next.js 16**: App Router, Server Components, `force-dynamic` for data fetching
- **Server Actions**: Mutations (`createQuizAction`, `deleteQuizAction`, `submitQuizAction`)
- **Cache Tags**: `quizzes` (list) + `quiz:{id}` (detail) + `play:{id}` (solve)
- **Form State**: React Hook Form + `useFieldArray` for dynamic questions/options
- **Validation**: Zod discriminated union schemas for the form and the API payload
- **UI**: shadcn/ui (Radix) + Tailwind 4 + Sonner for toasts
- **Theming**: `next-themes` with class strategy; theme-aware toasts

## Spec Deviations (Documented)

1. **ESLint Config**: Used flat config (`eslint.config.mjs`) because ESLint 10 removed legacy config support. Backend uses `oxlint` (NestJS 12 default) with `typescript/no-explicit-any: error`.

2. **Prisma 7**: Uses new `prisma-client` generator, driver adapter (`@prisma/adapter-better-sqlite3`), and `prisma.config.ts`. Requires `pnpm.onlyBuiltDependencies` for native modules.

3. **NestJS 12 ESM**: Required explicit `ValidationPipe` on the create route for proper DTO type inference (global pipe alone didn't infer DTO class in ESM).

4. **Database**: SQLite chosen for zero-setup local development (enums and cascades supported since Prisma 6.2). Production can switch to PostgreSQL by changing `DATABASE_URL`.

5. **Frontend Data Fetching**: Server Components + Server Actions instead of TanStack Query.

6. **Setup Script**: Named `bootstrap`, not `setup`. `pnpm setup` resolves to pnpm's own built-in command and would silently skip the project script.

7. **Environment File**: `backend/.env` is gitignored, so a fresh clone has none. `pnpm bootstrap` creates it from `backend/.env.example` via `scripts/ensure-backend-env.mjs`; without it `prisma generate` fails because `prisma.config.ts` requires `DATABASE_URL`.

8. **Pinned Versions**: Prisma is held at `^7.10.0` (the 8.x release candidate dropped `prisma generate`), TypeScript at `^6.0.3` (7.x ships `tsc` only, but the Nest CLI needs the programmatic compiler API), and `better-sqlite3` at `^12.11.1` (13.x dropped prebuilt binaries and requires a full build toolchain in the runtime image).