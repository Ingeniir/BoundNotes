import { createEffect, createSignal, onCleanup, onMount, Show, For } from "solid-js";
import { activeNote, addTagToNote, removeTagFromNote, tags } from "@stores/notesStore";
import { editorMode, setTooltip } from "@stores/uiStore";
import { MarkdownEditor } from "../editor/MarkdownEditor";
import { MarkdownPreview } from "../editor/MarkdownPreview";
import { useAutoSave } from "../../hooks/useAutoSave";
import { ModeSelector } from "@components/ui/modeSelector";
import { getRandomCitation } from "@lib/citation";
import { tagColor } from "@utils/colorTag";
import { Tag, Trash } from "lucide-solid";
import { clsx } from "clsx";

export function MainPanel() {
  const { schedule } = useAutoSave(() => activeNote()?.id);
  const [valueTag, setValueTag] = createSignal<string>("");
  const [errorValueTag, setErrorValueTag] = createSignal<boolean>(false);

  // Signal pour gérer l'ouverture du modal de tags
  const [isTagMenuOpen, setIsTagMenuOpen] = createSignal(false);

  // Scroll
  const [scrollRatio, setScrollRatio] = createSignal<number>(0);

  let titleInputRef!: HTMLInputElement;
  let tagInputRef!: HTMLInputElement;

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

  // Focus automatique sur l'input quand on ouvre le menu
  createEffect(() => {
    if (isTagMenuOpen() && tagInputRef) {
      setTimeout(() => tagInputRef.focus(), 50);
    }
  });

  const handleAddTag = async () => {
    const note = activeNote();
    if (valueTag().trim() !== "" && note?.id) {
      try {
        await addTagToNote(note.id, valueTag().trim(), tagColor(valueTag().trim()));
        setValueTag(""); // On vide l'input après ajout
      } catch (error) {
        console.error("Error adding tag to note:", error);
      }
    }
  }

  const handleRemoveTag = async (tagId: string) => {
    const note = activeNote();
    if (note?.id) {
      try {
        await removeTagFromNote(note.id, tagId);
      } catch (error) {
        console.error("Error removing tag from note:", error);
      }
    }
  }

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
          </div>

          <div class="relative flex items-center tooltip tooltip-bottom" data-tip={activeNote()?.tags && activeNote().tags.length > 0 ? activeNote()?.tags.length : "No tags"}>
            <button
              onClick={() => setIsTagMenuOpen(!isTagMenuOpen())}
              class="flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
              title="Gérer les tags"
            >
              <Tag size={16} />
            </button>

            <Show when={isTagMenuOpen()}>
              <div
                class="fixed inset-0 z-10"
                onClick={() => setIsTagMenuOpen(false)}
              />

              <div class="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 shadow-xl rounded-lg z-20 p-3 flex flex-col gap-3 origin-top-right">

                <div class="flex flex-wrap gap-1.5 overflow-y-auto">
                  <Show
                    when={activeNote()?.tags && activeNote().tags.length > 0}
                    fallback={<span class="text-xs text-gray-400 italic">No tags active</span>}
                  >
                    <span class="text-lg font-medium text-gray-700">Tags actifs: </span>
                    <For each={activeNote().tags.filter((tag, i, arr) =>
                      arr.findIndex(t => t.id === tag.id) === i
                    )}>
                      {(tag) => (
                        <span
                          key={tag.id}
                          class="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium text-white shadow-sm"
                          style={{ "background-color": tag.color || "#e5e7eb" }}
                        >
                          {tag.name || tag}
                          <button onClick={() => void handleRemoveTag(tag.id)}>
                            <Trash size={12} class="text-white" />
                          </button>
                        </span>
                      )}
                    </For>
                  </Show>
                </div>

                <div class="relative">
                  <div class="flex items-center gap-2 border border-gray-300 rounded-md px-2 py-1">
                    <Tag size={14} class="text-gray-500" />
                    <input
                      ref={tagInputRef}
                      type="text"
                      placeholder="Nouveau tag..."
                      class={clsx("w-full text-sm outline-none transition-all", errorValueTag() ? "border-red-500" : "border-transparent")}
                      value={valueTag()}
                      onInput={(e) => {
                        setValueTag(e.currentTarget.value);

                        if (tags.filter(t => t.name.toLowerCase() === e.currentTarget.value.toLowerCase()).length > 0) {
                          setErrorValueTag(true);
                        } else {
                          setErrorValueTag(false);
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (valueTag().trim() !== "") void handleAddTag();
                        } else if (e.key === "Escape") {
                          setIsTagMenuOpen(false);
                        }
                      }}
                    />
                  </div>
                </div>
                <div class="flex flex-wrap gap-1.5 overflow-y-auto">
                  <span class="text-lg font-medium text-gray-700">Tags disponibles: </span>
                  <For each={tags}>
                    {(tag) => (
                      <div
                        class="flex items-center px-2 py-0.5 rounded-full text-xs font-medium text-white shadow-sm cursor-pointer"
                        style={{ "background-color": tag.color || "#e5e7eb" }}
                        onClick={() => {
                          setValueTag(tag.name);
                          tagInputRef.focus();
                        }}
                      >
                        {tag.name}
                      </div>
                    )}
                  </For>
                </div>
              </div>
            </Show>
          </div>

          <div class="flex items-center ml-4">
            <ModeSelector handleClick={handleClick} />
          </div>
        </div>

        <div class="flex-1 overflow-hidden flex">
          <Show when={editorMode() === "editor" || editorMode() === "split"}>
            <div class={editorMode() === "split" ? "w-1/2 border-r border-gray-200" : "w-full"}>
              <div class="flex-1 relative min-w-0 h-full">
                <MarkdownEditor onScroll={setScrollRatio} />
              </div>
            </div>
          </Show>
          <Show when={editorMode() === "preview" || editorMode() === "split"}>
            <div class={editorMode() === "split" ? "w-1/2" : "w-full"}>
              <MarkdownPreview scrollRatio={scrollRatio} />
            </div>
          </Show>
        </div>
      </Show>
    </div>
  );
}

function EmptyState() {
  return (
    <div class="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
      <p class="text-lg font-roboto-slab border-t border-b border-gray-200 py-2 px-4">{getRandomCitation()}</p>
    </div>
  );
}