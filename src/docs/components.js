import Button from "@/components/Button";
import Card from "@/components/Card";
import Checkmark from "@/components/Checkmark";
import CodeBlock from "@/components/CodeBlock";
import Separator from "@/components/Separator";
import Tag from "@/components/Tag";

const calloutVariants = {
  note: {
    label: "Note",
    icon: "i",
    className: "border-accent/40 bg-control-accent-soft",
    iconClassName: "bg-accent text-inverse",
  },
  tip: {
    label: "Tip",
    icon: "✓",
    className: "border-[var(--vsq-tag-low-border)] bg-[var(--vsq-tag-low-bg)]",
    iconClassName: "bg-[var(--vsq-tag-low-text)] text-inverse",
  },
  warning: {
    label: "Warning",
    icon: "!",
    className: "border-[var(--vsq-tag-medium-border)] bg-[var(--vsq-tag-medium-bg)]",
    iconClassName: "bg-[var(--vsq-tag-medium-text)] text-background",
  },
  danger: {
    label: "Danger",
    icon: "!",
    className: "border-[var(--vsq-tag-code-red-border)] bg-[var(--vsq-tag-code-red-bg)]",
    iconClassName: "bg-[var(--vsq-tag-code-red-text)] text-inverse",
  },
};

function FencedCodeBlock({ children }) {
  const codeElement = children;
  const language = codeElement?.props?.className?.replace(/^language-/, "") || undefined;
  const code = String(codeElement?.props?.children ?? "").replace(/\n$/, "");
  return <CodeBlock code={code} language={language} />;
}

