import { Fragment } from "react";

import CodeBlock from "@/components/CodeBlock";
import Separator from "@/components/Separator";

const inlinePatterns = [
  { expression: /\[([^\]]+?)\]\(([^)\s]+?)\)/, tag: "a" },
  { expression: /\*\*([\s\S]+?)\*\*/, tag: "strong" },
  { expression: /__([\s\S]+?)__/, tag: "u" },
  { expression: /~~([\s\S]+?)~~/, tag: "s" },
  {
    expression: /(?<!`)`(?!`)([\s\S]+?)(?<!`)`(?!`)/,
    tag: "code",
    literal: true,
    className: "rounded border border-category-label-border bg-category-label px-1.5 py-0.5 font-mono text-sm text-heading",
  },
  { expression: /(?<!\*)\*(?!\*)([\s\S]+?)(?<!\*)\*(?!\*)/, tag: "em" },
];

function renderInline(text, keyPrefix = "inline") {
  if (!text) return null;

  let match = null;
  let pattern = null;

  for (const candidate of inlinePatterns) {
    const candidateMatch = candidate.expression.exec(text);
    if (candidateMatch && (!match || candidateMatch.index < match.index)) {
      match = candidateMatch;
      pattern = candidate;
    }
  }

  if (!match) return text;

  const Tag = pattern.tag;
  const before = text.slice(0, match.index);
  const after = text.slice(match.index + match[0].length);
  const href = pattern.tag === "a" && /^(https?:\/\/|mailto:|\/|#|\.\.?\/)/i.test(match[2]) ? match[2] : null;
  const inlineContent = pattern.literal ? match[1] : renderInline(match[1], `${keyPrefix}-content`);
  const renderedContent = pattern.tag === "a" ? (
    href ? (
      <a
        href={href}
        target={/^https?:\/\//i.test(href) ? "_blank" : undefined}
        rel={/^https?:\/\//i.test(href) ? "noopener noreferrer" : undefined}
        className="text-accent underline underline-offset-2 hover:text-heading"
      >
        {inlineContent}
      </a>
    ) : match[0]
  ) : <Tag className={pattern.className}>{inlineContent}</Tag>;

  return (
    <Fragment key={keyPrefix}>
      {renderInline(before, `${keyPrefix}-before`)}
      {renderedContent}
      {renderInline(after, `${keyPrefix}-after`)}
    </Fragment>
  );
}

function renderText(text, keyPrefix) {
  const lines = text.split("\n");
  const blocks = [];
  let plainLines = [];

  function flushPlain() {
    if (!plainLines.length) return;
    const value = plainLines.join("\n");
    blocks.push(<div key={`${keyPrefix}-text-${blocks.length}`} className="whitespace-pre-wrap">{renderInline(value, `${keyPrefix}-text-inline-${blocks.length}`)}</div>);
    plainLines = [];
  }

  lines.forEach((line, index) => {
    if (/^[ \t]*---[ \t]*$/.test(line)) {
      flushPlain();
      blocks.push(<Separator key={`${keyPrefix}-separator-${index}`} className="my-2" />);
      return;
    }

    const subheader = /^-#[ \t]+(?!#)(.+)$/.exec(line);
    if (subheader) {
      flushPlain();
      blocks.push(<p key={`${keyPrefix}-subheader-${index}`} className="text-sm text-muted">{renderInline(subheader[1], `${keyPrefix}-subheader-inline-${index}`)}</p>);
      return;
    }

    const heading = /^(#{1,3})[ \t]+(?!#)(.+)$/.exec(line);
    if (!heading) {
      plainLines.push(line);
      return;
    }

    flushPlain();
    const level = heading[1].length;
    const Heading = `h${level}`;
    const size = level === 1 ? "text-3xl" : level === 2 ? "text-2xl" : "text-xl";
    blocks.push(<Heading key={`${keyPrefix}-heading-${index}`} className={`${size} font-bold text-heading`}>{renderInline(heading[2], `${keyPrefix}-heading-inline-${index}`)}</Heading>);
  });
  flushPlain();

  return blocks;
}

export default function Markdown({ children, value, className = "" }) {
  const markdown = String(value ?? children ?? "");
  const blocks = [];
  const fence = /```([\s\S]*?)```/g;
  let cursor = 0;
  let match;

  while ((match = fence.exec(markdown)) !== null) {
    if (match.index > cursor) blocks.push(...renderText(markdown.slice(cursor, match.index), `before-${cursor}`));
    let code = match[1];
    if (code.startsWith("\n")) code = code.slice(1);
    if (code.endsWith("\n")) code = code.slice(0, -1);
    blocks.push(<CodeBlock key={`code-${match.index}`} code={code} />);
    cursor = match.index + match[0].length;
  }

  if (cursor < markdown.length) blocks.push(...renderText(markdown.slice(cursor), `after-${cursor}`));

  return <div className={`space-y-3 text-soft ${className}`}>{blocks}</div>;
}
