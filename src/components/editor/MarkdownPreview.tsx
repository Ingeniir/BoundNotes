import { createMemo, createResource } from "solid-js";
import { activeNote } from "../../stores/notesStore";
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

import "highlight.js/styles/github.css"
import "../../styles/editor.css";
import "katex/dist/katex.css";



const processor = unified()
  .use(remarkParse)
  .use(remarkMath)
  .use(remarkFrontmatter)
  .use(remarkGfm)
  .use(remarkBreaks)
  .use(remarkLint)
  .use(remarkRehype)
  .use(rehypeKatex)
  .use(remarkHighlight, { detect: true })
  .use(rehypeStringify);

export function MarkdownPreview() {
  const content = createMemo(() => activeNote()?.content ?? "");

  const [html] = createResource(content, async (md) => {
    if (!md) return "";
    const result = await processor.process(md);
    return String(result);
  });

  return (
    <div class="h-full overflow-y-auto px-8 py-6">
      <div
        class="prose prose-grey max-w-none wrap-break-word prose-pre:bg-neutral-100 prose-pre:border prose-pre:border-neutral-200/60 prose-pre:rounded-lg prose-pre:p-4 prose-code:bg-neutral-100"
        innerHTML={html() ?? ""}
      />
    </div>
  );
}