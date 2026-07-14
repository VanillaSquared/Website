export default function Chevron({ expanded = false, className = "" }) {
  return (
    <span
      aria-hidden="true"
      className={`h-2 w-2 shrink-0 border-r-2 border-b-2 border-current transition-transform ${expanded ? "rotate-45" : "-rotate-45"} ${className}`}
    />
  );
}
