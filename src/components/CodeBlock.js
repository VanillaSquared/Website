"use client";

import { useState } from "react";

export default function CodeBlock({ children, code, language, className = "" }) {
  const [copied, setCopied] = useState(false);
  const contents = String(code ?? children ?? "");

  async function copyContents() {
    try {
      await navigator.clipboard.writeText(contents);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className={`group relative w-fit max-w-full overflow-hidden rounded-lg border border-code-border bg-code ${className}`}>
      <pre className="overflow-x-auto px-5 py-4 font-mono text-sm leading-6 text-code-text"><code className={language ? `language-${language}` : undefined}>{contents}</code></pre>
      <button
        type="button"
        onClick={copyContents}
        className="absolute right-4 bottom-3 rounded px-1 py-0.5 text-base text-code-copy opacity-0 transition-colors group-hover:opacity-100 hover:text-heading focus:opacity-100 focus:outline-none"
        aria-label={copied ? "Code copied" : "Copy code"}
      >
        {copied ? "Copied" : "Copy"}
      </button>
    </div>
  );
}
