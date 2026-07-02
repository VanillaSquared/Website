const variants = {
  primary:
    "bg-[#B36BB3] text-white hover:bg-[#9E5F9E]",
  secondary:
    "bg-[#3b4658] text-white hover:bg-[#4a5870]",
};

const sizes = {
  sm: "rounded-md px-4 py-2 text-sm",
  md: "rounded-lg px-6 py-3 text-base",
};

export default function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  external = false,
}) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`${sizes[size] ?? sizes.md} font-semibold transition-colors ${variants[variant] ?? variants.primary}`}
    >
      {children}
    </a>
  );
}
