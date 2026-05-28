import { createMemo, createResource } from "solid-js";
import { activeNote } from "../../stores/notesStore";
import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import rehypeSanitize from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";

const processor = unified()
  .use(remarkParse)
  .use(remarkRehype)
  .use(rehypeSanitize)
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
        class="prose prose-gray max-w-none"
        innerHTML={html() ?? ""}
      />
    </div>
  );
}