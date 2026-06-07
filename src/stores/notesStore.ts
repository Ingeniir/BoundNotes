import { createMemo, createSignal } from "solid-js";
import { createStore, produce, reconcile } from "solid-js/store";
import type { Note, NoteWithContent, Notebook, Tag } from "../types";
import * as api from "@lib/tauri";
import { persistLastNodeId } from "@lib/persistence";
import { setActiveSidebarId, setSidebarView, sidebarView } from "./uiStore";

// ── État ───────────────────────────────────────────────
const [notes, setNotes] = createStore<Note[]>([]);
const [notebooks, setNotebooks] = createStore<Notebook[]>([]);
const [tags, setTags] = createStore<Tag[]>([]);
const [activeNote, setActiveNote] = createSignal<NoteWithContent | null>(null);
const [activeTags, setActiveTags] = createSignal<Tag[]>([]);
const [loading, setLoading] = createSignal<boolean>(false);

const [allNotes, setAllNotes] = createStore<Note[]>([]);

// Compteurs dérivés automatiquement
export const lengthNotes = createMemo(() => allNotes.filter(n => !n.is_trashed).length);
export const lengthNotesPinned = createMemo(() => allNotes.filter(n => n.is_pinned && !n.is_trashed).length);
export const lengthNotesTrashed = createMemo(() => allNotes.filter(n => n.is_trashed).length);

const [error, setError] = createSignal<string | null>(null);

export { notes, notebooks, tags, activeNote, loading, error, activeTags };

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

    setAllNotes(reconcile(n));
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
    if (notebook_id) {
      // Trouver tous les IDs des sous-notebooks récursivement
      const allIds = getDescendantIds(notebook_id);

      // Charger les notes de tous ces notebooks en parallèle
      const results = await Promise.all(
        allIds.map(id => api.getNotes(id, trashed))
      );

      setNotes(reconcile(results.flat()));
    } else {
      const n = await api.getNotes(undefined, trashed);
      setNotes(reconcile(n));
      if (!trashed) setAllNotes(reconcile(n));
    }
  } catch (err) {
    console.error("Erreur loadNotes :", err);
    setError("Impossible de charger les notes.");
  }
};

const getDescendantIds = (id: string): string[] => {
  const result = [id];
  const children = notebooks.filter(nb => nb.parent_id === id);
  for (const child of children) {
    result.push(...getDescendantIds(child.id));
  }
  return result;
};

export const loadNotesByTag = async (tag_id: string) => {
  setError(null);
  try {
    const n = await api.getNotesByTag(tag_id);
    setNotes(reconcile(n));
  } catch (err) {
    console.error("Erreur loadNotesByTag:", err);
    setError("Impossible de charger les notes par tag.");
  }
};

export const loadPinnedNotes = async () => {
  setError(null);
  try {
    const n = await api.getPinnedNotes();
    setNotes(reconcile(n));
  } catch (err) {
    console.error("Erreur loadPinnedNotes:", err);
    setError("Impossible de charger les notes épinglées.");
  }
};

export const openNote = async (id: string) => {
  setError(null);
  try {
    const note = await api.getNote(id);
    setActiveNote(note);
    setActiveTags(note.tags);
    await persistLastNodeId(id);
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
    setActiveTags([]);

    setAllNotes(produce(all => all.unshift(note)));
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
        tags: updated.tags,
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
    await persistLastNodeId(null);

    setAllNotes(produce(all => {
      const i = all.findIndex(n => n.id === id);
      if (i !== -1) all[i].is_trashed = true;
    }))
  } catch (err) {
    console.error("Erreur trashActiveNote:", err);
    setError("Impossible de mettre la note à la corbeille.");
  }
};

