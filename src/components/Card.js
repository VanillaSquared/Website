import { formatEuropeanDateTime } from "@/utils/dateTime";

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
  details: {
    size: "popup",
    titleAs: "h1",
    className: "rounded-2xl border-divider",
    titleClassName: "text-3xl font-bold text-heading",
    contentClassName: "mt-6",
    hoverAccent: false,
  },
  info: {
    size: "p-0",
    className: "overflow-hidden rounded-lg !border border-category-card-border",
    titleClassName: "bg-category-selected px-4 py-3 text-center text-base font-semibold text-heading",
    contentClassName: "m-0",
    hoverAccent: false,
  },
  imgCard: {
    size: "p-0",
    className: "block overflow-hidden rounded-xl !border border-img-card bg-img-card-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    titleClassName: "px-4 pb-2 pt-3 text-base font-semibold leading-snug text-heading",
    contentClassName: "px-4 pb-4",
    hoverAccent: true,
  },
};

export function NewsCard({ author, authorImage, publishedAt, className = "", ...props }) {
  if (!author) return null;

  const publishedDate = formatEuropeanDateTime(publishedAt, { dateStyle: "medium", timeZone: "UTC" }, "Unknown");

  return (
    <Card
      {...props}
      preset="imgCard"
      title="Written By"
      titleAs="p"
      titleClassName="!px-2 !pb-0 !pt-3 text-center !text-sm"
      media={authorImage ? <img src={authorImage} alt={`${author} author portrait`} /> : null}
      hoverAccent={false}
      className={`w-32 shrink-0 ${className}`}
      contentClassName="!px-2 !pb-3 text-center"
    >
      <p className="break-words text-xs leading-tight text-muted">{author}</p>
      <p className="mt-2 text-sm font-semibold leading-tight text-heading">Published</p>
      <time dateTime={publishedAt} className="mt-0.5 block text-xs leading-tight text-muted">{publishedDate}</time>
    </Card>
  );
}

export default function Card({
  title,
  description,
  error,
  footer,
  media,
  mediaAlt,
  details = [],
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
  const isInfoCard = preset === "info";
  const isImgCard = preset === "imgCard";
  const titleContent = title ? (
    <TitleComponent className={`${presetConfig.titleClassName ?? ""} ${titleClassName}`}>
      {title}
    </TitleComponent>
  ) : null;
  const mediaContent = media ? (
    <div
      className={`flex justify-center ${isInfoCard ? "" : isImgCard ? "aspect-[16/9] overflow-hidden bg-img-card-image [&>img]:h-full [&>img]:w-full [&>img]:object-cover" : "bg-category p-4"}`}
      aria-label={mediaAlt || undefined}
    >
      {media}
    </div>
  ) : null;

  return (
    <Component
      className={`border-2 bg-card transition-colors ${sizes[selectedSize] ?? selectedSize} ${hoverClass} ${presetConfig.className ?? ""} ${className}`}
      {...props}
    >
      {isImgCard ? mediaContent : titleContent}
      {isImgCard ? titleContent : mediaContent}
      {description ? (
        <p className={`${isInfoCard ? "border-t border-category-card-border px-4 py-3" : "mt-2"} text-sm text-muted ${descriptionClassName}`}>{description}</p>
      ) : null}
      {details.length ? (
        <dl className="border-t border-category-card-border text-sm">
          {details.map((detail, index) => (
            <div key={`${detail.label}-${index}`} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 border-b border-category-card-border px-4 py-2.5 last:border-b-0">
              <dt className="font-medium text-accent">{detail.label}</dt>
              <dd className="min-w-0 text-soft">{detail.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      {error ? <p className="mt-4 rounded-lg bg-error-surface px-4 py-3 text-sm text-error">{error}</p> : null}
      {children ? <div className={`${presetConfig.contentClassName ?? ""} ${contentClassName}`}>{children}</div> : null}
      {footer ? <div className={`${isInfoCard ? "border-t border-category-card-border px-4 py-3" : "mt-6 text-center"} text-sm text-muted ${footerClassName}`}>{footer}</div> : null}
    </Component>
  );
}
