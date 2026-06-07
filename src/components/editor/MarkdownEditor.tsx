import { onMount, onCleanup, createEffect } from "solid-js";
import { activeNote } from "@stores/notesStore";
import { useAutoSave } from "@hooks/useAutoSave";
import { EditorView } from "codemirror";
import { Decoration } from "@codemirror/view"
import { markdown } from "@codemirror/lang-markdown";
import { EditorState, RangeSetBuilder } from "@codemirror/state";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { languages } from "@codemirror/language-data"
import { tags as t } from "@lezer/highlight";

import {
  lineNumbers,
  highlightActiveLineGutter,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  highlightActiveLine,
  keymap
} from "@codemirror/view";
import { history, historyKeymap, defaultKeymap } from "@codemirror/commands";
import { bracketMatching, indentOnInput } from "@codemirror/language";
import { searchKeymap, highlightSelectionMatches } from "@codemirror/search";
import { autocompletion, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { toggleCodeBlock, toggleHeading, toggleInlineMarkdown, toggleURL, toggleBulletAndCheckedList } from "@utils/keymapCodeMirror"
import { checkboxColorPlugin, checkboxPointerPlugin, rustFunctionPlugin, pointerDecoration, detectBalise } from "@utils/codemirrorPlugins"


interface MarkdownEditorProps {
  onScroll?: (ratio: number) => void;
}

const customHeadingStyle = HighlightStyle.define([
  { tag: t.heading1, fontSize: "1.5em", fontWeight: "bold" },
  { tag: t.heading2, fontSize: "1.3em", fontWeight: "bold" },
  { tag: t.heading3, fontSize: "1.1em", fontWeight: "bold" },
  { tag: t.heading4, fontSize: "1em", fontWeight: "bold" },
  { tag: t.heading5, fontSize: "1em", fontWeight: "bold" },
  { tag: t.heading6, fontSize: "1em", fontWeight: "bold", opacity: "0.7" },
]);

const customTextStyle = HighlightStyle.define([
  { tag: t.emphasis, fontStyle: "italic" },
  { tag: t.strong, fontWeight: "bold" },
  { tag: t.strikethrough, textDecoration: "line-through" },
  { tag: t.link, color: "#0366d6", textDecoration: "underline" },
]);

const customCodeStyle = HighlightStyle.define([
  { tag: t.keyword, color: "#d73a49" },
  { tag: t.string, color: "green" },
  { tag: t.comment, color: "#6a737d", fontStyle: "italic" },
  { tag: t.variableName, color: "black" },
  { tag: t.function(t.variableName), color: "#6f42c1" },
  { tag: t.number, color: "#005cc5" },
]);


export function MarkdownEditor(props: MarkdownEditorProps) {
  let container!: HTMLDivElement;
  let view: EditorView | undefined;

  const { schedule } = useAutoSave(() => activeNote()?.id);

  onMount(() => {
    view = new EditorView({
      state: EditorState.create({
        doc: activeNote()?.content ?? "",
        extensions: [
          lineNumbers(),
          highlightActiveLineGutter(),
          highlightSpecialChars(),
          history(),
          drawSelection(),
          dropCursor(),
          EditorState.allowMultipleSelections.of(true),
          indentOnInput(),
          syntaxHighlighting(customHeadingStyle), // Ton style de titres
          bracketMatching(),
          autocompletion(),
          rectangularSelection(),
          highlightActiveLine(),
          highlightSelectionMatches(),
          keymap.of([
            { key: "Mod-b", run: toggleInlineMarkdown("**") },
            { key: "Mod-i", run: toggleInlineMarkdown("*") },
            { key: "Mod-1", run: toggleHeading(1) },
            { key: "Mod-2", run: toggleHeading(2) },
            { key: "Mod-3", run: toggleHeading(3) },
            { key: "Mod-4", run: toggleHeading(4) },
            { key: "Mod-Alt-g", run: toggleCodeBlock() },
            { key: "Mod-e", run: toggleInlineMarkdown("`") },
            { key: "Mod-m", run: toggleInlineMarkdown("$") },
            { key: "Mod-Alt-m", run: toggleInlineMarkdown("$$", true) },
            { key: "Mod-k", run: toggleURL() },
            { key: "Mod-Shift-8", run: toggleBulletAndCheckedList("-") },
            { key: "Mod-Shift-l", run: toggleBulletAndCheckedList("- [ ]") },
            { key: "Mod-Shift-c", run: toggleBulletAndCheckedList("- [x]") },
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...historyKeymap,
            ...searchKeymap,
            ...completionKeymap,
          ]),
          EditorView.domEventHandlers({
            mousedown(e, view) {
              const pos = view.posAtCoords({ x: e.clientX, y: e.clientY }); // Récupère la position du clic
              if (pos === null) return;

              const line = view.state.doc.lineAt(pos);
              const relativePos = pos - line.from;

              // Détecte une case à cocher en début de ligne
              const match = line.text.match(/^(\s*[-*+]\s*)(\[\s?x?\s?\])/i);

              let _newDecorations = Decoration.none;

              if (match) {
                const prefixLength = match[1].length;
                const boxLength = match[2].length;

                if (relativePos >= prefixLength && relativePos <= prefixLength + boxLength) {
                  e.preventDefault();

                  const builder = new RangeSetBuilder<Decoration>();
                  builder.add(line.from + prefixLength, line.from + prefixLength + boxLength, pointerDecoration);
                  _newDecorations = builder.finish();

                  const from = line.from + prefixLength;
                  const isChecked = match[2].toLowerCase().includes("x");
                  const insert = isChecked ? "[ ]" : "[x]";

                  view.dispatch({
                    changes: {
                      from,
                      to: from + boxLength,
                      insert,
                    }
                  });
                  return true;
                }
              }

              return false;
            }
          }),
          checkboxPointerPlugin,
          checkboxColorPlugin,
          rustFunctionPlugin,
          detectBalise,
          markdown({ codeLanguages: languages }),
          EditorView.lineWrapping,
          syntaxHighlighting(customHeadingStyle),
          syntaxHighlighting(customTextStyle),
          syntaxHighlighting(customCodeStyle),
          EditorView.theme({
            "&": { height: "100%", fontSize: "14px" },

            ".cm-content": {
              paddingBottom: "10px !important",
            },

            ".cm-activeLine": { backgroundColor: "rgba(100, 100, 100, 0.1)" },
            ".cm-gutters": {
              backgroundColor: "#f9f9f9",
              borderRight: "1px solid #e0e0e0",
              minWidth: "20px",
              display: "flex",
              justifyContent: "center",
              fontSize: "16px"
            },
            ".cm-checkbox-hover": { cursor: "pointer !important" },
            ".cm-gutter": {
              height: "100%",
            },
            ".cm-gutterElement": {
              fontFamily: "'JetBrains Mono', monospace",
              color: "#999",
              padding: "0 8px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            },
            ".cm-activeLineGutter": { backgroundColor: "#e0e0e0" },
            ".cm-lineNumbers .cm-gutterElement": { fontFamily: "'JetBrains Mono', monospace", color: "#999" },
            ".cm-lineNumbers": { border: "none" },

            ".cm-checkbox-unchecked": {
              color: "#d97706", //  orange/ambre
              fontWeight: "bold",
            },
            ".cm-checkbox-checked": {
              color: "#16a34a", // vert 
              fontWeight: "bold",
              opacity: "0.8"
            },

            ".cm-rust-function, .cm-rust-function *": {
              color: "#6f42c1", // violet
            },

            ".cm-scroller": {
              overflow: "auto",
              fontFamily: "'JetBrains Mono', monospace",
              /* Pour Firefox */
              scrollbarWidth: "thin",
              scrollbarColor: "#cbd5e1 transparent"
            },


            ".cm-scroller::-webkit-scrollbar": {
              width: "8px",
              height: "8px",
            },
            ".cm-scroller::-webkit-scrollbar-track": {
              background: "transparent",
            },
            ".cm-scroller::-webkit-scrollbar-thumb": {
              backgroundColor: "#cbd5e1", // Gris clair
              borderRadius: "4px",
            },
            ".cm-scroller::-webkit-scrollbar-thumb:hover": {
              backgroundColor: "#94a3b8", // Gris moyen au survol
            },

            ".cm-balise": {
              color: "#6f42c1", // violet
            }
          }),
          EditorView.updateListener.of((update) => {
            if (update.docChanged) {
              isLocalChange = true;
              const content = update.state.doc.toString();
              schedule({ content });
            }
          }),
          EditorView.scrollMargins.of((view) => {
            return { bottom: 200 }
          }),
          EditorView.domEventHandlers({
            scroll(e, view) {
              const scroller = view?.scrollDOM;
              const ratio = scroller.scrollTop / (scroller.scrollHeight - scroller.clientHeight);
              props.onScroll?.(isNaN(ratio) ? 0 : ratio);
            }
          })
        ],
      }),
      parent: container,
    });
  });

  let isLocalChange = false;


  // Quand on change de note active, on recharge le contenu
  createEffect(() => {
    const note = activeNote();
    if (!view || !note) return;

    if (isLocalChange) {
      isLocalChange = false;
      return;
    }

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
      class="absolute inset-0 overflow-hidden"
    />
  );
}