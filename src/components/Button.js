const variants = {
  primary: "border-button-primary-outline bg-button-primary text-button-text hover:border-button-primary-outline-hover hover:bg-button-primary-hover",
  secondary: "border-button-secondary-outline bg-button-secondary text-button-text hover:border-button-secondary-outline-hover hover:bg-button-secondary-hover",
  tertiary: "border-button-tertiary-outline bg-button-tertiary text-button-tertiary-text hover:border-button-tertiary-outline-hover hover:bg-button-tertiary-hover focus-visible:bg-button-tertiary-hover focus-visible:outline-none",
  iconButton: "border-button-tertiary-outline bg-button-tertiary text-button-tertiary-text hover:border-button-tertiary-outline-hover hover:bg-button-tertiary-hover focus-visible:bg-button-tertiary-hover focus-visible:outline-none",
  blue: "border-button-blue-outline bg-button-blue text-button-text hover:border-button-blue-outline-hover hover:bg-button-blue-hover",
  purple: "border-button-purple-outline bg-button-purple text-button-text hover:border-button-purple-outline-hover hover:bg-button-purple-hover",
  blurple: "border-button-blurple-outline bg-button-blurple text-button-text hover:border-button-blurple-outline-hover hover:bg-button-blurple-hover",
  red: "border-button-red-outline bg-button-red text-button-text hover:border-button-red-outline-hover hover:bg-button-red-hover",
  danger: "border-button-red-outline bg-button-red text-button-text hover:border-button-red-outline-hover hover:bg-button-red-hover",
  green: "border-button-green-outline bg-button-green text-button-text hover:border-button-green-outline-hover hover:bg-button-green-hover",
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

function normalizeChatbox(chatbox, chatboxTitle, chatboxDescription, chatboxIcon) {
  if (!chatbox && !chatboxTitle && !chatboxDescription) return null;
  if (typeof chatbox === "string") return { title: chatboxTitle, description: chatbox, icon: chatboxIcon };
  return {
    title: chatbox?.title ?? chatboxTitle,
    description: chatbox?.description ?? chatboxDescription,
    icon: chatbox?.icon ?? chatboxIcon,
    placement: chatbox?.placement,
  };
}

function ButtonChatbox({ chatbox, placement = "above" }) {
  if (!chatbox) return null;

  const icon = renderIcon(chatbox.icon, "", "h-4 w-4");
  const below = placement === "below";
  const positionClasses = below
    ? "top-full mt-2 -translate-y-1 group-hover/button:translate-y-0 group-focus-within/button:translate-y-0"
    : "bottom-full mb-2 translate-y-1 group-hover/button:translate-y-0 group-focus-within/button:translate-y-0";
  const arrowClasses = below
    ? "bottom-full -translate-x-1/2 translate-y-1/2 rotate-45 border-t border-l"
    : "top-full -translate-x-1/2 -translate-y-1/2 rotate-45 border-r border-b";

  return (
    <span
      className={`pointer-events-none absolute left-1/2 z-20 min-w-max max-w-64 -translate-x-1/2 scale-95 rounded-lg border border-divider bg-card px-3 py-2 text-left text-sm opacity-0 shadow-lg transition-all duration-150 ease-out group-hover/button:scale-100 group-hover/button:opacity-100 group-focus-within/button:scale-100 group-focus-within/button:opacity-100 ${positionClasses}`}
      role="tooltip"
    >
      {chatbox.title ? (
        <span className="flex items-center justify-center gap-2 whitespace-nowrap font-semibold text-heading">
          {icon}
          {chatbox.title}
        </span>
      ) : null}
      {chatbox.description ? <span className={`${chatbox.title ? "mt-1" : ""} block whitespace-nowrap font-normal text-muted`}>{chatbox.description}</span> : null}
      <span className={`absolute left-1/2 h-3 w-3 border-divider bg-card ${arrowClasses}`} aria-hidden="true" />
    </span>
  );
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
  chatbox,
  chatboxTitle,
  chatboxDescription,
  chatboxIcon,
  chatboxPlacement = "above",
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
  const normalizedChatbox = normalizeChatbox(chatbox, chatboxTitle, chatboxDescription, chatboxIcon);

  const buttonElement = (!href || isLocked || disabled) ? (
    <button type={type} className={classes} disabled={disabled || isLocked} {...props}>
      {content}
    </button>
  ) : (
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

  if (!normalizedChatbox) {
    return buttonElement;
  }

  return (
    <span className="group/button relative inline-flex overflow-visible">
      <ButtonChatbox chatbox={normalizedChatbox} placement={normalizedChatbox.placement ?? chatboxPlacement} />
      {buttonElement}
    </span>
  );
}
