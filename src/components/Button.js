const variants = {
  primary: "border-button-primary-outline bg-button-primary text-button-text hover:border-button-primary-outline-hover hover:bg-button-primary-hover",
  secondary: "border-button-secondary-outline bg-button-secondary text-button-text hover:border-button-secondary-outline-hover hover:bg-button-secondary-hover",
  search: "border-search-border bg-search text-heading hover:border-search-border-hover hover:bg-search-hover focus-visible:border-search-focus focus-visible:bg-search-hover focus-visible:outline-none",
  blue: "border-button-blue-outline bg-button-blue text-button-text hover:border-button-blue-outline-hover hover:bg-button-blue-hover",
  purple: "border-button-purple-outline bg-button-purple text-button-text hover:border-button-purple-outline-hover hover:bg-button-purple-hover",
  blurple: "border-button-blurple-outline bg-button-blurple text-button-text hover:border-button-blurple-outline-hover hover:bg-button-blurple-hover"
};

const sizes = {
  sm: "rounded-lg px-2 py-1 text-sm",
  md: "rounded-xl px-4 py-2 text-base",
  icon: "h-9 w-9 rounded-lg p-0 text-sm",
};

function renderIcon(icon, iconAlt) {
  if (!icon) {
    return null;
  }

  if (typeof icon === "string" || icon.src) {
    return (
      <img
        src={typeof icon === "string" ? icon : icon.src}
        alt={iconAlt}
        aria-hidden={iconAlt ? undefined : "true"}
        className="h-4 w-4 shrink-0"
      />
    );
  }

  return icon;
}

export default function Button({
  href,
  children,
  variant = "primary",
  size = "md",
  external = false,
  border = true,
  icon = null,
  iconAlt = "",
  iconPosition = "left",
  className = "",
  ...props
}) {
  const iconElement = renderIcon(icon, iconAlt);
  const borderClass = border ? "border-[2.0px]" : "border-0";

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={`${sizes[size] ?? sizes.md} ${borderClass} inline-flex items-center justify-center gap-2 font-semibold transition-colors ${variants[variant] ?? variants.primary} ${className}`}
      {...props}
    >
      {iconPosition === "left" ? iconElement : null}
      {children}
      {iconPosition === "right" ? iconElement : null}
    </a>
  );
}
