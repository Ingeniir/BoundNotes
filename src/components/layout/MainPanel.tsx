import { createSignal, onCleanup, onMount, Show } from "solid-js";
import { activeNote, trashActiveNote } from "@stores/notesStore";
import { editorMode, setEditorMode, setTooltip } from "@stores/uiStore";
import { MarkdownEditor } from "../editor/MarkdownEditor";
import { MarkdownPreview } from "../editor/MarkdownPreview";
import { IconButton } from "../ui/IconButton";
import { useAutoSave } from "../../hooks/useAutoSave";
import { PencilLine, Eye, Columns2 } from "lucide-solid";
import { Motion, Presence } from "solid-motionone";

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

  return (
    <div class="flex-1 min-w-0 h-full flex flex-col overflow-hidden">

      <Show
        when={activeNote()}
        fallback={<EmptyState />}
      >
        {/* Toolbar */}
        <div class="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white shrink-0">
          {/* Titre */}
          <input
            type="text"
            ref={titleInputRef}
            value={activeNote()?.title ?? ""}
            onInput={(e) => schedule({ title: e.currentTarget.value })}
            class="text-base font-semibold text-gray-900 bg-transparent border-none
                   outline-none flex-1 mr-4 placeholder-gray-400"
            placeholder="Sans titre"
          />

          {/* Mode buttons */}
          <div class="flex items-center gap-1">
            <Show when={editorMode() !== "preview"} fallback={
              <IconButton
                label="Éditeur"
                onClick={() => {
                  if (editorMode() === "split") {
                    handleClick("Mode édition activé");
                    setEditorMode("editor");
                  } else {
                    setEditorMode("preview");
                  }
                  setEditorMode("editor")
                }}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
              >
                <Presence exitBeforeEnter>
                  <Show when={hover() && editorMode() !== "split"} fallback={
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{
                      opacity: 0, transition: {
                        duration: 0.1
                      }
                    }}>
                      <Eye size={16} />
                    </Motion.div>
                  }>
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{
                      opacity: 0, transition: {
                        duration: 0.1
                      }
                    }}>
                      <PencilLine size={16} />
                    </Motion.div>
                  </Show>
                </Presence>
              </IconButton>
            }>
              <IconButton
                label="Rendu"
                onClick={() => {
                  if (editorMode() === "split") {
                    handleClick("Mode rendu activé");
                    setEditorMode("preview");
                  } else {
                    setEditorMode("editor");
                  }
                }}
                onMouseEnter={() => setHover(true)}
                onMouseLeave={() => setHover(false)}
              >
                <Presence exitBeforeEnter>
                  <Show when={hover() && editorMode() !== "split"} fallback={
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{
                      opacity: 0, transition: {
                        duration: 0.1
                      }
                    }}>
                      <PencilLine size={16} />
                    </Motion.div>
                  }>
                    <Motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{
                      opacity: 0, transition: {
                        duration: 0.1
                      }
                    }}>
                      <Eye size={16} />
                    </Motion.div>
                  </Show>
                </Presence>
              </IconButton>
            </Show>
            <IconButton
              label="Split"
              active={editorMode() === "split"}
              onClick={() => setEditorMode("split")}
            >
              <Columns2 size={16} />
            </IconButton>
          </div>
        </div>

        {/* Zone éditeur */}
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