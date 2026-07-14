"use client";

import { useState } from "react";

import Chevron from "@/components/Chevron";

function initialOpen(nodes, result = []) {
  for (const node of nodes) {
    if (node.children?.length && node.defaultOpen !== false) result.push(node.id);
    if (node.children) initialOpen(node.children, result);
  }
  return result;
}

function CategoryItem({ item, selectedId, onSelect, openIds, setOpenIds }) {
  const hasChildren = Boolean(item.children?.length);
  const isOpen = openIds.has(item.id);
  const selected = item.id === selectedId;

  function handleClick() {
    if (hasChildren) {
      setOpenIds((current) => {
        const next = new Set(current);
        if (next.has(item.id)) next.delete(item.id);
        else next.add(item.id);
        return next;
      });
    }
    onSelect?.(item);
  }

  return (
    <li>
      <button
        type="button"
        onClick={handleClick}
        className={`flex w-full items-center gap-2 rounded-md px-3 py-2 text-left transition-colors ${selected ? "bg-control-accent-soft text-accent" : "text-muted hover:bg-category-hover hover:text-heading"}`}
        aria-expanded={hasChildren ? isOpen : undefined}
      >
        {item.icon ? <span className="w-5 shrink-0 text-center" aria-hidden="true">{item.icon}</span> : null}
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {hasChildren ? <Chevron expanded={isOpen} className={selected ? "text-accent" : "text-muted"} /> : null}
      </button>
      {hasChildren && isOpen ? (
        <ul className="mt-0.5 space-y-0.5 border-l border-category-line pl-3">{item.children.map((child) => <CategoryItem key={child.id} item={child} selectedId={selectedId} onSelect={onSelect} openIds={openIds} setOpenIds={setOpenIds} />)}</ul>
      ) : null}
    </li>
  );
}

export default function CategoryNavigation({ items = [], selectedId, onSelect, className = "" }) {
  const [openIds, setOpenIds] = useState(() => new Set(initialOpen(items)));

  return (
    <nav className={`w-full max-w-sm rounded-xl bg-category p-3 ${className}`} aria-label="Categories">
      <ul className="space-y-0.5">{items.map((item) => <CategoryItem key={item.id} item={item} selectedId={selectedId} onSelect={onSelect} openIds={openIds} setOpenIds={setOpenIds} />)}</ul>
    </nav>
  );
}
