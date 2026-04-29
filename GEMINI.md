# Gemini Context: ptune-task

This project is an **Obsidian Plugin** named `ptune-task`, designed for the `ptune` task management workflow. It enables daily planning, Google Tasks synchronization, and automated daily reviews within Obsidian.

## Project Overview

- **Core Tech Stack:** TypeScript, [Obsidian API](https://github.com/obsidianmd/obsidian-api), [esbuild](https://esbuild.github.io/), [Jest](https://jestjs.io/).
- **Architecture:** Domain-Driven Design (DDD) with clear separation of concerns:
  - `src/domain`: Core business logic, models, and services (e.g., `DailyNote`, `HabitService`).
  - `src/application`: Use cases orchestrating workflows (e.g., `SyncAndRebuildDailyNoteUseCase`, `GenerateDailyReviewFlowUseCase`).
  - `src/infrastructure`: Adapters for external systems like Obsidian, LLMs (OpenAI, Claude, Gemini), and file repositories.
  - `src/presentation`: Obsidian-specific UI components (Modals, Settings Tabs) and Command handlers.
  - `src/bootstrap`: Dependency injection via a manual `Container` and feature registration.
- **Key Features:**
  - **Task Sync:** Integration with Google Tasks via `PtuneSync`.
  - **Daily Review:** Automated generation of review content using LLMs and Markdown analysis.
  - **External Integrations:** Supports exporting review points to XMind and Logseq.
  - **Event Hooks:** Infrastructure for automation and daemon interop (e.g., Python scripts).

## Building and Running

### Development
```bash
# Install dependencies
npm install

# Start development build with watch mode
npm run dev
```

### Production Build
```bash
# Build the plugin
npm run build

# Package for distribution (creates a zip in the root)
npm run package
```

### Testing and Linting
```bash
# Run all tests
npm run test

# Run linting
npm run lint

# Specialized linting for review bot logic
npm run lint:reviewbot
```

## Development Conventions

- **Clean Architecture:** Keep business logic in `domain` or `application` and platform-specific code in `infrastructure`.
- **Dependency Injection:** Use the `Container` in `src/bootstrap/container.ts` to manage service lifetimes and dependencies.
- **Type Safety:** Strict TypeScript usage is encouraged. Avoid `any`.
- **Localization:** Use the `i18n` service in `src/shared/i18n/` for user-facing strings.
- **Logging:** Use the centralized `logger` from `src/shared/logger/loggerInstance`.
- **Testing:** New features or bug fixes should include Jest tests in `__tests__` directories corresponding to the modified logic.
- **Markdown Processing:** Use the `unified`/`remark` ecosystem (available in dependencies) for robust Markdown AST manipulations.

## Key Directories

- `src/application/`: Workflow implementation and business services.
- `src/domain/`: Pure business logic and domain models.
- `src/infrastructure/`: Obsidian API wrappers, LLM clients, and repo implementations.
- `src/presentation/`: Commands, Modals, and Setting Tabs.
- `src/bootstrap/`: App initialization and DI container.
- `scripts/`: Build and maintenance scripts.
- `docs/`: Design notes and migration logs.
