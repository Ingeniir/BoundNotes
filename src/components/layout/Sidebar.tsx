import { For, Show, createSignal, createMemo, type JSX } from "solid-js";
import { notebooks, newNotebook, removeNotebook, loadNotes, lengthNotes, tags, loadNotesByTag, removeTag, loadPinnedNotes, lengthNotesPinned } from "@stores/notesStore";
import {
  sidebarView, setSidebarView,
  activeSidebarId, setActiveSidebarId,
  theme, toggleTheme,
  setActiveTagId
} from "@stores/uiStore";
import { buildNotebookTree } from "@lib/notebookTree";
import type { NotebookNode } from "../../types";
import { clsx } from "clsx";
import { Motion, Presence } from "solid-motionone";
import {
  FileText, Trash2, Trash, Moon, Sun, Plus,
  ChevronRight, Check, X,
  Folder,
  FolderOpen,
  Tag,
  Pin
} from "lucide-solid";
import Notebook from "lucide-solid/icons/notebook";
import { tagColor } from "@utils/colorTag";

export function Sidebar() {
  const tree = createMemo(() => buildNotebookTree(notebooks));

  return (
    <aside class="w-50 shrink-0 h-full flex flex-col bg-gray-50 border-r border-gray-200 select-none font-inter">

      {/* Navigation */}
      <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-0.5">

        <SidebarItem
          label="All notes"
          icon={<FileText size={16} />}
          active={sidebarView() === "all"}
          onClick={() => {
            setSidebarView("all");
            setActiveSidebarId(null);
            loadNotes();
          }}
          counter={lengthNotes()}
        />

        <SidebarItem
          label="Pinned"
          icon={<Pin size={16} />}
          active={sidebarView() === "pinned"}
          onClick={() => {
            setSidebarView("pinned");
            setActiveSidebarId(null);
            loadPinnedNotes();
          }}
          counter={lengthNotesPinned()}
        />

        {/* Section Carnets */}
        <NotebooksSection tree={tree()} />

        {/* Tags */}
        <div class="pt-3 pb-1 px-2">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Tags
          </span>
        </div>
        <Show when={tags.length > 0}>
          <For each={tags}>
            {(tag) => (
              <button
                onClick={() => {
                  setSidebarView("tag");
                  setActiveSidebarId(tag.id);
                  setActiveTagId(tag.id);
                  loadNotesByTag(tag.id);
                }}
                class={clsx(
                  "w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
                  sidebarView() === "tag" && activeSidebarId() === tag.id
                    ? "bg-gray-200 text-black font-medium"
                    : "text-gray-700 hover:bg-gray-100"
                )}
              >
                <div class="flex items-center gap-2">
                  <span
                    class="flex items-center w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ "background-color": tag.color ?? "#e5e7eb" }}
                  />
                  <span class="truncate">{tag.name}</span>
                </div>
                <span>
                  <Trash
                    size={12}
                    class="text-gray-400 hover:text-red-500 transition-colors" onClick={(e) => {
                      e.stopPropagation();
                      if (tag.id) {
                        setActiveTagId(tag.id);
                        removeTag(tag.id);
                      }
                    }}
                  />
                </span>
              </button>
            )}
          </For>
        </Show>

        {/* Corbeille */}
        <div class="pt-2">
          <SidebarItem
            label="Trash"
            icon={<Trash2 size={16} class="text-red-400" />}
            active={sidebarView() === "trash"}
            onClick={() => {
              setSidebarView("trash");
              setActiveSidebarId(null);
              loadNotes(undefined, true);
            }}
          />
        </div>

      </nav>

      {/* Thème */}
      <div class="px-4 py-3 border-t border-gray-200">
        <button onClick={toggleTheme} class="text-sm text-gray-500 hover:text-gray-900 transition-colors">
          {theme() === "light" ? <Moon size={16} /> : <Sun size={16} />}
        </button>
      </div>
    </aside >
  );
}

// ── Section carnets avec header ────────────────────────
function NotebooksSection(props: { tree: NotebookNode[] }) {
  const [isCreating, setIsCreating] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  let inputRef!: HTMLInputElement;

  const startCreating = () => {
    setNewName("");
    setIsCreating(true);
    setTimeout(() => inputRef?.focus(), 50);
  };

  const confirmCreate = async () => {
    const name = newName().trim();
    if (name) await newNotebook(name);
    setIsCreating(false);
    setNewName("");
  };

  const cancelCreate = () => {
    setIsCreating(false);
    setNewName("");
  };

  return (
    <>
      <div class="pt-3 pb-1 px-2">
        <div class="flex items-center justify-between group">
          <span class="text-xs font-semibold text-gray-400 uppercase tracking-wider
                        group-hover:text-gray-600 transition-colors duration-200">
            Notebooks
          </span>
          <button
            onClick={startCreating}
            class="text-gray-400 group-hover:text-gray-600 transition-colors duration-200"
            title="New notebook"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Input création racine */}
      <Presence exitBeforeEnter>
        <Show when={isCreating()}>
          <Motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            class="px-1 pb-1"
          >
            <NotebookInput
              ref={inputRef}
              value={newName()}
              onInput={setNewName}
              onConfirm={confirmCreate}
              onCancel={cancelCreate}
              depth={0}
            />
          </Motion.div>
        </Show>
      </Presence>

      {/* Arbre récursif */}
      <For each={props.tree}>
        {(node) => <NotebookTreeItem node={node} depth={0} />}
      </For>
    </>
  );
}

