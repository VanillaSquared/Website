import { formatEuropeanDateTime } from "@/utils/dateTime";

export default function ChatBox({
  author = "Unknown",
  avatarUrl,
  authorUrl,
  createdAt,
  edited = false,
  children,
  className = "",
}) {
  const timestamp = formatEuropeanDateTime(
    createdAt,
    { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "UTC" },
    "Unknown time"
  );

  const authorContent = authorUrl ? (
    <a href={authorUrl} className="font-semibold text-heading transition-colors hover:text-accent" target="_blank" rel="noreferrer">
      {author}
    </a>
  ) : (
    <span className="font-semibold text-heading">{author}</span>
  );

  return (
    <article className={`flex items-start gap-3 ${className}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={`${author} avatar`} className="mt-5 h-9 w-9 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="mt-5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-control text-xs font-semibold text-muted" aria-hidden="true">
          {author.slice(0, 1).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="mb-1 flex flex-wrap items-baseline gap-x-2 gap-y-1 px-1 text-xs text-muted">
          {authorContent}
          <time dateTime={createdAt}>{timestamp}</time>
          {edited ? <span className="text-subtle">edited</span> : null}
        </header>
        <div className="inline-block max-w-full rounded-2xl rounded-tl-md bg-control px-4 py-3 text-sm text-soft">
          {children}
        </div>
      </div>
    </article>
  );
}
