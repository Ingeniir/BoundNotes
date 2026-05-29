import { createEffect, createSignal, onCleanup, onMount, Show } from "solid-js";
import { activeNote } from "@stores/notesStore";
import { editorMode, setTooltip } from "@stores/uiStore";
import { MarkdownEditor } from "../editor/MarkdownEditor";
import { MarkdownPreview } from "../editor/MarkdownPreview";
import { useAutoSave } from "../../hooks/useAutoSave";
import { ModeSelector } from "@components/ui/modeSelector";
import { Tag } from "lucide-solid";

export function MainPanel() {

  const { schedule } = useAutoSave(() => activeNote()?.id);
  const [hover, setHover] = createSignal(false);

  let titleInputRef!: HTMLInputElement;

  const handleClick = (message: string) => {
    setTooltip(message);
    setTimeout(() => {
      setTooltip(null);
    }, 2000);
  }

  onMount(() => {
    const handleFocusRequest = () => {
      setTimeout(() => {
        if (titleInputRef) {
          titleInputRef.focus();
          titleInputRef.select();
        }
      }, 100);
    };

    window.addEventListener("focus-note-title", handleFocusRequest);

    onCleanup(() => {
      window.removeEventListener("focus-note-title", handleFocusRequest);
    })
  })

  createEffect(() => {
    const note = activeNote();
    if (titleInputRef && note) {
      titleInputRef.value = note.title;
    }
  })

  return (
    <div class="flex-1 min-w-0 h-full flex flex-col overflow-hidden">

      <Show
        when={activeNote()}
        fallback={<EmptyState />}
      >

        <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
          <div class="w-full flex items-center justify-between">
            <input
              type="text"
              ref={titleInputRef}
              onInput={(e) => schedule({ title: e.currentTarget.value })}
              class="text-base font-semibold text-gray-900 bg-transparent border-none
                   outline-none flex-1 mr-4 placeholder-gray-400"
              placeholder="Sans titre"
            />
            <div class="flex items-center gap-2">
              <button class="text-neutral-400 hover:text-neutral-600 transition-colors duration-200">
                <Tag size={16} />
              </button>
            </div>
          </div>
          <div class="flex items-center ml-4">
            <ModeSelector handleClick={handleClick} />
          </div>
        </div>


        <div class="flex-1 overflow-hidden flex">
          <Show when={editorMode() === "editor" || editorMode() === "split"}>
            <div class={editorMode() === "split" ? "w-1/2 border-r border-gray-200" : "w-full"}>
              <div class="flex-1 relative min-w-0 h-full">
                <MarkdownEditor />
              </div>
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