export const restoreNote = async (id: string) => {
  setError(null);
  try {
    await api.restoreNote(id);

    setAllNotes(produce(notes => {
      const i = notes.findIndex(n => n.id === id);
      if (i !== -1) notes[i].is_trashed = false;
    }));

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
    setAllNotes(produce(notes => {
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

    setNotes(
      (note) => note.notebook_id === id,
      "is_trashed",
      true
    );

    setNotebooks(produce(nbs => {
      const i = nbs.findIndex(nb => nb.id === id);
      if (i !== -1) nbs.splice(i, 1);
    }));

    setAllNotes(produce(notes => {
      for (const note of notes) {
        if (note.notebook_id === id) {
          note.is_trashed = true;
        }
      }
    }));

    if (activeNote()?.notebook_id === id) setActiveNote(null);
  } catch (err) {
    console.error("Erreur removeNotebook:", err);
    setError("La suppression du carnet a échoué.");
  }
};

export const updateNotebook = async (id: string, { name, icon }: { name: string, icon?: string }) => {
  setError(null);
  try {
    await api.updateNotebook(id, { name, ...(icon && { icon }) });
    const index = notebooks.findIndex(nb => nb.id === id);
    if (index !== -1) setNotebooks(index, "name", name);
  } catch (err) {
    console.error("Erreur updateNotebook:", err);
    setError("La mise à jour du carnet a échoué.");
  }
}

// ── Gestion tags sur une note ──────────────────────────
export const addTagToNote = async (noteId: string, tagName: string, color?: string) => {
  setError(null);
  try {
    // Crée le tag s'il n'existe pas (idempotent)
    const tag = await api.createTag(tagName, color);
    await api.addTagToNote(noteId, tag.id);

    // Met à jour activeTags
    setActiveTags(prev => {
      if (prev.find(t => t.id === tag.id)) return prev;
      return [...prev, tag];
    });

    if (activeNote()?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, tags: [...(prev.tags || []), tag] } : null);
    }

    // Met à jour la note dans la liste
    const index = notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      const current = notes[index].tags ?? [];
      if (!current.find(t => t.id === tag.id)) {
        setNotes(index, "tags", [...current, tag]);
      }
    }

    setTags(produce(tagsList => {
      if (!tagsList.find(t => t.id === tag.id)) {
        tagsList.push(tag);
      }
    }))

    return tag;
  } catch (err) {
    console.error("Erreur addTagToNote:", err);
    setError("Impossible d'ajouter le tag.");
  }
};

export const removeTagFromNote = async (noteId: string, tagId: string) => {
  setError(null);
  try {
    await api.removeTagFromNote(noteId, tagId);

    // Met à jour activeTags
    setActiveTags((prev) => prev.filter(t => t.id !== tagId));

    if (activeNote()?.id === noteId) {
      setActiveNote(prev => prev ? { ...prev, tags: prev.tags.filter(t => t.id !== tagId) } : null);
    }

    // Met à jour la note dans la liste
    const index = notes.findIndex(n => n.id === noteId);
    if (index !== -1) {
      setNotes(index, "tags", notes[index].tags.filter(t => t.id !== tagId));
    }
  } catch (err) {
    console.error("Erreur removeTagFromNote:", err);
    setError("Impossible de retirer le tag.");
  }
};

export const removeTag = async (tagId: string) => {
  setError(null);
  try {
    await api.removeTag(tagId);

    setTags(produce(tagsList => {
      const i = tagsList.findIndex(t => t.id === tagId);
      if (i !== -1) tagsList.splice(i, 1);
    }));

    setNotes(produce(notesList => {
      for (const note of notesList) {
        if (note.tags) {
          const tagIndex = note.tags.findIndex(t => t.id === tagId);
          if (tagIndex !== -1) {
            note.tags.splice(tagIndex, 1);
          }
        }
      }
    }));

    const currentActive = activeNote();
    if (currentActive && currentActive.tags) {
      setActiveNote({
        ...currentActive,
        tags: currentActive.tags.filter(t => t.id !== tagId)
      });
    }

    if (tags.length <= 0) {
      setSidebarView("all");
      setActiveSidebarId(null);
      await loadNotes();
    }


    setActiveTags(prev => prev.filter(t => t.id !== tagId));
  } catch (err) {
    console.error("Erreur removeTag:", err);
    setError("Impossible de supprimer le tag.");
  }
}

// ── Pin ───────────────────────────────────────
export const togglePin = async (id: string, currentStatus: boolean) => {
  setError(null);
  try {
    const newStatus = await api.toggleNotePin(id, currentStatus);

    setNotes(
      (note) => note.id === id,
      "is_pinned",
      newStatus
    )

    if (sidebarView() === "pinned" && !newStatus) {
      setNotes(produce(notes => {
        const i = notes.findIndex(n => n.id === id);
        if (i !== -1) notes.splice(i, 1);
      }))
      if (activeNote()?.id === id) setActiveNote(null);
    }

    setAllNotes(
      (n) => n.id === id,
      "is_pinned",
      newStatus
    )
  } catch (err) {
    console.error("Erreur togglePin:", err);
    setError("Impossible de changer le statut d'épingle.");
  }
}