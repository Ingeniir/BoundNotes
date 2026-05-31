import { For, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { notes, activeNote, openNote, newNote, loading, restoreNote, deleteNote, searchNotes, cancelSearch, trashActiveNote, notebooks } from "@stores/notesStore";
import { activeSidebarId, sidebarView, setSearchQuery, showListNotes, setShowListNotes } from "@stores/uiStore";
import { clsx } from "clsx";
import { Motion, Presence } from "solid-motionone";
import { SquarePen, Search, Pin, ArrowDownZA, RotateCcw, Trash } from "lucide-solid";

export function NoteList() {
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let inputRef!: HTMLInputElement;

  const [contextMenu, setContextMenu] = createSignal<{ x: number, y: number, noteId: string } | null>(null);

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchNotes(value), 300);
  };

  onCleanup(() => {
    if (searchTimer) clearTimeout(searchTimer);

    cancelSearch();
  })

  const handleNewNote = async () => {
    const nbId = sidebarView() === "notebook" ? activeSidebarId() ?? undefined : undefined;
    await newNote(nbId);
    document.dispatchEvent(new CustomEvent("focus-note-title", { bubbles: true }));
  };

  const handleNoteClick = async (id: string) => {
    await openNote(id);
  }

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString(undefined, {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  const handleContextMenu = (e: MouseEvent, noteId: string) => {
    e.preventDefault();
    setContextMenu({
      x: e.clientX - 220,
      y: e.clientY,
      noteId
    });
  };

  const closeContextMenu = () => setContextMenu(null);

  onMount(() => {
    window.addEventListener("click", closeContextMenu);
    onCleanup(() => window.removeEventListener("click", closeContextMenu));
  });

  return (
    <Presence exitBeforeEnter>
      <Show when={showListNotes()}>
        <Motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20, transition: { duration: 0.15 } }} transition={{ duration: 0.3 }} class="w-72 shrink-0 h-full flex flex-col border-r border-gray-200 bg-white font-inter">

          {/* Header */}
          <div class="px-3 py-3 border-b border-gray-200 space-y-2">
            <div class={clsx("flex items-center", sidebarView() !== "all" ? "justify-between" : "justify-end")}>
              <Show when={sidebarView() !== "all"}>
                <span class="text-sm font-semibold text-gray-700">
                  {notes.length} note{notes.length !== 1 ? "s" : ""}
                </span>
              </Show>
              <div class="flex items-center gap-1">
                <Show when={sidebarView() !== "trash"}>
                  <button
                    onClick={handleNewNote}
                    class="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 p-0.5 rounded-md font-medium transition-colors duration-200 cursor-pointer"
                    title="New note"
                  >
                    <SquarePen size={16} />
                  </button>
                </Show>
                <Show when={sidebarView() !== "trash"}>
                  <button onClick={() => setShowListNotes(false)} class="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 p-0.5 rounded-md font-medium transition-colors duration-200 cursor-pointer">
                    <ArrowDownZA size={16} />
                  </button>
                </Show>
              </div>
            </div>
            {/* Recherche */}
            <Motion.div
              initial={{ opacity: 0, y: -10, transition: { duration: 0.5 } }}
              animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
              class="flex items-center gap-5 border border-gray-300 rounded-md bg-gray-50"
            >
              <span>
                <Search size={14} class="text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </span>
              <input
                ref={inputRef}
                type="search"
                placeholder="Search..."
                onInput={(e) => handleSearch(e.currentTarget.value)}
                class="w-full text-sm px-3 py-1.5 outline-none"
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
                    <Motion.button initial={{ scale: 1 }} hover={{ scale: 1.05 }} onClick={handleNewNote} class="relative text-blue-500 inline-block after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:rounded-md after:bg-current after:transition-all after:duration-500 hover:after:w-full">
                      Create a note
                    </Motion.button>
                  </div>
                </Show>
              }>
                <For each={notes}>
                  {(note, index) => (
                    <Motion.div
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0, transition: { delay: index() * 0.05 } }}
                      exit={{ opacity: 0, x: -10, transition: { duration: 0.2 } }}
                    >
                      <button
                        onContextMenu={(e) => handleContextMenu(e, note.id)}
                        onClick={() => handleNoteClick(note.id)}
                        class={clsx(
                          "relative w-full text-left px-4 py-3 border-b border-gray-200",
                          "hover:bg-gray-50 transition-colors",
                          activeNote()?.id === note.id && "bg-neutral-100 border-l-3 border-l-neutral-500"
                        )}
                      >
                        <div class="flex items-start justify-between gap-2">
                          <span class="flex items-center text-sm font-medium text-gray-900 leading-snug mb-3">
                            {note.is_pinned && <Pin size={14} class="text-red-500" />}
                            <div class={clsx(sidebarView() === "trash" && "line-through", "flex items-center gap-2")}>
                              <Show when={note.notebook_id && (sidebarView() === "all" || sidebarView() === "trash")}>
                                <span>
                                  {notebooks.find(nb => nb.id === note.notebook_id)?.name || ""}
                                </span>
                                <span class="h-0.5 bg-gray-300 w-3" />
                              </Show>
                              <span>
                                {note.title}
                              </span>
                            </div>
                          </span>
                        </div>
                        <Show when={note.excerpt}>
                          <p class="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {note.excerpt}
                          </p>
                        </Show>
                        <div class="text-xs text-gray-400 mt-1">
                          {note.word_count} word{note.word_count !== 0 ? "s" : ""}
                        </div>
                        <Show when={sidebarView() === "trash"}>
                          <Motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} class="absolute top-2 right-4">
                            <div class="relative flex items-center gap-2">
                              <button onClick={(e) => {
                                e.stopPropagation();
                                restoreNote(note.id)
                              }} class="text-neutral-300 hover:text-neutral-700 p-0.5 rounded-md font-medium transition-colors duration-200 cursor-pointer">
                                <RotateCcw size={16} />
                              </button>
                              <button onClick={(e) => {
                                e.stopPropagation();
                                deleteNote(note.id)
                              }} class="text-neutral-300 hover:text-red-500 p-0.5 rounded-md font-medium transition-colors duration-200 cursor-pointer">
                                <Trash size={16} />
                              </button>

                            </div>
                          </Motion.div>
                        </Show>
                        <div class="absolute bottom-2 right-4">
                          <span class="text-xs text-gray-400 shrink-0 mt-0.5">
                            {formatDate(note.updated_at)}
                          </span>
                        </div>
                      </button>
                    </Motion.div>
                  )}
                </For>
              </Show>
            </Show>
            <Show when={contextMenu()}>
              {(menu) => (
                <div
                  class="fixed z-9999 w-48 bg-white border border-gray-200 rounded-md shadow-xl py-1 text-sm text-gray-700"
                  style={{
                    top: `${menu().y}px`,
                    left: `${menu().x}px`,
                  }}
                  // On empêche le clic sur le menu lui-même de déclencher la fermeture globale (optionnel mais recommandé)
                  onClick={(e) => e.stopPropagation()}
                >
                  <Show when={sidebarView() !== "trash"} fallback={
                    <div class="w-full flex flex-col">
                      <button onClick={() => {
                        restoreNote(menu().noteId);
                        closeContextMenu();
                      }}>
                        <span class="w-full text-left px-4 py-2 hover:bg-gray-100 transition-colors flex items-center gap-2">
                          <RotateCcw size={16} />
                          Restaurer
                        </span>
                      </button>
                      <button onClick={() => {
                        deleteNote(menu().noteId);
                        closeContextMenu();
                      }}>
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
                        handleNoteClick(menu().noteId);
                        window.dispatchEvent(new Event("focus-note-title"));
                        closeContextMenu();
                      }}
                    >
                      Renommer
                    </button>
                    <button
                      class="w-full text-left px-4 py-2 text-red-600 hover:bg-red-50 transition-colors"
                      onClick={() => {
                        trashActiveNote(menu().noteId);
                        closeContextMenu();
                      }}
                    >
                      Corbeille
                    </button>
                  </Show>
                </div>
              )}
            </Show>
          </div>
        </Motion.div>
      </Show>
    </Presence >
  )
}