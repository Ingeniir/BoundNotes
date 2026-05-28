import { Sidebar } from '@components/layout/Sidebar';
import { NoteList } from '@components/layout/NoteList';
import { MainPanel } from '@components/layout/MainPanel';
import type { Component } from 'solid-js'
import { onMount } from 'solid-js';
import { loadAll } from './stores/notesStore';

const App: Component = () => {

  onMount(() => loadAll());

  return (
    <div class="flex h-screen w-screen overflow-hidden bg-white text-gray-900 font-sans">
      <Sidebar />
      <NoteList />
      <MainPanel />
    </div>
  )
}

export default App
