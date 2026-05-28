import { Sidebar } from '@components/layout/Sidebar';
import { NoteList } from '@components/layout/NoteList';
import { MainPanel } from '@components/layout/MainPanel';
import { error } from "@stores/notesStore";
import { tooltip } from "@stores/uiStore";
import type { Component } from 'solid-js'
import { onMount, Show } from 'solid-js';
import { loadAll } from './stores/notesStore';
import { Presence, Motion } from 'solid-motionone';

const App: Component = () => {

  onMount(() => loadAll());

  return (
    <div class="relative flex h-screen w-screen overflow-hidden bg-white text-gray-900 font-sans">
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
    </div>
  )
}

export default App
