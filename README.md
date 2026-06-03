# BoundNotes

A fast, local-first markdown note-taking application built as a personal alternative to Inkdrop — with exactly the features you want, nothing more.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Tauri](https://img.shields.io/badge/Tauri-v2-blue)
![SolidJS](https://img.shields.io/badge/SolidJS-v1.9-blue)
![Rust](https://img.shields.io/badge/Rust-2024-orange)

---

## Features

- **Pure Markdown editor** powered by CodeMirror with syntax highlighting, line numbers, and custom keybindings
- **Live preview** with math (KaTeX), syntax highlighting (highlight.js), GFM tables, task lists, and local image support
- **Synchronized scrolling** between editor and preview in split mode
- **Notebooks** with nested hierarchy (notebooks inside notebooks) and a tree view in the sidebar
- **Tags** with color support, filterable from the sidebar
- **Pinned notes** section for quick access
- **Full-text search** powered by SQLite FTS5
- **Interactive checkboxes** — clickable in both editor and preview
- **Custom title bar** with minimize, maximize, and close controls (no native decorations)
- **Last opened note** restored on relaunch via persistent storage
- **Trash** with restore and permanent delete
- **Sort notes** by title, creation date, or last updated
- **Context menu** on notes (rename, pin/unpin, trash)
- **Keyboard shortcuts** centralized and CodeMirror-aware
- **Dark / Light theme** toggle
- **Animated UI** with smooth transitions on sidebar and note list

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Tauri v2](https://tauri.app) |
| Frontend | [SolidJS](https://solidjs.com) + [TypeScript](https://typescriptlang.org) |
| Styling | [Tailwind CSS v4](https://tailwindcss.com) |
| Build tool | [Vite](https://vitejs.dev) |
| Package manager | [Bun](https://bun.sh) |
| Database | SQLite via [rusqlite](https://github.com/rusqlite/rusqlite) (bundled) |
| Editor | [CodeMirror 6](https://codemirror.net) |
| Markdown | [remark](https://remark.js.org) / [rehype](https://github.com/rehypejs/rehype) ecosystem |
| Animations | [solid-motionone](https://motion.dev/solid) + [solid-transition-group](https://github.com/solidjs-community/solid-transition-group) |

---

## Project Structure

```
boundnotes/
├── src/                        # Frontend (SolidJS)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Sidebar.tsx     # Notebooks, tags, navigation
│   │   │   ├── NoteList.tsx    # Note list with search and sort
│   │   │   ├── MainPanel.tsx   # Editor + preview panel
│   │   │   └── TitleBar.tsx    # Custom window controls
│   │   ├── editor/
│   │   │   ├── MarkdownEditor.tsx   # CodeMirror editor
│   │   │   └── MarkdownPreview.tsx  # Remark/rehype renderer
│   │   └── ui/                 # Reusable UI components
│   ├── stores/
│   │   ├── notesStore.ts       # Notes, notebooks, tags state
│   │   └── uiStore.ts          # UI state (theme, sidebar, editor mode)
│   ├── hooks/
│   │   ├── useAutoSave.ts      # Debounced auto-save (800ms)
│   │   └── useKeyboardShortcuts.ts  # Global shortcut manager
│   ├── lib/
│   │   ├── tauri.ts            # Typed Tauri invoke wrappers
│   │   ├── persistence.ts      # Last note persistence via plugin-store
│   │   └── notebookTree.ts     # Flat → tree structure builder
│   ├── utils/
│   │   ├── rehypePlugins.ts    # Custom rehype plugins
│   │   └── keymapCodeMirror.ts # Custom CodeMirror keybindings
│   └── types/
│       └── index.ts            # Shared TypeScript types
│
└── src-tauri/                  # Backend (Rust)
    ├── src/
    │   ├── lib.rs              # Tauri builder + plugin setup
    │   ├── error.rs            # AppError with thiserror
    │   ├── db/
    │   │   ├── mod.rs          # SQLite pool initialization
    │   │   └── migrations.rs   # Schema versioning system
    │   ├── models/
    │   │   ├── note.rs
    │   │   ├── notebook.rs
    │   │   └── tag.rs
    │   └── commands/
    │       ├── notes.rs        # CRUD + FTS5 search
    │       ├── notebooks.rs    # Nested notebooks CRUD
    │       └── tags.rs         # Tags + note-tag relations
    └── Cargo.toml
```

---

## Database Schema

SQLite with WAL mode, FTS5 full-text search, and a migration versioning system.

```
notes          — metadata (title, excerpt, word_count, is_pinned, is_trashed...)
note_contents  — content separated for performance (loaded only when a note is opened)
notebooks      — hierarchical via parent_id
tags           — with color and position
note_tags      — many-to-many relation
notes_fts      — FTS5 virtual table with auto-sync triggers
schema_migrations — version tracking
```

---

## Keyboard Shortcuts

| Shortcut | Action |
|---|---|
| `Ctrl + B` | Toggle note list |
| `Ctrl + N` | New note |
| `Ctrl + Shift + E` | Editor mode |
| `Ctrl + Shift + P` | Preview mode |
| `Ctrl + Shift + S` | Split mode |
| `Ctrl + Delete` | Trash active note |
| `Ctrl + /` | Show shortcuts panel |
| `Ctrl + B` | Bold (in editor) |
| `Ctrl + I` | Italic (in editor) |
| `Ctrl + 1-4` | Heading 1–4 (in editor) |
| `Ctrl + K` | Insert link (in editor) |
| `Ctrl + E` | Inline code (in editor) |
| `Ctrl + Alt + G` | Code block (in editor) |

---

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) >= 1.0
- [Rust](https://rustup.rs) stable toolchain
- Tauri v2 prerequisites for your OS → [tauri.app/start/prerequisites](https://tauri.app/start/prerequisites/)

### Development

```bash
# Install dependencies
bun install

# Start in development mode
bun run dev:tauri
```

### Build

```bash
# Build for production
bun run build:tauri
```

The output binary will be in `src-tauri/target/release/`.

---

## Architecture Decisions

**rusqlite over sqlx** — sqlx's compile-time query verification requires a `DATABASE_URL` at build time and a `cargo sqlx prepare` step that adds friction. rusqlite with the `bundled` feature embeds SQLite directly in the binary with zero configuration.

**SolidJS over React** — Fine-grained reactivity without a virtual DOM makes it a natural fit for a Tauri app where startup time and memory usage matter. `createStore` with `produce` and `reconcile` enables surgical updates to the note list without full re-renders.

**Content separated from metadata** — `note_contents` is a separate table from `notes`. The note list only loads metadata (title, excerpt, word count, tags), and the full content is fetched only when a note is opened. This keeps the list fast regardless of note size.

**FTS5 with triggers** — Full-text search is maintained automatically via SQLite triggers on `note_contents` inserts, updates, and deletes. No manual index management needed.

---

## License

MIT