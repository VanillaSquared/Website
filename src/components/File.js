import Image from "next/image";

import downloadIcon from "@cdn/icons/download.svg";
import fileIcon from "@cdn/icons/file.svg";

function fileNameFromHref(href) {
  if (!href) return "File";

  try {
    const pathname = new URL(href, "https://vanillasquared.local").pathname;
    return decodeURIComponent(pathname.split("/").filter(Boolean).at(-1) || "File");
  } catch {
    return "File";
  }
}

function formatFileSize(size) {
  if (typeof size === "string") return size;
  if (!Number.isFinite(size)) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function fileTypeFromName(name) {
  const extension = name.includes(".") ? name.split(".").at(-1) : "";
  return extension ? extension.toUpperCase() : "File";
}

export default function File({
  href,
  name,
  type,
  size,
  description,
  download = true,
  className = "",
  ...props
}) {
  const displayName = name || fileNameFromHref(href);
  const formattedSize = formatFileSize(size);
  const metadata = [type || fileTypeFromName(displayName), formattedSize].filter(Boolean).join(" · ");
  const Component = href ? "a" : "div";
  const linkProps = href
    ? {
        href,
        download: download === true ? displayName : download || undefined,
      }
    : {};

  return (
    <Component
      className={`inline-flex w-fit max-w-full min-w-0 items-center gap-2 rounded-lg border border-control-border bg-control-panel px-2.5 py-2 text-left transition-colors ${href ? "hover:border-control-border-hover hover:bg-control-hover" : ""} ${className}`}
      {...linkProps}
      {...props}
    >
      <Image src={fileIcon} alt="" width={30} height={30} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-heading">{displayName}</span>
        {description ? <span className="mt-0.5 block text-xs text-muted">{description}</span> : null}
        <span className="mt-0.5 block text-xs font-normal text-muted">{metadata}</span>
      </span>
      {href ? <Image src={downloadIcon} alt="" width={22} height={22} className="shrink-0" /> : null}
    </Component>
  );
}
