import { For, Show, type JSX } from "solid-js";
import { notebooks, newNotebook, removeNotebook, loadNotes } from "@stores/notesStore";
import {
  sidebarView, setSidebarView,
  activeSidebarId, setActiveSidebarId,
  theme, toggleTheme,
  showListNotes, setShowListNotes
} from "@stores/uiStore";
import { clsx } from "clsx";
import { Motion, Presence } from "solid-motionone";
import { FileText, Trash, Sun, Moon, Plus, PanelRightDashed } from "lucide-solid";

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
    <aside class="w-52 shrink-0 h-full flex flex-col bg-gray-50 border-r border-gray-200 select-none font-inter">

      {/* Header */}
      <div class="flex justify-between items-center px-4 py-4 border-b border-gray-200">
        <h1 class="text-base font-semibold text-gray-900 font-roboto-slab">BoundNotes</h1>
        <Presence>
          <Show when={!showListNotes()}>
            <Motion.button
              onClick={() => setShowListNotes(true)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: 288 }}
              class="text-gray-500 hover:text-gray-900 hover:bg-gray-200 p-0.5 rounded-md font-medium transition-colors duration-200 cursor-pointer"
              title="Afficher la liste des notes"
            >
              <PanelRightDashed size={16} />
            </Motion.button>
          </Show>
        </Presence>
      </div>

      {/* Navigation principale */}
      <Motion.nav initial={{ opacity: 0 }} animate={{ opacity: 1 }} class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">

        {/* Toutes les notes */}
        <SidebarItem
          label="Toutes les notes"
          icon={<FileText class="text-black" size={18} />}
          active={sidebarView() === "all"}
          onClick={selectAll}
        />

        {/* Carnets */}
        <div class="pt-3 pb-1 px-2">
          <div class="flex items-center justify-between group">
            <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider group-hover:text-gray-600 transition-colors duration-200">
              Carnets
            </span>
            <button
              onClick={handleNewNotebook}
              class="text-gray-400 group-hover:text-gray-600 text-lg leading-none transition-colors duration-200"
              title="Nouveau carnet"
            >
              <Plus size={16} />
            </button>
          </div>
        </div>

        <For each={notebooks}>
          {(nb) => (
            <SidebarItem
              label={nb.name}
              icon={nb.icon ?? "📒"}
              active={sidebarView() === "notebook" && activeSidebarId() === nb.id}
              onClick={() => selectNotebook(nb.id)}
              notebook_id={nb.id}
            />
          )}
        </For>

        {/* Corbeille */}
        <div class="pt-3">
          <SidebarItem
            label="Corbeille"
            icon={<Trash class="text-red-400" size={18} />}
            active={sidebarView() === "trash"}
            onClick={selectTrash}
          />
        </div>
      </Motion.nav>

      {/* Thème toggle en bas */}
      <div class="px-4 py-3 border-t border-gray-200">
        <button
          onClick={toggleTheme}
          class="text-sm text-gray-500 hover:text-gray-900 transition-colors"
        >
          {theme() === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </aside>
  );
}

// Sous-composant item sidebar
function SidebarItem(props: {
  label: string;
  icon: JSX.Element | string;
  active: boolean;
  onClick: () => void;
  notebook_id?: string;
}) {
  return (
    <button
      onClick={props.onClick}
      class={clsx(
        "w-full flex justify-between items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
        props.active
          ? props.label === "Corbeille"
            ? "bg-red-50 text-red-700 font-medium"
            : "bg-gray-200 text-black font-medium"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <div class="flex items-center gap-2">
        <span class="text-base">{props.icon}</span>
        <span class="truncate">{props.label}</span>
      </div>
      <div class="flex items-center">
        {props.notebook_id && (
          <button onClick={(e) => {
            e.stopPropagation();
            removeNotebook(props.notebook_id!);
          }}>
            <Trash size={13} class="text-gray-400 hover:text-red-500 transition-colors" />
          </button>
        )}
      </div>
    </button>
  );
}