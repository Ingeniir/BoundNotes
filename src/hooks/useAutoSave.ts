import { onCleanup } from "solid-js";
import { saveNote } from "../stores/notesStore";

export function useAutoSave(getNoteId: () => string | undefined) {
  let timer: ReturnType<typeof setTimeout> | null = null;

  const schedule = (payload: { title?: string; content?: string }) => {
    const id = getNoteId();
    if (!id) return;

    if (timer) clearTimeout(timer);
    timer = setTimeout(async () => {
      await saveNote(id, payload);
    }, 800); // 800ms de debounce
  };

  onCleanup(() => {
    if (timer) clearTimeout(timer);
  });

  return { schedule };
}