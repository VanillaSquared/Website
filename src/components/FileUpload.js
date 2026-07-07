"use client";

import { useId, useMemo, useRef, useState } from "react";

function renameFile(file, nextName) {
  return new File([file], nextName || file.name, {
    type: file.type,
    lastModified: file.lastModified,
  });
}

function formatBytes(bytes) {
  if (!Number.isFinite(bytes)) {
    return "";
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function normalizeFileTypes(fileTypes, accept) {
  const types = fileTypes ?? accept;

  if (Array.isArray(types)) {
    return types.join(",");
  }

  return types ?? undefined;
}

function fileMatchesType(file, acceptedTypes) {
  if (!acceptedTypes) {
    return true;
  }

  const rules = acceptedTypes.split(",").map((rule) => rule.trim().toLowerCase()).filter(Boolean);
  const fileName = file.name.toLowerCase();
  const fileType = file.type.toLowerCase();

  return rules.some((rule) => {
    if (rule.startsWith(".")) {
      return fileName.endsWith(rule);
    }

    if (rule.endsWith("/*")) {
      return fileType.startsWith(rule.slice(0, -1));
    }

    return fileType === rule;
  });
}

export default function FileUpload({
  label = "Upload file",
  description = "Drag and drop a file here, or browse.",
  accept,
  fileTypes,
  maxFileSize = Infinity,
  maxFiles,
  multiple = false,
  name,
  id,
  onChange,
  className = "",
  compact = false,
  showBrowseButton = true,
  locked = false,
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef(null);
  const [files, setFiles] = useState([]);
  const [errors, setErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const acceptedTypes = useMemo(() => normalizeFileTypes(fileTypes, accept), [fileTypes, accept]);
  const fileLimit = maxFiles ?? (multiple ? Infinity : 1);
  const fileLimitText = Number.isFinite(fileLimit) ? fileLimit : "Unlimited";
  const fileSizeLimitText = Number.isFinite(maxFileSize) ? formatBytes(maxFileSize) : "Any";
  const acceptedTypesText = acceptedTypes || "Any";

  function syncFiles(nextFiles, event, nextErrors = []) {
    setFiles(nextFiles);
    setErrors(nextErrors);

    if (inputRef.current) {
      const dataTransfer = new DataTransfer();
      nextFiles.forEach((file) => dataTransfer.items.add(file));
      inputRef.current.files = dataTransfer.files;
    }

    onChange?.(nextFiles, event);
  }

  function validateFiles(nextFiles) {
    const nextErrors = [];
    const validFiles = [];

    nextFiles.forEach((file) => {
      if (!fileMatchesType(file, acceptedTypes)) {
        nextErrors.push(`${file.name} is not an allowed file type.`);
        return;
      }

      if (file.size > maxFileSize) {
        nextErrors.push(`${file.name} is larger than ${formatBytes(maxFileSize)}.`);
        return;
      }

      validFiles.push(file);
    });

    if (validFiles.length > fileLimit) {
      nextErrors.push(`Only ${fileLimit} file${fileLimit === 1 ? "" : "s"} can be uploaded.`);
    }

    return {
      files: validFiles.slice(0, fileLimit),
      errors: nextErrors,
    };
  }

  function handleFiles(fileList, event) {
    if (locked) {
      return;
    }

    const incomingFiles = Array.from(fileList ?? []);
    const candidateFiles = multiple ? [...files, ...incomingFiles] : incomingFiles.slice(0, 1);
    const result = validateFiles(candidateFiles);
    syncFiles(result.files, event, result.errors);
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);

    if (!locked) {
      handleFiles(event.dataTransfer.files, event);
    }
  }

  function renameUploadedFile(index, nextName) {
    if (!locked) {
      syncFiles(files.map((file, fileIndex) => (fileIndex === index ? renameFile(file, nextName) : file)));
    }
  }

  function deleteUploadedFile(index) {
    if (!locked) {
      syncFiles(files.filter((_, fileIndex) => fileIndex !== index));
    }
  }

  function openFilePicker() {
    if (!locked && !showBrowseButton) {
      inputRef.current?.click();
    }
  }

  function handleUploadAreaKeyDown(event) {
    if (showBrowseButton || locked || !["Enter", " "].includes(event.key)) {
      return;
    }

    event.preventDefault();
    inputRef.current?.click();
  }

  return (
    <div className={`flex flex-col gap-2 text-sm font-semibold text-soft ${className}`}>
      <span>{label}</span>
      <div
        onDragEnter={(event) => {
          event.preventDefault();
          setIsDragging(true);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={openFilePicker}
        onKeyDown={handleUploadAreaKeyDown}
        role={!showBrowseButton ? "button" : undefined}
        tabIndex={!showBrowseButton && !locked ? 0 : undefined}
        className={`flex flex-col items-center justify-center rounded-xl border border-dashed px-5 text-center transition-colors ${compact ? "gap-2 py-4" : "gap-3 py-8"} ${
          locked
            ? "border-locked-input-border bg-locked-input"
            : isDragging
              ? "border-control-accent bg-control-accent-soft"
              : `border-control-border bg-control hover:border-control-border-hover hover:bg-control-hover ${!showBrowseButton ? "cursor-pointer" : ""}`
        }`}
      >
        <span className={`flex items-center justify-center rounded-full bg-control-panel text-control-accent ${compact ? "h-8 w-8 text-xl" : "h-12 w-12 text-2xl"}`}>
          ↑
        </span>
        <span className="text-heading">{description}</span>
        <div className="flex flex-wrap justify-center gap-2 text-xs font-normal text-muted">
          <span>Types: {acceptedTypesText}</span>
          <span>Max size: {fileSizeLimitText}</span>
          <span>Limit: {fileLimitText}</span>
        </div>
        {showBrowseButton ? (
          <label
            htmlFor={locked ? undefined : inputId}
            className={`rounded-lg border px-3 py-1.5 text-xs transition-colors ${locked ? "cursor-not-allowed border-locked-border bg-locked text-locked-text" : "cursor-pointer border-control-border bg-control-panel text-soft hover:border-control-border-hover hover:bg-control-hover hover:text-heading"}`}
          >
            Browse files
          </label>
        ) : null}
        <input
          ref={inputRef}
          id={inputId}
          name={name}
          type="file"
          accept={acceptedTypes}
          multiple={multiple && fileLimit !== 1}
          className="sr-only"
          disabled={locked}
          onChange={(event) => handleFiles(event.target.files, event)}
        />

        {errors.length ? (
          <div className="flex w-full flex-col gap-1 rounded-lg border border-error bg-error-surface p-2 text-left text-xs font-normal text-error">
            {errors.map((error) => (
              <span key={error}>{error}</span>
            ))}
          </div>
        ) : null}

        {files.length ? (
          <div className="flex w-full flex-col gap-2 rounded-xl border border-control-border bg-control-panel p-3 text-left" onClick={(event) => event.stopPropagation()}>
            <span className="text-xs uppercase tracking-wide text-muted">Selected files</span>
            {files.map((file, index) => (
              <div
                key={`${file.name}-${file.lastModified}-${index}`}
                className="flex flex-col gap-2 rounded-lg border border-control-border bg-control p-2 sm:flex-row sm:items-center"
              >
                <input
                  aria-label={`Rename ${file.name}`}
                  value={file.name}
                  onChange={(event) => renameUploadedFile(index, event.target.value)}
                  disabled={locked}
                  className={`min-w-0 flex-1 rounded-md border px-2 py-1 text-sm outline-none transition-colors ${locked ? "cursor-not-allowed border-locked-input-border bg-locked-input text-locked-text" : "border-input-border bg-input text-heading hover:border-input-border-hover focus:border-input-border-focus"}`}
                />
                <span className="text-xs font-normal text-muted sm:w-20 sm:text-right">
                  {formatBytes(file.size)}
                </span>
                <button
                  type="button"
                  onClick={() => deleteUploadedFile(index)}
                  disabled={locked}
                  className={`rounded-md border px-2 py-1 text-xs transition-colors ${locked ? "cursor-not-allowed border-locked-border bg-locked text-locked-text" : "border-control-border bg-control-panel text-soft hover:border-control-border-hover hover:bg-control-hover hover:text-heading"}`}
                >
                  Delete
                </button>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
