const variants = {
  default: "bg-tag text-soft",
  subtle: "bg-tag text-muted",
  accent: "bg-accent/10 text-heading",
  patchnotes: "bg-accent/10 text-[var(--vsq-tag-patchnotes-text)]",
  announcement: "bg-[var(--vsq-tag-announcement-bg)] text-[var(--vsq-tag-announcement-text)]",
  other: "bg-[var(--vsq-tag-other-bg)] text-[var(--vsq-tag-other-text)]",
  low: "bg-[var(--vsq-tag-low-bg)] text-[var(--vsq-tag-low-text)]",
  medium: "bg-[var(--vsq-tag-medium-bg)] text-[var(--vsq-tag-medium-text)]",
  high: "bg-[var(--vsq-tag-high-bg)] text-[var(--vsq-tag-high-text)]",
  codeRed: "bg-[var(--vsq-tag-code-red-bg)] text-[var(--vsq-tag-code-red-text)]",
  locked: "cursor-not-allowed bg-[var(--vsq-locked-bg)] text-[var(--vsq-locked-text)]",
};

export default function Tag({ children, variant = "default", color, className = "" }) {
  const colorProps = color ? { className: "role-color-tag", style: { "--role-color": color } } : { className: variants[variant] ?? variants.default };

  return (
    <span style={colorProps.style} className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold ${colorProps.className} ${className}`}>
      {children}
    </span>
  );
}
