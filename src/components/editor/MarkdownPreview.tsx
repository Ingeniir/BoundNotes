import { createMemo, createResource, onCleanup } from "solid-js";
import { activeNote, saveNote } from "../../stores/notesStore";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkFrontmatter from "remark-frontmatter";
import remarkBreaks from "remark-breaks";
import remarkLint from "remark-lint";
import remarkMath from "remark-math";
import remarkHighlight from "rehype-highlight";
import rehypeKatex from "rehype-katex";
import rehypeRaw from "rehype-raw";

import { visit } from "unist-util-visit";

import "highlight.js/styles/github.css";
import "../../styles/editor.css";
import "katex/dist/katex.css";

function CheckboxElement(props: any) {
  return (
    <input
      type="checkbox"
      disabled
      style="cursor: default;"
      checked={props.checked}
    />
  )
}

function rehypeEnableCheckboxes() {
  return (tree: any) => {
    visit(tree, "element", (node: any) => {
      if (
        node.tagName === "input" &&
        node.properties?.type === "checkbox"
      ) {
        // Retire disabled
        delete node.properties.disabled;
        // Ajoute un style cursor pointer
        node.properties.style = "cursor: pointer;";
      }
    });
  };
}

const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkLint)
  .use(remarkRehype, {
    allowDangerousHtml: true,
  })
  .use(rehypeRaw)
  .use(rehypeEnableCheckboxes)
  .use(rehypeKatex)
  .use(remarkHighlight, { detect: true })
  .use(rehypeStringify);

export function MarkdownPreview() {
  let containerRef!: HTMLDivElement;
  const content = createMemo(() => activeNote()?.content ?? "");

  const [html] = createResource(content, async (md) => {
    if (!md) return "";
    const result = await processor.process(md);
    return String(result);
  });

  // Intercepte les clics sur les checkboxes du preview
  const handleClick = (e: MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.tagName !== "INPUT" || (target as HTMLInputElement).type !== "checkbox") return;

    e.preventDefault(); // empêche le comportement natif

    const note = activeNote();
    if (!note) return;

    // Trouve l'index de cette checkbox parmi toutes les checkboxes du preview
    const allCheckboxes = Array.from(
      containerRef.querySelectorAll("input[type='checkbox']")
    );
    const checkboxIndex = allCheckboxes.indexOf(target);
    if (checkboxIndex === -1) return;

    // Trouve et toggle la Nth occurrence de "- [ ]" ou "- [x]" dans le markdown
    const updated = toggleCheckboxInMarkdown(note.content, checkboxIndex);
    if (updated !== null) {
      saveNote(note.id, { content: updated });
    }
  };

  return (
    <div
      ref={containerRef}
      class="h-full overflow-y-auto px-8 py-6"
      onClick={handleClick}
    >
      <div
        class="prose prose-grey max-w-none wrap-break-word 
               prose-pre:bg-neutral-100 prose-pre:border prose-pre:border-neutral-200/60 
               prose-pre:rounded-lg prose-pre:p-4 prose-code:bg-neutral-100"
        innerHTML={html() ?? ""}
      />
    </div>
  );
}

// Toggle la Nth checkbox dans le texte markdown
function toggleCheckboxInMarkdown(content: string, index: number): string | null {
  let count = -1;

  const result = content.replace(/^(\s*[-*+]\s*)\[([ xX])\]/gm, (match, prefix, state) => {
    count++;
    if (count === index) {
      const isChecked = state.toLowerCase() === "x";
      return `${prefix}[${isChecked ? " " : "x"}]`;
    }
    return match;
  });

  return count >= index ? result : null;
}