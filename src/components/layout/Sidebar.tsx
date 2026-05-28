import { For } from "solid-js";
import { notebooks, newNotebook } from "../../stores/notesStore";
import {
  sidebarView, setSidebarView,
  activeSidebarId, setActiveSidebarId,
  theme, toggleTheme,
} from "../../stores/uiStore";
import { loadNotes } from "../../stores/notesStore";
import { clsx } from "clsx";

export function Sidebar() {
  const handleNewNotebook = async () => {
    const name = prompt("Nom du carnet :");
    if (name?.trim()) await newNotebook(name.trim());
  };

  const selectAll = () => {
    setSidebarView("all");
    setActiveSidebarId(null);
    loadNotes();
  };

  const selectTrash = () => {
    setSidebarView("trash");
    setActiveSidebarId(null);
    loadNotes(undefined, true);
  };

  const selectNotebook = (id: string) => {
    setSidebarView("notebook");
    setActiveSidebarId(id);
    loadNotes(id);
  };

  return (
    <aside class="w-52 h-full flex flex-col bg-gray-50 border-r border-gray-200 select-none">

      {/* Logo / Titre */}
      <div class="px-4 py-4 border-b border-gray-200">
        <h1 class="text-base font-semibold text-gray-900">BoundNotes</h1>
      </div>

      {/* Navigation principale */}
      <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">

        {/* Toutes les notes */}
        <SidebarItem
          label="Toutes les notes"
          icon="📝"
          active={sidebarView() === "all"}
          onClick={selectAll}
        />

        {/* Carnets */}
        <div class="pt-3 pb-1 px-2">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Carnets
            </span>
            <button
              onClick={handleNewNotebook}
              class="text-gray-400 hover:text-gray-600 text-lg leading-none"
              title="Nouveau carnet"
            >
              +
            </button>
          </div>
        </div>

        <For each={notebooks()}>
          {(nb) => (
            <SidebarItem
              label={nb.name}
              icon={nb.icon ?? "📒"}
              active={sidebarView() === "notebook" && activeSidebarId() === nb.id}
              onClick={() => selectNotebook(nb.id)}
            />
          )}
        </For>

        {/* Corbeille */}
        <div class="pt-3">
          <SidebarItem
            label="Corbeille"
            icon="🗑️"
            active={sidebarView() === "trash"}
            onClick={selectTrash}
          />
        </div>
      </nav>

      {/* Thème toggle en bas */}
      <div class="px-4 py-3 border-t border-gray-200">
        <button
          onClick={toggleTheme}
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          {theme() === "light" ? "🌙 Dark" : "☀️ Light"}
        </button>
      </div>
    </aside>
  );
}

// Sous-composant item sidebar
function SidebarItem(props: {
  label: string;
  icon: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={props.onClick}
      class={clsx(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
        props.active
          ? "bg-blue-100 text-blue-700 font-medium"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <span class="text-base">{props.icon}</span>
      <span class="truncate">{props.label}</span>
    </button>
  );
}