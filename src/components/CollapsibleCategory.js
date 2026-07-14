"use client";

import { useState } from "react";

import Chevron from "@/components/Chevron";

export default function CollapsibleCategory({
  title,
  icon,
  id,
  defaultOpen = false,
  children,
  className = "",
  headerClassName = "",
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section id={id} className={`scroll-mt-24 rounded-md border border-category-card-border bg-category-card ${className}`}>
      <div className={`flex items-center gap-3 px-4 py-3 ${headerClassName}`}>
        <button
          type="button"
          onClick={() => setOpen((current) => !current)}
          className="flex min-w-0 flex-1 items-center gap-3 text-left text-heading focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          aria-expanded={open}
        >
          <span className="flex w-4 justify-center text-soft"><Chevron expanded={open} /></span>
          {icon ? <span aria-hidden="true">{icon}</span> : null}
          <span className="text-base font-semibold">{title}</span>
        </button>
      </div>
      {open ? <div className="border-t border-category-card-border px-3 pb-3">{children}</div> : null}
    </section>
  );
}
