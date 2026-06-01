// src/lib/tauri.ts

import { invoke } from "@tauri-apps/api/core";
import type { Note, NoteWithContent, Notebook, Tag } from "../types";

// ── Notes ──────────────────────────────────────────────
export const getNotes = (notebook_id?: string, trashed = false, tag_id?: string) =>
  invoke<Note[]>("get_notes", { notebookId: notebook_id, trashed, tagId: tag_id });

export const getNote = (id: string) =>
  invoke<NoteWithContent>("get_note", { id });

export const createNote = (notebook_id?: string, title?: string) =>
  invoke<NoteWithContent>("create_note", { payload: { notebook_id, title } });

export const updateNote = (
  id: string,
  payload: { title?: string; content?: string; is_pinned?: boolean }
) => invoke<NoteWithContent>("update_note", { id, payload });

export const getNotesByTag = (tag_id: string) =>
  invoke<Note[]>("get_notes_by_tag", { tagId: tag_id });

export const getPinnedNotes = () =>
  invoke<Note[]>("get_pinned_notes");

export const trashNote = (id: string) => invoke("trash_note", { id });
export const restoreNote = (id: string) => invoke("restore_note", { id });
export const deleteNote = (id: string) => invoke("delete_note", { id });
export const searchNotes = (query: string) => invoke<Note[]>("search_notes", { query });

// ── Notebooks ──────────────────────────────────────────
export const getNotebooks = () =>
  invoke<Notebook[]>("get_notebooks");

export const createNotebook = (name: string, icon?: string, parent_id?: string) =>
  invoke<Notebook>("create_notebook", { payload: { name, icon, parent_id } });

export const updateNotebook = (id: string, payload: { name?: string; icon?: string }) =>
  invoke<Notebook>("update_notebook", { id, payload });

export const deleteNotebook = (id: string) =>
  invoke("delete_notebook", { id });

// ── Tags ───────────────────────────────────────────────
export const getTags = () =>
  invoke<Tag[]>("get_tags");

export const createTag = (name: string, color?: string) =>
  invoke<Tag>("create_tag", { payload: { name, color } });

export const addTagToNote = (note_id: string, tag_id: string) =>
  invoke("add_tag_to_note", { noteId: note_id, tagId: tag_id });

export const removeTagFromNote = (note_id: string, tag_id: string) =>
  invoke("remove_tag_from_note", { noteId: note_id, tagId: tag_id });

export const getTagsForNote = (note_id: string) =>
  invoke<Tag[]>("get_tags_for_note", { noteId: note_id });

export const removeTag = (tag_id: string) =>
  invoke("remove_tag", { tagId: tag_id });

// ── Pin ─────────────────────────────────────────────
export const toggleNotePin = (id: string, currentStatus: boolean) =>
  invoke<boolean>("toggle_note_pin", { id, currentStatus });