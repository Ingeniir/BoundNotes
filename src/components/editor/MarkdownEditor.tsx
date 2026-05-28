import { onMount, onCleanup, createEffect } from "solid-js";
import { activeNote } from "../../stores/notesStore";
import { useAutoSave } from "../../hooks/useAutoSave";
import { EditorView, basicSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { EditorState } from "@codemirror/state";

export function MarkdownEditor() {
  let container!: HTMLDivElement;
  let view: EditorView | undefined;

  const { schedule } = useAutoSave(() => activeNote()?.id);

  onMount(() => {
    view = new EditorView({
      state: EditorState.create({
        doc: activeNote()?.content ?? "",
        extensions: [
          basicSetup,
          markdown(),
          EditorView.theme({
            "&": { height: "100%", fontSize: "14px" },
            ".cm-scroller": { overflow: "auto", fontFamily: "'JetBrains Mono', monospace" },
            ".cm-content": { padding: "16px" },
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              const content = update.state.doc.toString();
              schedule({ content });
            }
          }),
        ],
      }),
      parent: container,
    });
  });

  // Quand on change de note active, on recharge le contenu
  createEffect(() => {
    const note = activeNote();
    if (!view || !note) return;

    const currentContent = view.state.doc.toString();
    if (currentContent !== note.content) {
      view.dispatch({
        changes: {
          from: 0,
          to: view.state.doc.length,
          insert: note.content,
        },
      });
    }
  });

  onCleanup(() => view?.destroy());

  return (
    <div
      ref={container}
      class="h-full w-full overflow-hidden"
    />
  );
}