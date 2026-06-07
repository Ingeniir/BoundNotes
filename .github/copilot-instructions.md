# BoundNotes Copilot Instructions

## Commands

- Install deps: `bun install`
- Frontend dev: `bun run dev`
- Desktop dev: `bun run dev:tauri`
- Frontend build: `bun run build`
- Desktop build: `bun run build:tauri`
- Preview: `bun run preview`
- Full lint: `bun run lint`
- Oxlint only: `bun run lint:oxlint`
- ESLint only: `bun run lint:eslint`
- Auto-fix lint: `bun run lint:fix`
- Format source: `bun run prettier:fix`

There is no automated test suite yet, so there is no single-test command to run.

## Architecture

- Desktop app: SolidJS frontend + Tauri v2 Rust backend.
- Frontend starts in `src/index.tsx`, mounts `App`, and `App.tsx` builds the full shell: custom title bar, sidebar, note list, main editor panel, error/tooltip overlays, and shortcuts modal.
- State is split across Solid stores in `src/stores/notesStore.ts` and `src/stores/uiStore.ts`; note loading, selection, search, pin/trash, tags, and notebook state are centralized there.
- Frontend Tauri calls live in `src/lib/tauri.ts`; they are thin wrappers around `invoke(...)` and should stay aligned with the Rust command names.
- Backend entry is `src-tauri/src/lib.rs`, which initializes plugins, opens SQLite, stores the DB in Tauri state, and registers all commands.
- Database access lives in `src-tauri/src/db/` and command handlers in `src-tauri/src/commands/`.
- Notes use split storage: metadata in `notes`, body text in `note_contents`, with FTS5 search maintained by SQLite triggers.
- Notebooks are hierarchical via `parent_id`; tags are many-to-many through `note_tags`.

## Conventions

- Use the existing path aliases from `tsconfig.json`: `@components`, `@stores`, `@utils`, `@types`, `@hooks`, `@styles`, `@lib`.
- Prefer Solid primitives (`createSignal`, `createStore`, `createMemo`) and the existing store helpers instead of introducing new state patterns.
- Keep frontend and backend command shapes aligned: camelCase wrappers in TypeScript, snake_case Tauri command names in Rust.
- When changing note data, keep `notes`, `allNotes`, `activeNote`, and `activeTags` in sync; the store already contains the update logic for that.
- Use the existing Rust error pattern (`AppError` / `AppResult`) and the shared `Db(Mutex<Connection>)` state.
- Keep UI behavior local-first: last-opened note persistence, autosave, custom title bar, and hidden-initially window behavior are part of the app flow.
- Source comments and some user-facing strings may be in French; keep the surrounding style consistent when touching nearby code.
