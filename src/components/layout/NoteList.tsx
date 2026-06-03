import { For, Show, createMemo, createSignal, onCleanup, onMount, type JSX } from "solid-js";
import { notes, activeNote, openNote, newNote, loading, restoreNote, deleteNote, searchNotes, cancelSearch, trashActiveNote, notebooks, togglePin } from "@stores/notesStore";
import { activeSidebarId, sidebarView, setSearchQuery, showListNotes, showSidebar, setShowSidebar } from "@stores/uiStore";
import { clsx } from "clsx";
import { Motion, Presence } from "solid-motionone";
import { TransitionGroup } from "solid-transition-group";
import { SquarePen, Search, Pin, ArrowDownAZ, RotateCcw, Trash, Tag, Menu } from "lucide-solid";
import { Notebook } from "@types/index";


export function NoteList() {
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let inputRef!: HTMLInputElement;

  const [contextMenu, setContextMenu] = createSignal<{ x: number, y: number, noteId: string } | null>(null);
  const [showModalSort, setShowModalSort] = createSignal<boolean>(false);
  const [isReversed, setIsReversed] = createSignal<boolean>(false);
  const [modeSort, setModeSort] = createSignal<"title" | "date" | "updated">("title");

  const SidebarViewConditions = sidebarView() === "notebook" || sidebarView() === "all" || sidebarView() === "pinned";

  const notebookMap = createMemo(() => {
    const map = new Map<string, Notebook>();
    for (const nb of notebooks) {
      map.set(nb.id, nb);
    }
    return map;
  });

  const getNotebookPath = (notebookId: string): string => {
    const map = notebookMap();
    const parts: string[] = [];

    let current = map.get(notebookId);
    let depth = 0;

    while (current && depth < 10) {
      parts.unshift(current.name);
      current = current.parent_id ? map.get(current.parent_id) : undefined;
      depth++;
    }

    return parts.join(" / ");
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => { void searchNotes(value) }, 300);
  };

  onCleanup(() => {
    if (searchTimer) clearTimeout(searchTimer);
    cancelSearch();
  });

  const handleNewNote = async () => {
    const nbId = sidebarView() === "notebook" ? activeSidebarId() ?? undefined : undefined;
    await newNote(nbId);
    document.dispatchEvent(new CustomEvent("focus-note-title", { bubbles: true }));
  };

  const handleContextMenu = (e: MouseEvent, noteId: string) => {
    e.preventDefault();
    setContextMenu({ x: e.clientX - 220, y: e.clientY, noteId });
  };

  const closeContextMenu = () => setContextMenu(null);

  onMount(() => {
    window.addEventListener("click", closeContextMenu);
    onCleanup(() => window.removeEventListener("click", closeContextMenu));
  });

  const sortedNotes = createMemo(() => {
    const list = Array.from(notes);
    const mode = modeSort();
    const reversed = isReversed();

    return list.sort((a, b) => {
      let comparison = 0;

      if (mode === "title") {
        comparison = a.title.localeCompare(b.title);
      } else if (mode === "date") {
        comparison = b.created_at - a.created_at; // Par défaut : Récent -> Ancien
      } else if (mode === "updated") {
        comparison = b.updated_at - a.updated_at; // Par défaut : Récent -> Ancien
      }

      // Inversion
      return reversed ? -comparison : comparison;
    });
  });

  return (
    <Presence exitBeforeEnter>
      <Show when={showListNotes()}>
        <Motion.div
          initial={{ opacity: 0, width: "0px" }}
          animate={{ opacity: 1, width: "288px" }}
          exit={{ opacity: 0, width: "0px" }}
          transition={{ duration: 0.3, easing: "ease-in-out" }}
          class="w-72 shrink-0 h-full flex flex-col border-r border-gray-200 bg-white font-inter overflow-hidden"
        >
          {/* Header */}
          <div class="px-3 py-3 border-b border-gray-200 space-y-2">
            <div class={clsx("flex items-center", !showSidebar() ? "justify-between" : "justify-end")}>
              <Show when={!showSidebar()}>
                <button onClick={() => { void setShowSidebar(true); }} class="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 p-0.5 rounded-md font-medium transition-colors cursor-pointer" title="New note">
                  <Menu size={16} />
                </button>
              </Show>
              <div class="flex items-center gap-1">
                <Show when={sidebarView() !== "trash"}>
                  <button onClick={() => { void handleNewNote(); }} class="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 p-0.5 rounded-md font-medium transition-colors cursor-pointer" title="New note">
                    <SquarePen size={16} />
                  </button>
                  <button
                    onClick={() => setShowModalSort(!showModalSort())}
                    class={clsx(
                      "text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 p-0.5 rounded-md font-medium transition-colors cursor-pointer",
                      showModalSort() && "bg-neutral-100 hover:bg-neutral-300"
                    )}
                    popoverTarget="popover-1"
                    style={{ anchorName: "--anchor-1" }}
                  >
                    <ArrowDownAZ size={16} />
                  </button>

                  <ul
                    class="dropdown menu w-64 rounded-box bg-base-100 shadow-sm"
                    popover="auto"
                    id="popover-1"
                    ontoggle={(e) => setShowModalSort(e.newState === "open")}
                    style={{ positionAnchor: "--anchor-1" }}
                  >
                    <ButtonModalSort active={modeSort() === "title" && !isReversed()} onClick={() => setModeSort("title")} setIsReversed={setIsReversed}>
                      Sort by Title (A-Z)
                    </ButtonModalSort>
                    <ButtonModalSort active={modeSort() === "title" && isReversed()} onClick={() => setModeSort("title")} setIsReversed={setIsReversed} reversed>
                      Sort by Title (Z-A)
                    </ButtonModalSort>
                    <ButtonModalSort active={modeSort() === "date" && !isReversed()} onClick={() => setModeSort("date")} setIsReversed={setIsReversed}>
                      Sort by Date (New - Old)
                    </ButtonModalSort>
                    <ButtonModalSort active={modeSort() === "date" && isReversed()} onClick={() => setModeSort("date")} setIsReversed={setIsReversed} reversed>
                      Sort by Date (Old - New)
                    </ButtonModalSort>
                    <ButtonModalSort active={modeSort() === "updated" && !isReversed()} onClick={() => setModeSort("updated")} setIsReversed={setIsReversed}>
                      Sort by Updated (New - Old)
                    </ButtonModalSort>
                    <ButtonModalSort active={modeSort() === "updated" && isReversed()} onClick={() => setModeSort("updated")} setIsReversed={setIsReversed} reversed>
                      Sort by Updated (Old - New)
                    </ButtonModalSort>
                  </ul>
                </Show>
              </div>
            </div>

            {/* Recherche */}
            <Motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              class="relative flex items-center border border-gray-300 rounded-md bg-gray-50 pl-8 pr-3"
            >
              <Search size={14} class="text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={inputRef}
                type="search"
                placeholder="Search..."
                onInput={(e) => handleSearch(e.currentTarget.value)}
                class="w-full text-sm py-1.5 outline-none bg-transparent"
              />
            </Motion.div>
          </div>

          {/* Liste */}
          <div class="flex-1 overflow-y-auto">
            <Show when={!loading()} fallback={
              <div class="flex items-center justify-center h-20 text-sm text-gray-400">
                <span class="loading loading-dots loading-xl"></span>
              </div>
            }>
              <Show when={notes.length > 0} fallback={
                <Show when={sidebarView() !== "trash"} fallback={
                  <div class="h-full flex flex-col items-center justify-center text-sm text-gray-400 gap-2">
                    <span>No notes found in the trash</span>
                  </div>
                }>
                  <div class="flex flex-col items-center justify-center h-32 text-sm text-gray-400 gap-2">
                    <span>No notes found</span>
                    <Motion.button initial={{ scale: 1 }} hover={{ scale: 1.05 }} onClick={() => { void handleNewNote(); }} class="text-blue-500 relative cursor-pointer">
                      Create a note
                    </Motion.button>
                  </div>
                </Show>
              }>
                <TransitionGroup
                  onEnter={(el, done) => {
                    void el.animate([
                      { opacity: 0, transform: "translateX(-10px)" },
                      { opacity: 1, transform: "translateX(0)" }
                    ], { duration: 200 }).finished.then(done);
                  }}
                  onExit={(el, done) => {
                    void el.animate([
                      { opacity: 1, transform: "translateX(0)" },
                      { opacity: 0, transform: "translateX(-10px)" }
                    ], { duration: 150 }).finished.then(done);
                  }}
                >
                  <For each={sortedNotes()}>
                    {(note) => (
                      <div>
                        <button
                          onContextMenu={(e) => handleContextMenu(e, note.id)}
                          onClick={() => { void openNote(note.id); }}
                          class={clsx(
                            "relative w-full text-left px-4 py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors",
                            activeNote()?.id === note.id && "bg-neutral-100 border-l-3 border-l-neutral-500"
                          )}
                        >
                          <div class="flex items-start justify-between gap-2">
                            <span class="flex items-center text-sm font-medium text-gray-900 leading-snug mb-3">
                              {note.is_pinned && <Pin size={14} class="text-blue-500 mr-1" />}
                              <div class={clsx(sidebarView() === "trash" && "line-through", "flex items-center gap-2")}>
                                {/* O(1) Access via Map */}
                                <Show when={note.notebook_id && SidebarViewConditions}>
                                  <span class="text-xs text-gray-400 font-normal">
                                    {getNotebookPath(note.notebook_id ? note.notebook_id : "") || ""}
                                  </span>
                                  <span class="h-0.5 bg-gray-300 w-2" />
                                </Show>
                                <span>{note.title}</span>
                              </div>
                            </span>
                          </div>

                          {note.excerpt && (
                            <p class="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed mb-2">
                              {note.excerpt}
                            </p>
                          )}

                          <Show when={note.tags && note.tags.length > 0}>
                            <div class="flex flex-wrap gap-1 mt-1.5 mb-2">
                              <For each={note.tags}>
                                {(tag) => (
                                  <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-neutral-100 opacity-90" style={{ color: tag.color ?? "#374151" }}>
                                    <Tag size={10} class="mr-0.5" />
                                    {tag.name}
                                  </span>
                                )}
                              </For>
                            </div>
                          </Show>

                          <div class="text-xs text-gray-400 flex justify-between items-center mt-1">
                            <span>{note.word_count} word{note.word_count !== 1 ? "s" : ""}</span>
                            <span>{new Date(note.updated_at).toLocaleDateString()}</span>
                          </div>

                          <Show when={sidebarView() === "trash"}>
                            <div class="absolute top-2 right-4 flex items-center gap-2 bg-white/80 backdrop-blur-xs p-0.5 rounded-md shadow-xs">
                              <button onClick={(e) => { e.stopPropagation(); { void restoreNote(note.id); } }} class="text-neutral-500 hover:text-neutral-800 p-0.5 rounded-md transition-colors cursor-pointer">
                                <RotateCcw size={14} />
                              </button>
                              <button onClick={(e) => { e.stopPropagation(); { void deleteNote(note.id); } }} class="text-red-400 hover:text-red-600 p-0.5 rounded-md transition-colors cursor-pointer">
                                <Trash size={14} />
                              </button>
                            </div>
                          </Show>
                        </button>
                      </div>
                    )}
                  </For>
                </TransitionGroup>
              </Show>
            </Show>
          </div>

          <Show when={contextMenu()}>
            {(menu) => (
              <div
                class="fixed z-50 w-48 bg-white border border-gray-200 rounded-md shadow-xl py-1 text-sm text-gray-700"
                style={{
                  top: `${menu().y}px`,
                  left: `${menu().x}px`,
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <Show when={sidebarView() !== "trash"} fallback={
                  <div class="w-full flex flex-col">
                    <button onClick={() => { void restoreNote(menu().noteId); closeContextMenu(); }}>
                      <span class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2">
                        <RotateCcw size={16} />
                        Restaurer
                      </span>
                    </button>
                    <button onClick={() => { void deleteNote(menu().noteId); closeContextMenu(); }}>
                      <span class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2 text-red-600">
                        <Trash size={16} />
                        Supprimer
                      </span>
                    </button>
                  </div>
                }>
                  <button
                    class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      void openNote(menu().noteId);
                      window.dispatchEvent(new Event("focus-note-title"));
                      closeContextMenu();
                    }}
                  >
                    Renommer
                  </button>
                  <button
                    class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                    onClick={() => {
                      void trashActiveNote(menu().noteId);
                      closeContextMenu();
                    }}
                  >
                    Corbeille
                  </button>
                  <div class="border-t border-gray-200 my-1" />
                  <button
                    class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors"
                    onClick={() => {
                      const targetNote = notes.find(n => n.id === menu().noteId);
                      if (targetNote) {
                        void togglePin(targetNote.id, targetNote.is_pinned);
                      }
                      closeContextMenu();
                    }}
                  >
                    {notes.find(n => n.id === menu().noteId)?.is_pinned ? "Unpin" : "Pin"}
                  </button>
                </Show>
              </div>
            )}
          </Show>
        </Motion.div >
      </Show >
    </Presence >
  );
}


interface ButtonModalSortProps {
  children: JSX.Element;
  active?: boolean;
  reversed?: boolean;
  onClick?: () => void;
  setIsReversed: (reversed: boolean) => void;
}

function ButtonModalSort(props: ButtonModalSortProps) {
  return (
    <li
      class={clsx(
        "py-2 px-3 hover:bg-base-200 cursor-pointer text-sm font-medium transition-colors rounded-sm",
        props.active && "bg-base-200 text-neutral-900 font-semibold"
      )}
      onClick={() => {
        props.onClick?.();
        props.setIsReversed(!!props.reversed); // Évite le if/else superflu
      }}
    >
      {props.children}
    </li>
  );
}