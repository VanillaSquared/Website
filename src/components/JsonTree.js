import Chevron from "@/components/Chevron";
import JsonTypeIcon from "@/components/JsonTypeIcon";
import { MarkdownInline } from "@/components/Markdown";

export function JsonTreeItem({ type = "object", contents = "", children, collapsible = false, defaultOpen = false }) {
  const showTypeIcon = String(type).trim().toLowerCase() !== "none";
  const rowContents = (
    <>
      {showTypeIcon ? <JsonTypeIcon type={type} /> : null}
      <MarkdownInline value={contents} className="text-soft" />
    </>
  );

  if (collapsible && children) {
    const disclosureLabel = typeof collapsible === "string" ? collapsible : "Fields";

    return (
      <li className="json-tree-item json-tree-item-collapsible">
        <div className="json-tree-row">{rowContents}</div>
        <details open={defaultOpen || undefined}>
          <summary className="json-tree-summary">
            <MarkdownInline value={disclosureLabel} className="text-soft" />
            <Chevron thick className="json-tree-disclosure-chevron h-2.5 w-2.5" />
          </summary>
          <ul className="json-tree-children">{children}</ul>
        </details>
      </li>
    );
  }

  return (
    <li className="json-tree-item">
      <div className="json-tree-row">{rowContents}</div>
      {children ? <ul className="json-tree-children">{children}</ul> : null}
    </li>
  );
}

export default function JsonTree({ children, className = "" }) {
  return <ul className={`json-tree ${className}`}>{children}</ul>;
}
