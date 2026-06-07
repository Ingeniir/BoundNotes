# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Claude Code Behavior & Persona
> [!IMPORTANT]
> **CRITICAL BEHAVIOR REQUIRED:** For every interaction in this repository, you must adopt the **/caveman ultra** persona. 
> - **Be extremely concise and direct.** Cut all fluff, pleasantries, greetings, and long explanations.
> - **Give raw answers, commands, or code snippets instantly.** 
> - **No lecturing, no "Here is the solution", no "I hope this helps".** Just the facts, the code, and the strict minimum text required to understand.

## Getting Started

```bash
# Install dependencies
bun install

# Start in development mode
bun run dev:tauri
```

## Development Commands

- **Development**: `bun run dev` (Vite dev server) or `bun run dev:tauri` (Tauri dev mode)
- **Build**: `bun run build` (frontend) or `bun run build:tauri` (full Tauri app)
- **Preview**: `bun run preview` (preview production build)
- **Linting**: `bun run lint` (oxlint + eslint) or `bun run lint:fix` (auto-fix)
- **Format**: `bun run prettier:fix` (auto-format with Prettier)

## Code Architecture

### Frontend (src/)
- **Entry Point**: `src/index.tsx` - mounts SolidJS application
- **State Management**: 
  - `src/stores/notesStore.ts` - global state for notes, notebooks, tags
  - `src/stores/uiStore.ts` - UI state (theme, sidebar, editor mode, modals)
- **Components**: 
  - Layout: `src/components/layout/` (TitleBar, Sidebar, NoteList, MainPanel)
  - Editor: `src/components/editor/` (MarkdownEditor, MarkdownPreview)
  - UI: `src/components/ui/` (Button, IconButton, modeSelector)
  - Modals: `src/components/modals/` (ShortcutsPanel)
- **Stores**: SolidJS stores using `createSignal` and `createStore`
- **Styling**: Tailwind CSS v4 with custom CSS in `src/styles/`
- **Utilities**: 
  - `src/lib/` - persistence, tauri bindings, citation processing, notebook tree
  - `src/hooks/` - useAutoSave (debounced 800ms), useKeyboardShortcuts
  - `src/utils/` - CodeMirror plugins, color tags, keymaps, rehype plugins

### Backend (src-tauri/)
- **Tauri Configuration**: `tauri.conf.json` - app settings, security, bundling
- **Rust Logic**: `src-tauri/src/`
  - Commands: Tauri commands exposed to frontend (`commands/` - notes, notebooks, tags)
  - Database: `db/` - SQLite storage with WAL mode, FTS5 full-text search
  - Models: `models/` - note, tag, notebook structs
  - Error handling: `error.rs` (AppError with thiserror)
  - Migrations: `migrations.rs` - schema versioning system
- **Capabilities**: `src-tauri/capabilities/` - security permissions for plugins
- **Type Generation**: `src-tauri/gen/schemas/` - auto-generated TypeScript types from Rust

### Key Technologies & Architecture Decisions
- **Framework**: SolidJS (fine-grained reactivity, no virtual DOM - better Tauri performance)
- **Build Tool**: Vite (with `vite-plugin-solid`)
- **Styling**: Tailwind CSS v4 + DaisyUI
- **Editor**: CodeMirror 6 (markdown, highlight.js, KaTeX plugins)
- **Desktop**: Tauri 2 (Rust backend, webview frontend)
- **Persistence**: SQLite via `@tauri-apps/plugin-store` (rusqlite with bundled feature - zero config)
- **Database Design**: 
  - Content separated from metadata (`note_contents` table) for fast note listing
  - FTS5 full-text search with automatic triggers
  - Hierarchical notebooks via parent_id
  - Many-to-many note-tag relations
- **Type Safety**: TypeScript throughout (frontend) and generated types (backend)

## MCP Tools Usage

This project uses the `code-review-graph` MCP server and `graphify` to maintain a structural knowledge graph of the codebase.

### Rules for Claude:
1. **Always Read First**: Use `semantic_search_nodes` or `query_graph` *before* using Grep, Glob, or standard file reads to explore the codebase.
2. **Auto-Update**: After creating, refactoring, or deleting components or core Rust logic, immediately update the graph using the appropriate index/save tool to prevent drift.
3. **Context Gathering**: When asked to review code or fix a bug, always call `detect_changes` and `get_review_context` first to see how components interact.

### Tool Mapping:
- **Explore code**: `semantic_search_nodes` or `query_graph`
- **Understand impact**: `get_impact_radius` 
- **Code review**: `detect_changes` + `get_review_context`
- **Find relationships**: `query_graph` with callers_of/callees_of/imports_of/tests_for
- **Architecture**: `get_architecture_overview` + `list_communities`
- **Refactoring**: `refactor_tool` for renames and dead code detection

## File Conventions

- **Component files**: `.tsx` for SolidJS components
- **Hooks/lib/utils**: `.ts` for TypeScript utilities
- **Styles**: `.css` for Tailwind-based styling
- **Tests**: Not yet implemented (consider adding Vitest or similar)
- **Config**: `.json`, `.ts`, `.js` for various tool configurations