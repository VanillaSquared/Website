import JsonTypeIcon from "@/components/JsonTypeIcon";
import { MarkdownInline } from "@/components/Markdown";

export function JsonTreeItem({ type = "object", contents = "", children }) {
  const showTypeIcon = String(type).trim().toLowerCase() !== "none";

  return (
    <li className="json-tree-item">
      <div className="json-tree-row">
        {showTypeIcon ? <JsonTypeIcon type={type} /> : null}
        <MarkdownInline value={contents} className="text-soft" />
      </div>
      {children ? <ul className="json-tree-children">{children}</ul> : null}
    </li>
  );
}

export default function JsonTree({ children, className = "" }) {
  return <ul className={`json-tree ${className}`}>{children}</ul>;
}
