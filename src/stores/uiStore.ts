import { createSignal } from "solid-js";
import type { EditorMode, SidebarView } from "../types";

// UI State global
const [showListNotes, setShowListNotes] = createSignal<boolean>(true);
export { showListNotes, setShowListNotes };


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

// Panneau sidebar ouvert/fermé
const [sidebarOpen, setSidebarOpen] = createSignal(true);
export { sidebarOpen, setSidebarOpen };