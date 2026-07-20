import type { ReactNode } from "react";

export function MarkdownRenderer({ content }: { content: string }) {
  return <div className="space-y-4 text-sm leading-7 text-white/64">{renderBlocks(content)}</div>;
}

function renderBlocks(content: string) {
  const blocks = content.replace(/\r\n/g, "\n").split(/\n{2,}/);
  return blocks.map((block, index) => {
    const text = block.trim();
    if (!text) return null;
    if (text.startsWith("### ")) return <h4 key={index} className="pt-2 text-base font-semibold text-white">{text.slice(4)}</h4>;
    if (text.startsWith("## ")) return <h3 key={index} className="pt-3 text-lg font-semibold text-white">{text.slice(3)}</h3>;
    if (text.startsWith("# ")) return <h2 key={index} className="text-xl font-semibold text-white">{text.slice(2)}</h2>;
    if (text.split("\n").every((line) => line.trim().startsWith("- "))) {
      return (
        <ul key={index} className="list-disc space-y-1 pl-5">
          {text.split("\n").map((line, lineIndex) => <li key={lineIndex}>{line.trim().slice(2)}</li>)}
        </ul>
      );
    }
    if (text.split("\n").every((line) => /^\d+\.\s/.test(line.trim()))) {
      return (
        <ol key={index} className="list-decimal space-y-1 pl-5">
          {text.split("\n").map((line, lineIndex) => <li key={lineIndex}>{line.trim().replace(/^\d+\.\s/, "")}</li>)}
        </ol>
      );
    }
    return <p key={index}>{renderInline(text)}</p>;
  });
}

function renderInline(text: string): ReactNode {
  return text.split("\n").map((line, index, lines) => (
    <span key={index}>
      {line}
      {index < lines.length - 1 ? <br /> : null}
    </span>
  ));
}
