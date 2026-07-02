const variants = {
  primary:
    "border-button-primary-outline bg-button-primary text-button-text hover:border-button-primary-outline-hover hover:bg-button-primary-hover",
  secondary:
    "border-button-secondary-outline bg-button-secondary text-button-text hover:border-button-secondary-outline-hover hover:bg-button-secondary-hover",
  blue:
    "border-button-blue-outline bg-button-blue text-button-text hover:border-button-blue-outline-hover hover:bg-button-blue-hover",
  purple:
    "border-button-purple-outline bg-button-purple text-button-text hover:border-button-purple-outline-hover hover:bg-button-purple-hover",
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
      className={`${sizes[size] ?? sizes.md} border font-semibold transition-colors ${variants[variant] ?? variants.primary}`}
    >
      {children}
    </a>
  );
}
