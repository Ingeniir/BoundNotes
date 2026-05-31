import { Sidebar } from '@components/layout/Sidebar';
import { NoteList } from '@components/layout/NoteList';
import { MainPanel } from '@components/layout/MainPanel';
import { TitleBar } from "@components/layout/TitleBar";
import { error } from "@stores/notesStore";
import { tooltip, setShowShortcutsPanel, showShortcutsPanel } from "@stores/uiStore";
import type { Component } from 'solid-js'
import { onMount, Show } from 'solid-js';
import { loadAll } from './stores/notesStore';
import { Presence, Motion } from 'solid-motionone';
import { useKeyboardShortcuts } from '@hooks/useKeyboardShortcuts';
import { ShortcutsPanel } from '@components/modals/ShortcutsPanel';

const App: Component = () => {

  onMount(() => loadAll());
  useKeyboardShortcuts();

  return (
    <div class="flex flex-col h-screen w-screen overflow-hidden bg-white text-gray-900 font-sans">
      <TitleBar />
      <div class="flex flex-1 overflow-hidden relative">
        <Presence exitBeforeEnter>
          <Show when={error()}>
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 10 }} class="absolute bottom-4 right-4 bg-red-500 text-white px-4 py-2 rounded shadow-lg z-50">
              {error()}
            </Motion.div>
          </Show>
          <Show when={tooltip()}>
            <Motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, x: 10 }} class="absolute bottom-4 right-4 bg-gray-100 px-4 py-2 rounded shadow-lg z-50">
              {tooltip()}
            </Motion.div>
          </Show>
        </Presence>
        <Sidebar />
        <NoteList />
        <MainPanel />
        <ShortcutsPanel open={showShortcutsPanel()} onClose={() => setShowShortcutsPanel(false)} />
      </div>
    </div>
  )
}

export default App
