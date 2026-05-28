import { For, Show, createEffect, createSignal, onCleanup, onMount } from "solid-js";
import { notes, activeNote, openNote, newNote, loading, restoreNote, deleteNote, searchNotes, cancelSearch, trashActiveNote } from "@stores/notesStore";
import { activeSidebarId, sidebarView, setSearchQuery, showListNotes, setShowListNotes } from "@stores/uiStore";
import { clsx } from "clsx";
import { Motion, Presence } from "solid-motionone";
import { FilePlus, Search, Pin, X, RotateCcw, Trash } from "lucide-solid";

export function NoteList() {
  let searchTimer: ReturnType<typeof setTimeout> | undefined;
  let inputRef!: HTMLInputElement;

  const [searchShow, setSearchShow] = createSignal<boolean>(false);
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

  createEffect(() => {
    if (searchShow()) {
      inputRef.focus();
    } else {
      setSearchQuery("");
    }
  });

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
            <div class="flex items-center justify-between">
              <span class="text-sm font-semibold text-gray-700">
                {notes.length} note{notes.length !== 1 ? "s" : ""}
              </span>
              <div class="flex items-center gap-1">
                <button
                  onClick={handleNewNote}
                  class="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 p-0.5 rounded-md font-medium transition-colors duration-200 cursor-pointer"
                  title="Nouvelle note"
                >
                  <FilePlus size={16} />
                </button>
                <button onClick={() => setSearchShow(!searchShow())} class="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 p-0.5 rounded-md font-medium transition-colors duration-200 cursor-pointer">
                  <Search size={16} />
                </button>
                <button onClick={() => setShowListNotes(false)} class="text-neutral-500 hover:text-neutral-800 hover:bg-neutral-200 p-0.5 rounded-md font-medium transition-colors duration-200 cursor-pointer">
                  <X size={16} />
                </button>
              </div>
            </div>
            {/* Recherche */}
            <Presence exitBeforeEnter>
              <Show when={searchShow()}>
                <Motion.input
                  initial={{ opacity: 0, y: -10, transition: { duration: 0.5 } }}
                  animate={{ opacity: 1, y: 0, transition: { duration: 0.5 } }}
                  exit={{ opacity: 0, y: -10, transition: { duration: 0.2 } }}
                  ref={inputRef}
                  type="search"
                  placeholder="Rechercher..."
                  onInput={(e) => handleSearch(e.currentTarget.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Escape") {
                      setSearchShow(false);
                    }
                  }}
                  onBlur={() => setSearchShow(false)}
                  class="w-full text-sm px-3 py-1.5 rounded-md border border-gray-200
                 bg-gray-50 placeholder-gray-400 focus:outline-none
                 focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                />
              </Show>
            </Presence>
          </div>

          {/* Liste */}
          <div class="flex-1 overflow-y-auto">
            <Show when={!loading()} fallback={
              <div class="flex items-center justify-center h-20 text-sm text-gray-400">
                Chargement...
              </div>
            }>
              <Show when={notes.length > 0} fallback={
                <Show when={sidebarView() !== "trash"} fallback={
                  <div class="h-full flex flex-col items-center justify-center text-sm text-gray-400 gap-2">
                    <span>Aucune note dans la corbeille</span>
                  </div>
                }>
                  <div class="flex flex-col items-center justify-center h-32 text-sm text-gray-400 gap-2">
                    <span>Aucune note</span>
                    <Motion.button initial={{ scale: 1 }} hover={{ scale: 1.05 }} onClick={handleNewNote} class="relative text-blue-500 inline-block after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:rounded-md after:bg-current after:transition-all after:duration-500 hover:after:w-full">
                      Créer une note
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
                      hover={{ scale: 1.02 }}
                    >
                      <button
                        onContextMenu={(e) => handleContextMenu(e, note.id)}
                        onClick={() => handleNoteClick(note.id)}
                        class={clsx(
                          "relative w-full text-left px-4 py-3 border-b border-gray-200",
                          "hover:bg-gray-50 transition-colors",
                          activeNote()?.id === note.id && "bg-neutral-100 border-l-2 border-l-neutral-500"
                        )}
                      >
                        <div class="flex items-start justify-between gap-2">
                          <span class="text-sm font-medium text-gray-900 truncate leading-snug">
                            {note.is_pinned && <Pin size={14} class="text-red-500" />}
                            <span class={clsx(sidebarView() === "trash" && "line-through")}>{note.title}</span>
                          </span>
                        </div>
                        <Show when={note.excerpt}>
                          <p class="text-xs text-gray-500 mt-1 line-clamp-2 leading-relaxed">
                            {note.excerpt}
                          </p>
                        </Show>
                        <div class="text-xs text-gray-400 mt-1">
                          {note.word_count} mot{note.word_count !== 1 ? "s" : ""}
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