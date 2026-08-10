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
    <article className={`flex gap-3 rounded-xl border border-divider bg-card p-4 ${className}`}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={`${author} avatar`} className="h-10 w-10 shrink-0 rounded-full object-cover" />
      ) : (
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-control text-sm font-semibold text-muted" aria-hidden="true">
          {author.slice(0, 1).toUpperCase()}
        </div>
      )}

      <div className="min-w-0 flex-1">
        <header className="mb-2 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-xs text-muted">
          {authorContent}
          <time dateTime={createdAt}>{timestamp}</time>
          {edited ? <span className="text-subtle">edited</span> : null}
        </header>
        <div className="min-w-0 text-sm text-soft">{children}</div>
      </div>
    </article>
  );
}
