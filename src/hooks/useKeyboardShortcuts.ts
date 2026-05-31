import { onCleanup, onMount } from "solid-js";
import { setShowListNotes, showListNotes, setEditorMode, setShowShortcutsPanel } from "@stores/uiStore";
import { newNote, trashActiveNote, activeNote } from "@stores/notesStore";
import { activeSidebarId, sidebarView } from "@stores/uiStore";

type Shortcut = {
    key: string;
    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    description: string;
    action: () => void;
};

const shortcuts: Shortcut[] = [
    // -- UI -----------------------------------
    {
        key: "b",
        ctrl: true,
        description: "Afficher/masquer la liste des notes",
        action: () => setShowListNotes(!showListNotes()),
    },
    // -- Éditeur -----------------------------------
    {
        key: "e",
        ctrl: true,
        shift: true,
        description: "Mode éditeur seul",
        action: () => setEditorMode("editor"),
    },
    {
        key: "p",
        ctrl: true,
        shift: true,
        description: "Mode preview seul",
        action: () => setEditorMode("preview"),
    },
    {
        key: "s",
        ctrl: true,
        shift: true,
        description: "Mode split",
        action: () => setEditorMode("split"),
    },
    // -- Notes -----------------------------------
    {
        key: "n",
        ctrl: true,
        description: "Nouvelle note",
        action: () => {
            const nbId = sidebarView() === "notebook" ? activeSidebarId() ?? undefined : undefined;
            newNote(nbId);
        },
    },
    {
        key: "Delete",
        ctrl: true,
        description: "Mettre la note active à la corbeille",
        action: () => {
            const note = activeNote();
            if (note) trashActiveNote(note.id);
        },
    },

    {
        key: ",",
        ctrl: true,
        description: "Afficher les raccourcis clavier",
        action: () => setShowShortcutsPanel(v => !v),
    }
];

export function useKeyboardShortcuts() {
    const handler = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        const isInInput =
            (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.tagName === "DIV")

        const isInCodeMirror =
            target.classList.contains("cm-content") ||
            !!target.closest(".cm-editor");

        if (isInInput || isInCodeMirror) return;

        for (const shortcut of shortcuts) {
            const ctrlMatch = !!shortcut.ctrl === (e.ctrlKey || e.metaKey);
            const shiftMatch = !!shortcut.shift === e.shiftKey;
            const altMatch = !!shortcut.alt === e.altKey;
            const keyMatch = e.key.toLowerCase() === shortcut.key.toLowerCase();

            if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
                e.preventDefault();
                shortcut.action();
                return;
            }
        }
    };

    onMount(() => window.addEventListener("keydown", handler));
    onCleanup(() => window.removeEventListener("keydown", handler));
}

export { shortcuts };