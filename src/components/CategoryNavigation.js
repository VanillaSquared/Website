"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import Chevron from "@/components/Chevron";

function containsSelected(node, selectedId) {
  return node.id === selectedId || Boolean(node.children?.some((child) => containsSelected(child, selectedId)));
}

function initialOpen(nodes, selectedId, result = []) {
  for (const node of nodes) {
    if (node.children?.length && (node.defaultOpen === true || containsSelected(node, selectedId))) result.push(node.id);
    if (node.children) initialOpen(node.children, selectedId, result);
  }
  return result;
}

function CategoryItem({ item, selectedId, onSelect, openIds, setOpenIds }) {
  const hasChildren = Boolean(item.children?.length);
  const isOpen = openIds.has(item.id);
  const selected = item.id === selectedId;
  const itemClasses = `flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-left text-base font-semibold transition-colors ${selected ? "text-category-selected-text" : "text-soft hover:text-heading"}`;
  const content = (
    <>
      {item.icon ? <span className="w-5 shrink-0 text-center" aria-hidden="true">{item.icon}</span> : null}
      <span className="min-w-0 flex-1 truncate">{item.label}</span>
    </>
  );

  function toggle() {
    setOpenIds((current) => {
      const next = new Set(current);
      if (next.has(item.id)) next.delete(item.id);
      else next.add(item.id);
      return next;
    });
  }

  return (
    <li>
      <div className={`flex items-center rounded-md transition-colors ${selected ? "bg-category-selected" : "hover:bg-category-hover"}`}>
        {item.href ? (
          <Link href={item.href} onClick={() => onSelect?.(item)} className={itemClasses} aria-current={selected ? "page" : undefined}>
            {content}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => onSelect ? onSelect(item) : hasChildren ? toggle() : undefined}
            className={itemClasses}
            aria-expanded={hasChildren && !onSelect ? isOpen : undefined}
          >
            {content}
          </button>
        )}
        {hasChildren ? (
          <button
            type="button"
            onClick={toggle}
            className={`inline-flex h-10 w-10 shrink-0 items-center justify-center transition-colors hover:text-heading ${selected ? "text-category-selected-text" : "text-muted"}`}
            aria-expanded={isOpen}
            aria-label={`${isOpen ? "Collapse" : "Expand"} ${item.label}`}
          >
            <Chevron expanded={isOpen} thick className="h-2.5 w-2.5" />
          </button>
        ) : null}
      </div>
      {hasChildren && isOpen ? (
        <ul className="mt-0.5 ml-4 space-y-0.5">
          {item.children.map((child) => <CategoryItem key={child.id} item={child} selectedId={selectedId} onSelect={onSelect} openIds={openIds} setOpenIds={setOpenIds} />)}
        </ul>
      ) : null}
    </li>
  );
}

export default function CategoryNavigation({ items = [], selectedId, onSelect, className = "" }) {
  const [openIds, setOpenIds] = useState(() => new Set(initialOpen(items, selectedId)));

  useEffect(() => {
    const activeAncestors = initialOpen(items, selectedId, []);
    setOpenIds((current) => new Set([...current, ...activeAncestors]));
  }, [items, selectedId]);

  return (
    <nav className={`w-full bg-category px-4 py-5 ${className}`} aria-label="Documentation">
      <ul className="space-y-1">{items.map((item) => <CategoryItem key={item.id} item={item} selectedId={selectedId} onSelect={onSelect} openIds={openIds} setOpenIds={setOpenIds} />)}</ul>
    </nav>
  );
}
