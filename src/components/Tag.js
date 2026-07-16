const variants = {
  default: "border-transparent bg-tag text-soft",
  subtle: "border-divider bg-tag text-muted",
  accent: "border-accent/30 bg-accent/10 text-heading",
  low: "border-[var(--vsq-tag-low-border)] bg-[var(--vsq-tag-low-bg)] text-[var(--vsq-tag-low-text)]",
  medium: "border-[var(--vsq-tag-medium-border)] bg-[var(--vsq-tag-medium-bg)] text-[var(--vsq-tag-medium-text)]",
  high: "border-[var(--vsq-tag-high-border)] bg-[var(--vsq-tag-high-bg)] text-[var(--vsq-tag-high-text)]",
  codeRed: "border-[var(--vsq-tag-code-red-border)] bg-[var(--vsq-tag-code-red-bg)] text-[var(--vsq-tag-code-red-text)]",
  locked: "cursor-not-allowed border-[var(--vsq-locked-border)] bg-[var(--vsq-locked-bg)] text-[var(--vsq-locked-text)]",
};

export default function Tag({ children, variant = "default", color, bordered = false, className = "" }) {
  const borderClass = bordered ? "border" : "border";
  const colorProps = color ? { className: "role-color-tag", style: { "--role-color": color } } : { className: variants[variant] ?? variants.default };

  return (
    <span style={colorProps.style} className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${borderClass} ${colorProps.className} ${className}`}>
      {children}
    </span>
  );
}
