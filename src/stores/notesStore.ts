import { createSignal } from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
import type { Note, NoteWithContent, Notebook, Tag } from "../types";
import * as api from "../lib/tauri";

// ── État ───────────────────────────────────────────────
const [notes, setNotes] = createStore<Note[]>([]);
const [notebooks, setNotebooks] = createStore<Notebook[]>([]);
const [tags, setTags] = createStore<Tag[]>([]);
const [activeNote, setActiveNote] = createSignal<NoteWithContent | null>(null);
const [loading, setLoading] = createSignal<boolean>(false);
const [lengthNotes, setLengthNotes] = createSignal<number>(0);

const [error, setError] = createSignal<string | null>(null);

export { notes, notebooks, tags, activeNote, loading, lengthNotes, error };

let currentSearchId = 0;

// ── Chargement initial ─────────────────────────────────
export const loadAll = async () => {
  setLoading(true);
  try {
    const [n, nb, t] = await Promise.all([
      api.getNotes(),
      api.getNotebooks(),
      api.getTags(),
    ]);
    setNotes(reconcile(n));
    setNotebooks(reconcile(nb));
    setTags(reconcile(t));

    setLengthNotes(n.length);
  } catch (e) {
    console.error("Échec du chargement initial :", e);
    setError("Impossible de charger les données.");
  } finally {
    setLoading(false);
  }
};

// ── Notes ──────────────────────────────────────────────
export const loadNotes = async (notebook_id?: string, trashed = false) => {
  setError(null);
  try {
    const n = await api.getNotes(notebook_id, trashed);
    setNotes(reconcile(n));

    if (!notebook_id && !trashed) {
      setLengthNotes(n.length);
    }
  } catch (err) {
    console.error("Erreur loadNotes :", err);
    setError("Impossible de charger les notes.");
  }
};

export const openNote = async (id: string) => {
  setError(null);
  try {
    const note = await api.getNote(id);
    setActiveNote(note);
  } catch (err) {
    console.error("Erreur openNote :", err);
    setError("Impossible d'ouvrir la note.");
  }
};

export const newNote = async (notebook_id?: string) => {
  setError(null);
  try {
    const note = await api.createNote(notebook_id);
    setNotes(produce(notes => notes.unshift(note)));
    setActiveNote(note);

    setLengthNotes(c => c + 1);
    return note;
  } catch (err) {
    console.error("Erreur newNote :", err);
    setError("La création de la note a échoué.");
    return null;
  }
};

export const saveNote = async (
  id: string,
  payload: { title?: string; content?: string; is_pinned?: boolean }
) => {
  setError(null);
  try {
    const updated = await api.updateNote(id, payload);

    const index = notes.findIndex(n => n.id === id);
    if (index !== -1) {
      setNotes(index, {
        title: updated.title,
        excerpt: updated.excerpt,
        word_count: updated.word_count,
        is_pinned: updated.is_pinned,
        updated_at: updated.updated_at,
      });
    }

    if (activeNote()?.id === id) {
      setActiveNote(prev => prev ? { ...prev, ...updated } : null);
    }

    return updated;
  } catch (err) {
    console.error("Erreur saveNote:", err);
    // On throw l'erreur ici pour que ton hook `useAutoSave` puisse 
    // potentiellement l'attraper et afficher un statut "Échec de sauvegarde"
    throw err;
  }
};

export const trashActiveNote = async (id: string) => {
  if (!id) return;

  setError(null);
  try {
    await api.trashNote(id);
    setNotes(produce(notes => {
      const i = notes.findIndex(n => n.id === id);
      if (i !== -1) notes.splice(i, 1);
    }));
    setActiveNote(null);

    setLengthNotes(c => c - 1);
  } catch (err) {
    console.error("Erreur trashActiveNote:", err);
    setError("Impossible de mettre la note à la corbeille.");
  }
};

export const restoreNote = async (id: string) => {
  setError(null);
  try {
    await api.restoreNote(id);

    setLengthNotes(c => c + 1);

    await loadNotes(undefined, true);
  } catch (err) {
    console.error("Erreur restoreNote:", err);
    setError("Impossible de restaurer la note.");
  }
};

export const deleteNote = async (id: string) => {
  setError(null);
  try {
    await api.deleteNote(id);
    setNotes(produce(notes => {
      const i = notes.findIndex(n => n.id === id);
      if (i !== -1) notes.splice(i, 1);
    }));
    if (activeNote()?.id === id) setActiveNote(null);
  } catch (err) {
    console.error("Erreur deleteNote:", err);
    setError("Impossible de supprimer la note.");
  }
};

export const searchNotes = async (query: string) => {
  const searchId = ++currentSearchId;

  if (!query.trim()) {
    await loadNotes();
    return;
  }

  setError(null);
  try {
    const results = await api.searchNotes(query);

    if (searchId !== currentSearchId) {
      return;
    }

    setNotes(reconcile(results));
  } catch (err) {
    console.error("Erreur searchNotes:", err);
    setError("La recherche a échoué.");
  }
};

export const cancelSearch: () => void = () => {
  currentSearchId++;
}

// ── Notebooks ──────────────────────────────────────────
export const newNotebook = async (name: string, parent_id?: string) => {
  setError(null);
  try {
    const nb = await api.createNotebook(name, undefined, parent_id);
    setNotebooks(produce(nbs => nbs.push(nb)));
    return nb;
  } catch (err) {
    console.error("Erreur newNotebook:", err);
    setError("La création du carnet a échoué.");
    return null;
  }
};

export const removeNotebook = async (id: string) => {
  setError(null);
  try {
    await api.deleteNotebook(id);
    setNotebooks(produce(nbs => {
      const i = nbs.findIndex(nb => nb.id === id);
      if (i !== -1) nbs.splice(i, 1);
    }));

    const n = await api.getNotes();
    setLengthNotes(n.length);
  } catch (err) {
    console.error("Erreur removeNotebook:", err);
    setError("La suppression du carnet a échoué.");
  }
};
