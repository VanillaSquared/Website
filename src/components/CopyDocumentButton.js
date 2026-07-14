"use client";

import { useState } from "react";

import copyIcon from "@/assets/icons/copy.svg";
import Button from "@/components/Button";

export default function CopyDocumentButton({ source }) {
  const [copied, setCopied] = useState(false);

  async function copyDocument() {
    try {
      await navigator.clipboard.writeText(source);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <Button
      variant="tertiary"
      size="sm"
      icon={copyIcon}
      onClick={copyDocument}
      aria-label={copied ? "Markdown copied" : "Copy page Markdown"}
    >
      {copied ? "Copied" : "Copy page"}
    </Button>
  );
}
