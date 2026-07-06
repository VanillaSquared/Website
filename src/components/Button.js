const variants = {
  primary: "border-button-primary-outline bg-button-primary text-button-text hover:border-button-primary-outline-hover hover:bg-button-primary-hover",
  secondary: "border-button-secondary-outline bg-button-secondary text-button-text hover:border-button-secondary-outline-hover hover:bg-button-secondary-hover",
  tertiary: "border-button-tertiary-outline bg-button-tertiary text-button-tertiary-text hover:border-button-tertiary-outline-hover hover:bg-button-tertiary-hover focus-visible:bg-button-tertiary-hover focus-visible:outline-none",
  iconButton: "border-button-tertiary-outline bg-button-tertiary text-button-tertiary-text hover:border-button-tertiary-outline-hover hover:bg-button-tertiary-hover focus-visible:bg-button-tertiary-hover focus-visible:outline-none",
  blue: "border-button-blue-outline bg-button-blue text-button-text hover:border-button-blue-outline-hover hover:bg-button-blue-hover",
  purple: "border-button-purple-outline bg-button-purple text-button-text hover:border-button-purple-outline-hover hover:bg-button-purple-hover",
  blurple: "border-button-blurple-outline bg-button-blurple text-button-text hover:border-button-blurple-outline-hover hover:bg-button-blurple-hover",
  locked: "border-locked-border bg-locked text-locked-text cursor-not-allowed"
};

const variantBorders = {
  tertiary: false,
  iconButton: false,
};

const sizes = {
  sm: "rounded-lg px-2 py-1 text-sm",
  md: "rounded-xl px-4 py-2 text-base",
  icon: "h-9 w-9 rounded-lg p-0 text-sm",
  iconButton: "h-10 w-10 rounded-full p-0 text-sm",
};

function renderIcon(icon, iconAlt, iconClassName = "h-4 w-4") {
  if (!icon) {
    return null;
  }

  if (typeof icon === "string" || icon.src) {
    const iconSrc = typeof icon === "string" ? icon : icon.src;

    if (!iconAlt && iconSrc.endsWith(".svg")) {
      return (
        <span
          aria-hidden="true"
          className={`${iconClassName} shrink-0 bg-current`}
          style={{
            WebkitMask: `url(${iconSrc}) center / contain no-repeat`,
            mask: `url(${iconSrc}) center / contain no-repeat`,
          }}
        />
      );
    }

    return (
      <img
        src={iconSrc}
        alt={iconAlt}
        aria-hidden={iconAlt ? undefined : "true"}
        className={`${iconClassName} shrink-0`}
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
  border,
  icon = null,
  iconAlt = "",
  iconClassName,
  iconPosition = "left",
  className = "",
  type = "button",
  locked = false,
  disabled = false,
  ...props
}) {
  const isLocked = locked || variant === "locked";
  const iconElement = renderIcon(icon, iconAlt, iconClassName);
  const hasBorder = border ?? variantBorders[variant] ?? true;
  const borderClass = hasBorder ? "border-[2.0px]" : "border-0";
  const content = (
    <>
      {iconPosition === "left" ? iconElement : null}
      {children}
      {iconPosition === "right" ? iconElement : null}
    </>
  );
  const classes = `${sizes[size] ?? sizes.md} ${borderClass} inline-flex items-center justify-center gap-2 font-semibold transition-colors ${variants[isLocked ? "locked" : variant] ?? variants.primary} ${disabled && !isLocked ? "cursor-not-allowed opacity-60" : ""} ${className}`;

  if (!href || isLocked || disabled) {
    return (
      <button type={type} className={classes} disabled={disabled || isLocked} {...props}>
        {content}
      </button>
    );
  }

  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noopener noreferrer" : undefined}
      className={classes}
      {...props}
    >
      {content}
    </a>
  );
}
