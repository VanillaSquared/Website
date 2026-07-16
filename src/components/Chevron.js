export default function Chevron({ expanded = false, thick = false, className = "" }) {
  const thickness = thick ? "border-r-[3px] border-b-[3px]" : "border-r-2 border-b-2";

  return (
    <span
      aria-hidden="true"
      className={`h-2 w-2 shrink-0 border-current transition-transform ${thickness} ${expanded ? "rotate-45" : "-rotate-45"} ${className}`}
    />
  );
}
