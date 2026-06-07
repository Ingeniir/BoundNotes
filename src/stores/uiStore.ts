import { createSignal } from "solid-js";
import type { EditorMode, NotebookNode, SidebarView } from "../types";
import { activeNote, addTagToNote, updateNotebook } from "./notesStore";
import { tagColor } from "@utils/colorTag";

// UI State global
const [showListNotes, setShowListNotes] = createSignal<boolean>(true);
export { showListNotes, setShowListNotes };

const [showSidebar, setShowSidebar] = createSignal<boolean>(true);
const [sidebarOpen, setSidebarOpen] = createSignal(true);
export { sidebarOpen, setSidebarOpen, showSidebar, setShowSidebar };

// Context menu
const [contextMenu, setContextMenu] = createSignal<{ x: number; y: number; id: string, source: "note" | "notebook", node?: NotebookNode } | null>(null);
export { contextMenu, setContextMenu };

const closeContextMenu = () => setContextMenu(null);
export { closeContextMenu };


// Thème
const [theme, setTheme] = createSignal<"light" | "dark">("light");

const [showShortcutsPanel, setShowShortcutsPanel] = createSignal(false);
export { showShortcutsPanel, setShowShortcutsPanel };

const [tooltip, setTooltip] = createSignal<string | null>(null);
export { tooltip, setTooltip };

const [activeTagId, setActiveTagId] = createSignal<string | null>(null);
export { activeTagId, setActiveTagId };

export const toggleTheme = () => {
  const next = theme() === "light" ? "dark" : "light";
  setTheme(next);
  document.documentElement.classList.toggle("dark", next === "dark");
};

export { theme };

// Mode éditeur
const [editorMode, setEditorMode] = createSignal<EditorMode>("editor");
export { editorMode, setEditorMode };

// Vue sidebar active
const [sidebarView, setSidebarView] = createSignal<SidebarView>("all");
const [activeSidebarId, setActiveSidebarId] = createSignal<string | null>(null);
export { sidebarView, setSidebarView, activeSidebarId, setActiveSidebarId };

// Recherche
const [searchQuery, setSearchQuery] = createSignal("");
export { searchQuery, setSearchQuery };


const [groupByNotebook, setGroupByNotebook] = createSignal<boolean>(true);
export { groupByNotebook, setGroupByNotebook };

// Rename Notebook
const [renamingNotebook, setRenamingNotebook] = createSignal<boolean>(false);
export { renamingNotebook, setRenamingNotebook };
const [valueInputNotebook, setValueInputNotebook] = createSignal<string>("");
export { valueInputNotebook, setValueInputNotebook };

export const handleRename = (node: NotebookNode) => {
  setActiveSidebarId(node.id);
  setRenamingNotebook(true);
  setValueInputNotebook(node.name);
}

export const cancelRename = () => {
  setRenamingNotebook(false);
  setValueInputNotebook("");
}

export const confirmRename = async (node: NotebookNode) => {
  const name = valueInputNotebook().trim();
  if (name && name !== node.name && node.id) {
    await updateNotebook(node.id, { name });
  }
  cancelRename();
}

export const [modeSort, setModeSort] = createSignal<"title" | "date" | "updated">("title");
export const [isReversed, setIsReversed] = createSignal<boolean>(false);

export const [addTagInput, setAddTagInput] = createSignal<boolean>(false);
export const [valueTagInput, setValueTagInput] = createSignal<string>("");
export const [tagColorValue, setTagColorValue] = createSignal<string>("");

export const [tagTargetId, setTagTargetId] = createSignal<string | null>(null);

export const cancelTagInput = () => {
  setAddTagInput(false);
  setValueTagInput("");
  setTagTargetId(null)
};

export const getValueTagInput = (value: string) => {
  const tagColorValue = tagColor(value);
  setValueTagInput(value);
  setTagColorValue(tagColorValue);
}

export const handleAddTag = async (noteId: string) => {
  const tag = await addTagToNote(noteId, valueTagInput().trim(), tagColorValue());
  if (tag) cancelTagInput();
};