// ── Item récursif ──────────────────────────────────────
function NotebookTreeItem(props: { node: NotebookNode; depth: number }) {
  const [expanded, setExpanded] = createSignal(true);
  const [isCreatingChild, setIsCreatingChild] = createSignal(false);
  const [newName, setNewName] = createSignal("");
  let inputRef!: HTMLInputElement;

  const hasChildren = () => props.node.children.length > 0 || isCreatingChild();
  const isActive = () =>
    sidebarView() === "notebook" && activeSidebarId() === props.node.id;

  const handleClick = () => {
    setSidebarView("notebook");
    setActiveSidebarId(props.node.id);
    loadNotes(props.node.id);
  };

  const startCreatingChild = (e: MouseEvent) => {
    e.stopPropagation();
    setExpanded(true);
    setIsCreatingChild(true);
    setNewName("");
    setTimeout(() => inputRef?.focus(), 50);
  };

  const confirmCreateChild = async () => {
    const name = newName().trim();
    if (name) await newNotebook(name, props.node.id);
    setIsCreatingChild(false);
    setNewName("");
  };

  const cancelCreateChild = () => {
    setIsCreatingChild(false);
    setNewName("");
  };

  // Indentation selon la profondeur
  const indent = () => props.depth * 12;

  return (
    <div>
      {/* Ligne du notebook */}
      <div
        class={clsx(
          "group flex items-center gap-1 px-2 py-1.5 rounded-md text-sm transition-colors cursor-pointer",
          isActive()
            ? "bg-gray-200 text-black font-medium"
            : "text-gray-700 hover:bg-gray-100"
        )}
        style={{ "padding-left": `${8 + indent()}px` }}
        onClick={handleClick}
      >
        {/* Chevron expand/collapse */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren()) setExpanded(v => !v);
          }}
          class={clsx(
            "shrink-0 transition-transform duration-200 text-gray-400",
            !hasChildren() && "invisible",
            expanded() && "rotate-90"
          )}
        >
          <ChevronRight size={13} />
        </button>

        {/* Icône + nom */}
        <span class="text-sm shrink-0">
          {props.node.icon ?? (props.node.children.length > 0 ? (expanded() ? <FolderOpen size={14} class="text-gray-400" /> : <Folder size={14} class="text-gray-400" />) : <Notebook size={14} class="text-gray-400" />)}
        </span>
        <span class="truncate flex-1">{props.node.name}</span>

        {/* Actions (visibles au hover) */}
        <div class="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
          <button
            onClick={startCreatingChild}
            title="Ajouter un sous-carnet"
            class="p-0.5 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
          >
            <Plus size={12} />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeNotebook(props.node.id);
            }}
            title="Supprimer"
            class="p-0.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
          >
            <Trash size={12} />
          </button>
        </div>
      </div>

      {/* Enfants + input création */}
      <Show when={expanded() && hasChildren()}>
        <div class="relative">
          {/* Ligne verticale de branche */}
          <div
            class="absolute top-0 bottom-0 w-px bg-gray-200"
            style={{ left: `${16 + indent()}px` }}
          />

          {/* Input création enfant */}
          <Presence exitBeforeEnter>
            <Show when={isCreatingChild()}>
              <Motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                class="px-1"
                style={{ "padding-left": `${8 + indent() + 12}px` }}
              >
                <NotebookInput
                  ref={inputRef}
                  value={newName()}
                  onInput={setNewName}
                  onConfirm={confirmCreateChild}
                  onCancel={cancelCreateChild}
                  depth={props.depth + 1}
                />
              </Motion.div>
            </Show>
          </Presence>

          {/* Enfants récursifs */}
          <For each={props.node.children}>
            {(child) => <NotebookTreeItem node={child} depth={props.depth + 1} />}
          </For>
        </div>
      </Show>
    </div>
  );
}

// ── Input de création réutilisable ─────────────────────
function NotebookInput(props: {
  ref: HTMLInputElement;
  value: string;
  onInput: (v: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
  depth: number;
}) {

  let confirmed: boolean = false;

  const handleConfirm = () => {
    if (confirmed) return;
    confirmed = true;
    props.onConfirm();
  };

  const handleCancel = () => {
    if (confirmed) return;
    confirmed = true;
    props.onCancel();
  }

  return (
    <div class="flex items-center gap-1 px-2 py-1 rounded-md bg-white border border-gray-200 shadow-sm">
      <span class="text-sm shrink-0">
        <Notebook size={14} class="text-gray-400" />
      </span>
      <input
        ref={props.ref}
        type="text"
        value={props.value}
        onInput={(e) => props.onInput(e.currentTarget.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleConfirm();
          if (e.key === "Escape") handleCancel();
        }}
        onBlur={handleConfirm}
        placeholder="Name..."
        class="flex-1 text-sm bg-transparent outline-none text-gray-900 placeholder-gray-400 min-w-0"
      />
      <div class="flex items-center gap-0.5 shrink-0">
        <button
          onMouseDown={(e) => { e.preventDefault(); handleConfirm(); }}
          class="text-green-500 hover:text-green-600 p-0.5 rounded transition-colors"
        >
          <Check size={13} />
        </button>
        <button
          onMouseDown={(e) => { e.preventDefault(); handleCancel(); }}
          class="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  );
}

// ── Item simple réutilisable ───────────────────────────
function SidebarItem(props: {
  label: string;
  icon: JSX.Element;
  active: boolean;
  onClick: () => void;
  index?: number;
  counter?: number;
}) {
  return (
    <button
      onClick={props.onClick}
      class={clsx(
        "w-full flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors text-left",
        props.active
          ? "bg-gray-200 text-black font-medium"
          : "text-gray-700 hover:bg-gray-100"
      )}
    >
      <span class="text-gray-500">{props.icon}</span>
      <span class="truncate">{props.label}</span>
      <span class="ml-auto text-xs text-gray-400">
        {props.counter}
      </span>
    </button>

  );
}