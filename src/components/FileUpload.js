"use client";

import Image from "next/image";
import { useRef, useState } from "react";

import fileIcon from "@cdn/icons/file.svg";
import trashIcon from "@cdn/icons/trash.svg";
import {
  BUG_ATTACHMENT_ALLOWED_EXTENSIONS,
  BUG_ATTACHMENT_MAX_BYTES,
  BUG_ATTACHMENT_MAX_FILES,
  BUG_ATTACHMENT_MAX_TOTAL_BYTES,
  getBugAttachmentExtension,
  isAllowedBugAttachmentName,
} from "@/bugs/config";

function formatFileSize(size) {
  if (!Number.isFinite(size)) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

function fileKey(file, index) {
  return `${file.name}-${file.size}-${file.lastModified}-${index}`;
}

export default function FileUpload({ files = [], onChange, disabled = false, className = "" }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  function addFiles(fileList) {
    const incoming = Array.from(fileList ?? []);
    if (!incoming.length) return;

    const remainingSlots = Math.max(0, BUG_ATTACHMENT_MAX_FILES - files.length);
    if (!remainingSlots) {
      setError(`You can attach up to ${BUG_ATTACHMENT_MAX_FILES} files.`);
      return;
    }

    const accepted = [];
    let acceptedBytes = files.reduce((total, file) => total + file.size, 0);
    let nextError = "";

    for (const file of incoming) {
      if (accepted.length >= remainingSlots) {
        nextError ||= `You can attach up to ${BUG_ATTACHMENT_MAX_FILES} files.`;
        break;
      }

      if (!isAllowedBugAttachmentName(file.name)) {
        nextError ||= `${file.name} is not a supported file type.`;
        continue;
      }

      if (file.size > BUG_ATTACHMENT_MAX_BYTES) {
        nextError ||= `${file.name} is larger than 10 MB.`;
        continue;
      }

      if (acceptedBytes + file.size > BUG_ATTACHMENT_MAX_TOTAL_BYTES) {
        nextError ||= "Attachments can be up to 10 MB combined.";
        continue;
      }

      accepted.push(file);
      acceptedBytes += file.size;
    }

    if (accepted.length) onChange?.([...files, ...accepted]);
    setError(nextError);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeFile(index) {
    onChange?.(files.filter((_, fileIndex) => fileIndex !== index));
    setError("");
  }

  function handleDrop(event) {
    event.preventDefault();
    setDragging(false);
    if (!disabled) addFiles(event.dataTransfer.files);
  }

  const acceptedTypes = BUG_ATTACHMENT_ALLOWED_EXTENSIONS.map((extension) => `.${extension}`).join(",");

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <span className="text-sm font-semibold text-soft">Attachments</span>

      <label
        className={`flex min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-control-border bg-input px-4 py-5 text-center transition-colors hover:border-control-border-hover hover:bg-input-hover ${dragging ? "border-control-border-hover bg-input-focus" : ""} ${disabled ? "pointer-events-none opacity-60" : ""}`}
        onDragEnter={(event) => {
          event.preventDefault();
          if (!disabled) setDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={(event) => {
          if (!event.currentTarget.contains(event.relatedTarget)) setDragging(false);
        }}
        onDrop={handleDrop}
      >
        <Image src={fileIcon} alt="" width={30} height={30} className="mb-1" />
        <span className="text-sm font-semibold text-heading">Drop files here or click to upload</span>
        <span className="text-xs font-normal text-muted">.txt, .log, .png, .json · Max 10 MB combined · Up to 4 files</span>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedTypes}
          multiple
          disabled={disabled}
          className="sr-only"
          onChange={(event) => addFiles(event.target.files)}
        />
      </label>

      {files.length ? (
        <div className="flex flex-col gap-2">
          {files.map((file, index) => {
            const extension = getBugAttachmentExtension(file.name).toUpperCase();
            const metadata = [extension, formatFileSize(file.size)].filter(Boolean).join(" · ");

            return (
              <div
                key={fileKey(file, index)}
                className="flex min-w-0 items-center gap-2 rounded-lg border border-control-border bg-control-panel px-2.5 py-2 text-left"
              >
                <Image src={fileIcon} alt="" width={30} height={30} className="shrink-0" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-heading">{file.name}</span>
                  <span className="mt-0.5 block text-xs font-normal text-muted">{metadata}</span>
                </span>
                <button
                  type="button"
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors hover:bg-control-hover focus-visible:bg-control-hover focus-visible:outline-none"
                  aria-label={`Remove ${file.name}`}
                  title={`Remove ${file.name}`}
                  disabled={disabled}
                  onClick={() => removeFile(index)}
                >
                  <Image src={trashIcon} alt="" width={18} height={18} />
                </button>
              </div>
            );
          })}
        </div>
      ) : null}

      {error ? <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p> : null}
    </div>
  );
}
