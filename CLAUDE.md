# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm install          # install dependencies
npm run dev          # watch mode build (inline sourcemaps)
npm run build        # production build (minified)
npm run lint         # eslint src/ and tests/
npm test             # run all Jest tests
npm test -- --testPathPattern="<file>" # run a single test file
```

Tests live in `**/__tests__/**/*.test.ts` and use ts-jest with a mocked `obsidian` module.

## Project

Obsidian community plugin for work-log management (task planning, sync, daily retrospectives). Entry point is `src/main.ts` → compiled to `main.js`. The VS Code extension surface lives under `src/infrastructure/vscode/`.

External sync is done via the `ptune-sync` CLI (spawned as a subprocess). The mock client (`src/infrastructure/sync/ptune-sync/mock/`) is used in tests.

## Architecture

Strict layered architecture — dependencies only flow inward:

```
domain ← application ← infrastructure ← presentation
                      ↑
                  bootstrap (DI container)
```

- **`src/domain/`** — pure TypeScript models and interfaces, no I/O. Core entities: `TaskEntry`, `TaskDocument`, `DailyNote`, `DailyReview`.
- **`src/application/`** — use cases orchestrating domain logic: `planning/`, `sync/pull|push|diff|merge/`, `review/`, `calendar/`, `rebuild/`.
- **`src/infrastructure/`** — I/O adapters: markdown ↔ JSON task conversion (`conversion/task/`), `DailyNoteRepository`, `ProcessRunner`, `PtuneSyncClient`, VS Code components.
- **`src/presentation/`** — thin command entry points (`PullTodayCommand`, `PushAndRebuildCommand`, `ReviewCommand`) using presenter pattern.
- **`src/bootstrap/container.ts`** — dependency injection; minimal by design. Creates `PtuneRuntime` and exposes public methods for command registration.
- **`src/shared/`** — logger, i18n (English/Japanese), and `PtuneRuntime`.

## Dependency Injection Strategy

The project follows **minimal DI**, using **`PtuneRuntime`** as a single aggregation point with **`ObsidianContext`** for platform-specific operations:

```
container.ts (App)
   ↓
ObsidianContext (App reference, Obsidian API)
   ↓
PtuneRuntime
   ├ dailyNoteRepository (I/O adapter)
   ├ obsidianContext (delegated operations)
   └ config access
   ↓
UseCase (receives runtime)
   ↓
Business Services (instantiated inline, no DI)
```

**Key separation:**
- **`ObsidianContext`** (`infrastructure/obsidian/`) — Obsidian App reference and Obsidian-specific operations (path resolution, vault access)
- **`PtuneRuntime`** (`shared/`) — Repository aggregation, delegates Obsidian ops to context
- **Container** — Creates context → runtime; no DI bloat

**Rationale:**
- Container stays lean; only creates context → runtime → exposes public commands
- UseCase receives runtime only, accessing repositories and config on demand
- Obsidian operations isolated in context, enabling alternative implementations (e.g., testing)
- Utility services (parsers, formatters, business logic) are `new`'d inline; they do not depend on DI
- Aligns with Obsidian plugin architecture and remains highly testable

**Example UseCase:**

```typescript
export class CreateDailyNoteUseCase {
  constructor(private readonly runtime: PtuneRuntime) {}
  
  async execute(date: string) {
    const repo = this.runtime.dailyNoteRepository;
    const existing = await repo.findByDate(date);
    if (existing) {
      return { note: existing, created: false };
    }
    
    const note = this.creator.create(date);  // creator is utility, no DI
    await repo.save(note);
    return { note, created: true };
  }
}
```

## Infrastructure in PtuneRuntime

The `PtuneRuntime` holds:
- **Repositories** (e.g., `DailyNoteRepository`) — I/O adapters
- **ObsidianContext** — Obsidian App, vault, path resolution
- **Config access** (via `config` singleton)

The runtime **does NOT** hold:
- Business logic services (e.g., `HabitService`, `TaskTreeBuilder`)
- Formatters or parsers (e.g., `TaskLineMetaParser`, `MarkdownTaskListParser`)
- Temporary transformers or utility functions

Those are instantiated in place, where needed.

## Key Conventions

- TypeScript strict mode (`noImplicitAny`, `strictNullChecks`, `noImplicitReturns`).
- Files stay under ~200–300 lines; single responsibility per file.
- Register all Obsidian listeners via `this.registerEvent` / `this.registerDomEvent` / `this.registerInterval` so they clean up on unload.
- Use `async/await`; avoid raw Promise chains.
- `manifest.json` `id` is stable — never rename after release.
- Avoid VS Code API; Obsidian plugin is the authoritative implementation.
- Keep `PtuneRuntime` focused on infrastructure; let business services remain stateless and instantiated inline.
- Utility services (parsers, formatters, builders) must NOT depend on DI; instantiate them where needed.
