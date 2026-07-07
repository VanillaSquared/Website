"use client";

export default function Tabs({
  tabs = [],
  value,
  onChange,
  line = "full",
  className = "",
  tabClassName = "",
}) {
  const lineClass = line === "content" ? "inline-flex" : "flex w-full";

  return (
    <div className={`${lineClass} border-b border-divider ${className}`}>
      <div className="flex gap-9">
        {tabs.map((tab) => {
          const active = value === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange?.(tab.value)}
              className={`relative pb-3 text-base font-semibold transition-colors ${active ? "text-accent" : "text-muted hover:text-heading"} ${tabClassName}`}
            >
              {tab.label}
              {active ? <span className="absolute right-0 bottom-[-1px] left-0 h-0.5 rounded-full bg-accent" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
