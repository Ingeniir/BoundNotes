// src/types/index.ts

export type Note = {
    id: string;
    notebook_id: string | null;
    title: string;
    excerpt: string | null;
    word_count: number;
    is_pinned: boolean;
    is_trashed: boolean;
    trashed_at: number | null;
    created_at: number;
    updated_at: number;
}

export type NoteWithContent = Note & {
    content: string;
}

export type Notebook = {
    id: string;
    parent_id: string | null;
    name: string;
    icon: string | null;
    position: number;
    created_at: number;
    updated_at: number;
}

export type NotebookNode = Notebook & {
    children: NotebookNode[];
}

export type Tag = {
    id: string;
    name: string;
    color: string | null;
    position: number;
}

export type EditorMode = "editor" | "preview" | "split";

export type SidebarView = "all" | "notebook" | "tag" | "trash";