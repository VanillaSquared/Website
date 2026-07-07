"use client";

export default function Tabs({
  tabs = [],
  value,
  onChange,
  line = "full",
  inset = "sm",
  className = "",
  tabClassName = "",
}) {
  const lineClass = line === "content" ? "inline-flex" : "flex w-full";
  const insetClass = inset === "none" ? "" : inset === "md" ? "pl-4" : "pl-2";

  return (
    <div className={`${lineClass} border-b border-divider ${className}`}>
      <div className={`flex ${insetClass}`}>
        {tabs.map((tab) => {
          const active = value === tab.value;

          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => onChange?.(tab.value)}
              className={`relative px-4 pb-3 text-base font-semibold transition-colors ${active ? "text-accent" : "text-muted hover:text-heading"} ${tabClassName}`}
            >
              {tab.label}
              {active ? <span className="absolute right-4 bottom-[-1px] left-4 h-0.5 rounded-full bg-accent" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