function Callout({ children, title, type = "note" }) {
  const variant = calloutVariants[type] ?? calloutVariants.note;

  return (
    <aside className={`my-5 flex gap-3 rounded-xl border p-4 ${variant.className}`}>
      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${variant.iconClassName}`} aria-hidden="true">
        {variant.icon}
      </span>
      <div className="min-w-0">
        <p className="font-semibold text-heading">{title || variant.label}</p>
        <div className="mt-1 text-sm text-soft">{children}</div>
      </div>
    </aside>
  );
}

function CardGrid({ children, columns = 2 }) {
  const columnClass = Number(columns) >= 3 ? "lg:grid-cols-3" : Number(columns) === 1 ? "grid-cols-1" : "md:grid-cols-2";
  return <div className={`my-6 grid grid-cols-1 gap-4 ${columnClass}`}>{children}</div>;
}

function LinkCard({ children, title, description, href, external = false }) {
  const isExternal = external || /^https?:\/\//.test(href || "");

  return (
    <a
      href={href}
      target={isExternal ? "_blank" : undefined}
      rel={isExternal ? "noopener noreferrer" : undefined}
      className="group block rounded-xl border border-divider bg-card p-5 no-underline transition-colors hover:border-accent"
    >
      <span className="flex items-center justify-between gap-3 font-semibold text-heading">
        {title}
        <span className="text-accent transition-transform group-hover:translate-x-1" aria-hidden="true">→</span>
      </span>
      {description ? <span className="mt-1 block text-sm text-muted">{description}</span> : null}
      {children ? <span className="mt-3 block text-sm text-soft">{children}</span> : null}
    </a>
  );
}

function Steps({ children }) {
  return <ol className="my-6 list-none space-y-6 p-0">{children}</ol>;
}

function Step({ children, number, title }) {
  return (
    <li className="relative flex gap-4">
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent text-sm font-bold text-inverse">{number}</span>
      <div className="min-w-0 flex-1 border-b border-divider pb-6">
        {title ? <p className="font-semibold text-heading">{title}</p> : null}
        <div className={title ? "mt-2" : ""}>{children}</div>
      </div>
    </li>
  );
}

function Accordion({ children, title, open = false }) {
  return (
    <details className="my-4 rounded-xl border border-divider bg-card" open={open === true || open === "true"}>
      <summary className="cursor-pointer px-4 py-3 font-semibold text-heading marker:text-accent">{title}</summary>
      <div className="border-t border-divider px-4 py-3 text-soft">{children}</div>
    </details>
  );
}

function Kbd({ children }) {
  return <kbd className="inline-flex rounded-md border border-control-border bg-control px-2 py-0.5 font-mono text-xs font-semibold text-heading shadow-sm">{children}</kbd>;
}

function ApiProperty({ children, name, type, required = false, defaultValue }) {
  return (
    <div className="border-b border-divider py-5 last:border-b-0">
      <div className="flex flex-wrap items-center gap-2">
        <code className="font-mono font-semibold text-heading">{name}</code>
        {type ? <Tag variant="accent">{type}</Tag> : null}
        {required === true || required === "true" ? <Tag variant="high">Required</Tag> : <Tag variant="subtle">Optional</Tag>}
        {defaultValue !== undefined ? <span className="text-xs text-muted">Default: <code>{String(defaultValue)}</code></span> : null}
      </div>
      {children ? <div className="mt-2 text-sm text-soft">{children}</div> : null}
    </div>
  );
}

function ApiProperties({ children, title = "Properties" }) {
  return (
    <section className="my-6 overflow-hidden rounded-xl border border-divider bg-card px-5">
      <p className="border-b border-divider py-4 font-semibold text-heading">{title}</p>
      {children}
    </section>
  );
}

function Checklist({ children }) {
  return <ul className="my-5 list-none space-y-2 p-0">{children}</ul>;
}

function ChecklistItem({ children, checked = true }) {
  const isChecked = checked === true || checked === "true";
  return (
    <li className="flex items-start gap-3">
      <Checkmark checked={isChecked} variant={isChecked ? "green" : "unconfirmed"} size="sm" className="mt-1" />
      <span>{children}</span>
    </li>
  );
}

function Figure({ src, alt, caption, width, height }) {
  return (
    <figure className="my-6">
      <img src={src} alt={alt || ""} width={width} height={height} className="h-auto max-w-full rounded-xl border border-divider" />
      {caption ? <figcaption className="mt-2 text-center text-sm text-muted">{caption}</figcaption> : null}
    </figure>
  );
}

function Columns({ children, count = 2 }) {
  const columnClass = Number(count) >= 3 ? "lg:grid-cols-3" : "md:grid-cols-2";
  return <div className={`my-5 grid grid-cols-1 gap-6 ${columnClass}`}>{children}</div>;
}

function Command({ children, value }) {
  const command = String(value ?? children ?? "");
  return <CodeBlock code={command} language="shell" />;
}

function FilePath({ children }) {
  return <code className="rounded border border-category-label-border bg-category-label px-1.5 py-0.5 font-mono text-sm text-heading">{children}</code>;
}

function Example({ children, title = "Example" }) {
  return (
    <section className="my-6 overflow-hidden rounded-xl border border-divider">
      <p className="border-b border-divider bg-card px-4 py-2 text-sm font-semibold text-heading">{title}</p>
      <div className="p-4">{children}</div>
    </section>
  );
}

/**
 * Components approved for use in documentation Markdown.
 *
 * General UI: Button, Card, CodeBlock, Tag, Badge, Separator, Checkmark
 * Guidance: Callout, Checklist, ChecklistItem, Steps, Step, Accordion
 * Layout/navigation: CardGrid, LinkCard, Columns, Example
 * Reference content: ApiProperties, ApiProperty, Kbd, FilePath, Command, Figure
 *
 * Add reviewed, author-safe components here instead of importing modules in .md files.
 */
export const docsComponents = {
  Accordion,
  ApiProperties,
  ApiProperty,
  Badge: Tag,
  Button,
  Callout,
  Card,
  CardGrid,
  Checkmark,
  Checklist,
  ChecklistItem,
  CodeBlock,
  Columns,
  Command,
  Example,
  Figure,
  FilePath,
  Kbd,
  LinkCard,
  Separator,
  Step,
  Steps,
  Tag,
  pre: FencedCodeBlock,
};
