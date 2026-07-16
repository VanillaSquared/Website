import JsonTypeIcon from "@/components/JsonTypeIcon";
import { MarkdownInline } from "@/components/Markdown";

export function JsonTreeItem({ type = "object", contents = "", children }) {
  return (
    <li className="json-tree-item">
      <div className="json-tree-row">
        <JsonTypeIcon type={type} />
        <MarkdownInline value={contents} className="text-soft" />
      </div>
      {children ? <ul className="json-tree-children">{children}</ul> : null}
    </li>
  );
}

export default function JsonTree({ children, className = "" }) {
  return <ul className={`json-tree ${className}`}>{children}</ul>;
}
