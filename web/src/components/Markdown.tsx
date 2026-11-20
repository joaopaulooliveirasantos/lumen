// Renderizador mínimo de Markdown para os textos legais (doc/*.md): títulos (#, ##), listas (- ),
// parágrafos e **negrito**. Gera elementos Preact (nada de innerHTML), então o texto é sempre escapado.
import type { ComponentChildren } from "preact";

export type MdBlock =
  | { type: "h1" | "h2" | "h3"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "p"; text: string };

export function parseMarkdown(source: string): MdBlock[] {
  const blocks: MdBlock[] = [];
  let paragraph: string[] = [];
  let list: string[] | null = null;

  const flush = () => {
    if (paragraph.length) blocks.push({ type: "p", text: paragraph.join(" ") });
    if (list) blocks.push({ type: "ul", items: list });
    paragraph = [];
    list = null;
  };

  for (const rawLine of source.split(/\r?\n/)) {
    const line = rawLine.trim();
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    if (!line) {
      flush();
    } else if (heading) {
      flush();
      blocks.push({ type: `h${heading[1].length}` as "h1" | "h2" | "h3", text: heading[2] });
    } else if (/^[-*]\s+/.test(line)) {
      if (paragraph.length) {
        blocks.push({ type: "p", text: paragraph.join(" ") });
        paragraph = [];
      }
      (list ??= []).push(line.replace(/^[-*]\s+/, ""));
    } else if (list) {
      // Continuação de um item de lista quebrado em duas linhas.
      list[list.length - 1] += ` ${line}`;
    } else {
      paragraph.push(line);
    }
  }
  flush();
  return blocks;
}

function inline(text: string): ComponentChildren {
  return text.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
  );
}

export function Markdown({ source }: { source: string }) {
  return (
    <div class="markdown">
      {parseMarkdown(source).map((block, i) => {
        if (block.type === "ul") {
          return (
            <ul key={i}>
              {block.items.map((item, j) => (
                <li key={j}>{inline(item)}</li>
              ))}
            </ul>
          );
        }
        const Tag = block.type;
        return <Tag key={i}>{inline(block.text)}</Tag>;
      })}
    </div>
  );
}
