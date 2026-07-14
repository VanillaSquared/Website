"use client";

import Image from "next/image";
import { useState } from "react";

import fileIcon from "@/assets/icons/file.svg";
import folderIcon from "@/assets/icons/folder.svg";
import Chevron from "@/components/Chevron";

function collectOpenIds(nodes, result = []) {
  for (const node of nodes) {
    if (node.type !== "file" && node.defaultOpen !== false) result.push(node.id);
    if (node.children) collectOpenIds(node.children, result);
  }
  return result;
}

function TreeNode({ node, depth, openIds, setOpenIds, onSelect }) {
  const isFolder = node.type !== "file";
  const isOpen = openIds.has(node.id);

  function activate() {
    if (isFolder) {
      setOpenIds((current) => {
        const next = new Set(current);
        if (next.has(node.id)) next.delete(node.id);
        else next.add(node.id);
        return next;
      });
    }
    onSelect?.(node);
  }

  return (
    <li>
      <button
        type="button"
        onClick={activate}
        className="flex w-full items-center gap-2 rounded px-2 py-1 text-left font-mono text-sm text-soft transition-colors hover:bg-tree-hover hover:text-heading"
        style={{ paddingLeft: `${depth * 30 + 8}px` }}
        aria-expanded={isFolder ? isOpen : undefined}
      >
        <span className="flex w-3 shrink-0 justify-center text-muted">{isFolder ? <Chevron expanded={isOpen} /> : null}</span>
        <Image src={isFolder ? folderIcon : fileIcon} alt="" width={20} height={20} />
        <span>{node.label}</span>
      </button>
      {isFolder && isOpen && node.children?.length ? (
        <ul>{node.children.map((child) => <TreeNode key={child.id} node={child} depth={depth + 1} openIds={openIds} setOpenIds={setOpenIds} onSelect={onSelect} />)}</ul>
      ) : null}
    </li>
  );
}

export default function FileTree({ nodes = [], onSelect, className = "" }) {
  const [openIds, setOpenIds] = useState(() => new Set(collectOpenIds(nodes)));

  return (
    <div className={`rounded-xl border border-tree-border bg-tree p-4 ${className}`}>
      <ul>{nodes.map((node) => <TreeNode key={node.id} node={node} depth={0} openIds={openIds} setOpenIds={setOpenIds} onSelect={onSelect} />)}</ul>
    </div>
  );
}
