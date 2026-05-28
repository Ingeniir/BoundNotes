import { For, Show } from "solid-js";
import { notes, activeNote, openNote, newNote, loading } from "../../stores/notesStore";
import { activeSidebarId, sidebarView, searchQuery, setSearchQuery } from "../../stores/uiStore";
import { searchQuery as searchNotes } from "../../stores/notesStore";
import { clsx } from "clsx";

export function NoteList() {
  let searchTimer: ReturnType<typeof setTimeout>;

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => searchNotes(value), 300);
  };

  const handleNewNote = () => {
    const nbId = sidebarView() === "notebook" ? activeSidebarId() ?? undefined : undefined;
    newNote(nbId);
  };

  const formatDate = (ms: number) => {
    return new Date(ms).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
  };

  return (
    <div class="w-72 h-full flex flex-col border-r border-gray-200 bg-white">

      {/* Header */}
      <div class="px-3 py-3 border-b border-gray-200 space-y-2">
        <div class="flex items-center justify-between">
          <span class="text-sm font-semibold text-gray-700">
            {notes().length} note{notes().length !== 1 ? "s" : ""}
          </span>
          <button
            onClick={handleNewNote}
            class="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            + Nouvelle
          </button>
        </div>

        {/* Recherche */}
        <input
          type="search"
          placeholder="Rechercher..."
          value={searchQuery()}
          onInput={(e) => handleSearch(e.currentTarget.value)}
          class="w-full text-sm px-3 py-1.5 rounded-md border border-gray-200
                 bg-gray-50 placeholder-gray-400 focus:outline-none
                 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Liste */}
      <div class="flex-1 overflow-y-auto">
        <Show when={!loading()} fallback={
          <div class="flex items-center justify-center h-20 text-sm text-gray-400">
            Chargement...
          </div>
        }>
          <Show when={notes().length > 0} fallback={
            <div class="flex flex-col items-center justify-center h-32 text-sm text-gray-400 gap-2">
              <span>Aucune note</span>
              <button onClick={handleNewNote} class="text-blue-600 hover:underline">
                Créer une note
              </button>
            </div>
          }>
            <For each={notes()}>
              {(note) => (
                <button
                  onClick={() => openNote(note.id)}
                  class={clsx(
                    "w-full text-left px-4 py-3 border-b border-gray-100",
                    "hover:bg-gray-50 transition-colors",
                    activeNote()?.id === note.id && "bg-blue-50 border-l-2 border-l-blue-500"
                  )}
                >
                  <div class="flex items-start justify-between gap-2">
                    <span class="text-sm font-medium text-gray-900 truncate leading-snug">
                      {note.is_pinned ? "📌 " : ""}{note.title}
                    </span>
                    <span class="text-xs text-gray-400 shrink-0 mt-0.5">
                      {formatDate(note.updated_at)}
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
                </button>
              )}
            </For>
          </Show>
        </Show>
      </div>
    </div>
  );
}