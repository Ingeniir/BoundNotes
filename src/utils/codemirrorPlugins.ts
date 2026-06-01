// src/utils/codemirrorPlugins.ts
import { ViewPlugin, Decoration, DecorationSet, EditorView, ViewUpdate } from "@codemirror/view";
import { RangeSetBuilder } from "@codemirror/state";

// ==========================================
// 1. DÉCORATIONS (MARQUES)
// ==========================================
export const pointerDecoration = Decoration.mark({ class: "cm-checkbox-hover" });
export const checkboxUncheckedMark = Decoration.mark({ class: "cm-checkbox-unchecked" });
export const checkboxCheckedMark = Decoration.mark({ class: "cm-checkbox-checked" });
export const rustFunctionMark = Decoration.mark({ class: "cm-rust-function" });

// ==========================================
// 2. PLUGINS CUSTOMS
// ==========================================

// Plugin qui analyse le texte et applique les couleurs aux checkboxes
export const checkboxColorPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = this.buildDecorations(view); }
    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) this.decorations = this.buildDecorations(update.view);
    }
    buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();
        for (let { from, to } of view.visibleRanges) {
            const startLine = view.state.doc.lineAt(from);
            const endLine = view.state.doc.lineAt(to);
            for (let i = startLine.number; i <= endLine.number; i++) {
                const line = view.state.doc.line(i);
                const match = line.text.match(/^(\s*[-*+]\s*)(\[\s?x?\s?\])/i);
                if (match) {
                    const prefixLength = match[1].length;
                    const boxLength = match[2].length;
                    const isChecked = match[2].toLowerCase().includes("x");
                    builder.add(line.from + prefixLength, line.from + prefixLength + boxLength, isChecked ? checkboxCheckedMark : checkboxUncheckedMark);
                }
            }
        }
        return builder.finish();
    }
}, { decorations: v => v.decorations });

// Plugin qui ajoute la classe Pointer au survol des checkboxes
export const checkboxPointerPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = Decoration.none; }
}, {
    eventHandlers: {
        mousemove(e, view) {
            const pos = view.posAtCoords({ x: e.clientX, y: e.clientY });
            if (pos === null) { if (view.contentDOM.style.cursor === "pointer") view.contentDOM.style.cursor = ""; return; }
            const line = view.state.doc.lineAt(pos);
            const relativePos = pos - line.from;
            const match = line.text.match(/^(\s*[-*+]\s*)(\[\s?x?\s?\])/i);
            if (match) {
                const prefixLength = match[1].length;
                if (relativePos >= prefixLength && relativePos <= prefixLength + match[2].length) {
                    if (view.contentDOM.style.cursor !== "pointer") view.contentDOM.style.cursor = "pointer";
                    return;
                }
            }
            if (view.contentDOM.style.cursor === "pointer") view.contentDOM.style.cursor = "";
        },
        mouseleave(_e, view) {
            if (this.decorations.size > 0) { this.decorations = Decoration.none; view.requestMeasure(); }
        }
    },
    decorations: v => v.decorations
});

// Plugin qui colore le nom d'une fonction Rust précédée de :: dans un bloc de code
export const rustFunctionPlugin = ViewPlugin.fromClass(class {
    decorations: DecorationSet;
    constructor(view: EditorView) { this.decorations = this.buildDecorations(view); }
    update(update: ViewUpdate) {
        if (update.docChanged || update.viewportChanged) this.decorations = this.buildDecorations(update.view);
    }
    buildDecorations(view: EditorView) {
        const builder = new RangeSetBuilder<Decoration>();
        let inCodeBlock = false;
        for (let i = 1; i <= view.state.doc.lines; i++) {
            const line = view.state.doc.line(i);
            const trimmedText = line.text.trim();
            if (trimmedText.startsWith("```rust")) { inCodeBlock = !inCodeBlock; continue; }
            if (inCodeBlock) {
                const regex = /(?<=::)\w+(?=\s*\()/g;
                let match;
                while ((match = regex.exec(line.text)) !== null) {
                    const start = line.from + match.index;
                    const end = start + match[0].length;
                    if (view.visibleRanges.some(r => start >= r.from && end <= r.to)) {
                        builder.add(start, end, rustFunctionMark);
                    }
                }
            }
        }
        return builder.finish();
    }
}, { decorations: v => v.decorations });