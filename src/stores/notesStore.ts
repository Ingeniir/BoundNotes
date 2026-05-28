import { createSignal } from "solid-js";
import type { Note, NoteWithContent, Notebook, Tag } from "../types";
import * as api from "../lib/tauri";

// ── État ───────────────────────────────────────────────
const [notes, setNotes]             = createSignal<Note[]>([]);
const [notebooks, setNotebooks]     = createSignal<Notebook[]>([]);
const [tags, setTags]               = createSignal<Tag[]>([]);
const [activeNote, setActiveNote]   = createSignal<NoteWithContent | null>(null);
const [loading, setLoading]         = createSignal(false);

export { notes, notebooks, tags, activeNote, loading };

// ── Chargement initial ─────────────────────────────────
export const loadAll = async () => {
  setLoading(true);
  try {
    const [n, nb, t] = await Promise.all([
      api.getNotes(),
      api.getNotebooks(),
      api.getTags(),
    ]);
    setNotes(n);
    setNotebooks(nb);
    setTags(t);
  } finally {
    setLoading(false);
  }
};

// ── Notes ──────────────────────────────────────────────
export const loadNotes = async (notebook_id?: string, trashed = false) => {
  const n = await api.getNotes(notebook_id, trashed);
  setNotes(n);
};

export const openNote = async (id: string) => {
  const note = await api.getNote(id);
  setActiveNote(note);
};

export const newNote = async (notebook_id?: string) => {
  const note = await api.createNote(notebook_id);
  setNotes(prev => [note, ...prev]);
  setActiveNote(note);
  return note;
};

export const saveNote = async (
  id: string,
  payload: { title?: string; content?: string; is_pinned?: boolean }
) => {
  const updated = await api.updateNote(id, payload);
  // Met à jour la note dans la liste
  setNotes(prev =>
    prev.map(n => n.id === id ? { ...n, ...updated } : n)
  );
  // Met à jour la note active si c'est la même
  if (activeNote()?.id === id) {
    setActiveNote(updated);
  }
  return updated;
};

export const trashActiveNote = async () => {
  const note = activeNote();
  if (!note) return;
  await api.trashNote(note.id);
  setNotes(prev => prev.filter(n => n.id !== note.id));
  setActiveNote(null);
};

export const searchQuery = async (query: string) => {
  if (!query.trim()) {
    await loadNotes();
    return;
  }
  const results = await api.searchNotes(query);
  setNotes(results);
};

// ── Notebooks ──────────────────────────────────────────
export const newNotebook = async (name: string) => {
  const nb = await api.createNotebook(name);
  setNotebooks(prev => [...prev, nb]);
  return nb;
};

export const removeNotebook = async (id: string) => {
  await api.deleteNotebook(id);
  setNotebooks(prev => prev.filter(nb => nb.id !== id));
};