function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value)) return "Unknown size";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function formatType(extension) {
  const type = String(extension ?? "").replace(/^\./, "").toUpperCase();
  return type ? `${type} file` : "File";
}

export default function AttachmentList({ files = [], bugPublicId, className = "" }) {
  return (
    <section className={className} aria-labelledby="bug-attachments-heading">
      <h2 id="bug-attachments-heading" className="text-base font-semibold text-heading">Attachments</h2>
      {files.length ? (
        <ul className="mt-2 divide-y divide-divider overflow-hidden rounded-xl border border-divider bg-control px-4">
          {files.map((file) => (
            <li key={file.id} className="flex min-w-0 items-center gap-3 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-soft">{file.originalName}</p>
                <p className="mt-0.5 text-xs text-muted">{formatBytes(file.sizeBytes)} · {formatType(file.extension)}</p>
              </div>
              <a
                href={`/api/bugs/${encodeURIComponent(bugPublicId)}/files/${encodeURIComponent(file.id)}`}
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-lg font-semibold text-accent transition-colors hover:bg-control-hover focus-visible:bg-control-hover focus-visible:outline-none"
                aria-label={`Download ${file.originalName}`}
                title={`Download ${file.originalName}`}
              >
                <span aria-hidden="true">↓</span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-sm text-muted">No attachments were uploaded.</p>
      )}
    </section>
  );
}
