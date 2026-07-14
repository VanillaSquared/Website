function isPng(file) {
  return String(file?.extension ?? "").toLowerCase().replace(/^\./, "") === "png";
}

function imageSource(href) {
  return `${href}${href.includes("?") ? "&" : "?"}inline=1`;
}

export default function AttachmentText({ value, files = [], getHref, className = "" }) {
  const text = String(value ?? "");
  const references = files
    .filter((file) => isPng(file) && file.originalName)
    .map((file) => ({ file, mention: `@${file.originalName}` }))
    .sort((left, right) => right.mention.length - left.mention.length);

  if (!references.length) {
    return <div className={`whitespace-pre-wrap break-words text-soft ${className}`}>{text}</div>;
  }

  const parts = [];
  let cursor = 0;

  while (cursor < text.length) {
    let nextReference = null;
    let nextIndex = -1;

    for (const reference of references) {
      const index = text.indexOf(reference.mention, cursor);
      if (index !== -1 && (nextIndex === -1 || index < nextIndex)) {
        nextReference = reference;
        nextIndex = index;
      }
    }

    if (!nextReference) {
      parts.push(<span key={`text-${cursor}`} className="whitespace-pre-wrap">{text.slice(cursor)}</span>);
      break;
    }

    if (nextIndex > cursor) {
      parts.push(<span key={`text-${cursor}`} className="whitespace-pre-wrap">{text.slice(cursor, nextIndex)}</span>);
    }

    const href = getHref?.(nextReference.file);
    if (href) {
      parts.push(
        <a
          key={`image-${nextReference.file.id}-${nextIndex}`}
          href={href}
          className="my-2 block w-fit max-w-full rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-control-accent"
          aria-label={`Download ${nextReference.file.originalName}`}
        >
          <img
            src={imageSource(href)}
            alt={nextReference.file.originalName}
            loading="lazy"
            className="max-h-[32rem] max-w-full rounded-xl border border-divider object-contain"
          />
        </a>,
      );
    } else {
      parts.push(<span key={`mention-${nextIndex}`}>{nextReference.mention}</span>);
    }

    cursor = nextIndex + nextReference.mention.length;
  }

  return <div className={`break-words text-soft ${className}`}>{parts}</div>;
}
