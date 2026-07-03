const sizes = {
  sm: "p-4",
  md: "p-6",
  lg: "p-8",
  popup: "w-full max-w-md p-8",
};

const presets = {
  homepage: {
    size: "md",
    className: "rounded-xl border-transparent",
    titleClassName: "text-lg font-semibold text-accent",
    hoverAccent: true,
  },
  auth: {
    size: "popup",
    titleAs: "h1",
    className: "rounded-2xl border-divider",
    titleClassName: "text-3xl font-bold text-heading",
    contentClassName: "mt-6",
    hoverAccent: false,
  },
};

export default function Card({
  title,
  description,
  error,
  footer,
  children,
  as: Component = "div",
  titleAs,
  preset = "homepage",
  size,
  className = "",
  titleClassName = "",
  descriptionClassName = "",
  contentClassName = "",
  footerClassName = "",
  hoverAccent,
  ...props
}) {
  const presetConfig = presets[preset] ?? presets.homepage;
  const TitleComponent = titleAs ?? presetConfig.titleAs ?? "h3";
  const selectedSize = size ?? presetConfig.size ?? "md";
  const shouldHoverAccent = hoverAccent ?? presetConfig.hoverAccent ?? true;
  const hoverClass = shouldHoverAccent ? "hover:border-accent" : "";

  return (
    <Component
      className={`border-2 bg-card transition-colors ${sizes[selectedSize] ?? selectedSize} ${hoverClass} ${presetConfig.className ?? ""} ${className}`}
      {...props}
    >
      {title ? (
        <TitleComponent className={`${presetConfig.titleClassName ?? ""} ${titleClassName}`}>
          {title}
        </TitleComponent>
      ) : null}
      {description ? (
        <p className={`mt-2 text-sm text-muted ${descriptionClassName}`}>{description}</p>
      ) : null}
      {error ? <p className="mt-4 rounded-lg bg-error-surface px-4 py-3 text-sm text-error">{error}</p> : null}
      {children ? <div className={`${presetConfig.contentClassName ?? ""} ${contentClassName}`}>{children}</div> : null}
      {footer ? <div className={`mt-6 text-center text-sm text-muted ${footerClassName}`}>{footer}</div> : null}
    </Component>
  );
}
