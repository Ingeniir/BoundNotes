import { Show } from "solid-js";
import { activeNote, trashActiveNote } from "../../stores/notesStore";
import { editorMode, setEditorMode } from "../../stores/uiStore";
import { MarkdownEditor } from "../editor/MarkdownEditor";
import { MarkdownPreview } from "../editor/MarkdownPreview";
import { IconButton } from "../ui/IconButton";

export function MainPanel() {
  return (
    <div class="flex-1 h-full flex flex-col overflow-hidden">

      <Show
        when={activeNote()}
        fallback={<EmptyState />}
      >
        {/* Toolbar */}
        <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
          {/* Titre */}
          <input
            type="text"
            value={activeNote()?.title ?? ""}
            onInput={(e) => {
              // Le titre est sauvegardé via l'auto-save du store
              import("../../stores/notesStore").then(({ saveNote }) => {
                const id = activeNote()?.id;
                if (id) saveNote(id, { title: e.currentTarget.value });
              });
            }}
            class="text-base font-semibold text-gray-900 bg-transparent border-none
                   outline-none flex-1 mr-4 placeholder-gray-400"
            placeholder="Sans titre"
          />

          {/* Mode buttons */}
          <div class="flex items-center gap-1">
            <IconButton
              label="Éditeur"
              active={editorMode() === "editor"}
              onClick={() => setEditorMode("editor")}
            >
              ✏️
            </IconButton>
            <IconButton
              label="Split"
              active={editorMode() === "split"}
              onClick={() => setEditorMode("split")}
            >
              ⬛
            </IconButton>
            <IconButton
              label="Preview"
              active={editorMode() === "preview"}
              onClick={() => setEditorMode("preview")}
            >
              👁️
            </IconButton>

            <div class="w-px h-4 bg-gray-200 mx-1" />

            <IconButton
              label="Mettre à la corbeille"
              onClick={trashActiveNote}
            >
              🗑️
            </IconButton>
          </div>
        </div>

        {/* Zone éditeur */}
        <div class="flex-1 overflow-hidden flex">
          <Show when={editorMode() === "editor" || editorMode() === "split"}>
            <div class={editorMode() === "split" ? "w-1/2 border-r border-gray-200" : "w-full"}>
              <MarkdownEditor />
            </div>
          </Show>
          <Show when={editorMode() === "preview" || editorMode() === "split"}>
            <div class={editorMode() === "split" ? "w-1/2" : "w-full"}>
              <MarkdownPreview />
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

function EmptyState() {
  return (
    <div class="flex-1 flex flex-col items-center justify-center text-gray-400 gap-3">
      <span class="text-4xl">📝</span>
      <p class="text-sm">Sélectionne une note ou crée-en une nouvelle</p>
    </div>
  );
}