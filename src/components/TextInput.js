"use client";

import { useLayoutEffect, useRef, useState } from "react";

const inputClasses =
  "rounded-lg border border-input-border bg-input px-3 py-2 text-heading outline-none transition-colors placeholder:text-input-sample placeholder:italic hover:border-input-border-hover hover:bg-input-hover focus:border-input-border-focus focus:bg-input-focus";

function normalizeLineCount(value, fallback) {
  const lineCount = Number(value);

  if (!Number.isFinite(lineCount)) {
    return fallback;
  }

  return Math.max(1, Math.floor(lineCount));
}

function getLineBoxHeight(element) {
  const style = window.getComputedStyle(element);
  const lineHeight = Number.parseFloat(style.lineHeight) || 24;
  const padding = Number.parseFloat(style.paddingTop) + Number.parseFloat(style.paddingBottom);
  const border = Number.parseFloat(style.borderTopWidth) + Number.parseFloat(style.borderBottomWidth);

  return { lineHeight, padding, border };
}

function normalizeCharacterLimit(value) {
  if (value == null) {
    return null;
  }

  const characterLimit = Number(value);

  if (!Number.isFinite(characterLimit)) {
    return null;
  }

  return Math.max(0, Math.floor(characterLimit));
}

function getCharacterCount(value) {
  return String(value ?? "").length;
}

export default function TextInput({
  label,
  sampleText = "",
  className = "",
  inputClassName = "",
  id,
  name,
  type = "text",
  lines = 1,
  maxLines,
  maxCharacters,
  maxCharacterLimit,
  maxLength,
  allowBrowserExtensions = false,
  useOnePassword,
  onInput,
  style,
  value,
  defaultValue,
  ...props
}) {
  const textareaRef = useRef(null);
  const [uncontrolledCharacterCount, setUncontrolledCharacterCount] = useState(getCharacterCount(defaultValue));
  const inputId = id ?? name;
  const browserExtensionsEnabled = useOnePassword ?? allowBrowserExtensions;
  const visibleLines = normalizeLineCount(lines, 1);
  const maxVisibleLines = maxLines == null ? null : Math.max(visibleLines, normalizeLineCount(maxLines, visibleLines));
  const isMultiline = visibleLines > 1 || maxVisibleLines != null;
  const browserExtensionProps = !browserExtensionsEnabled ? { "data-1p-ignore": "true" } : {};
  const characterLimit = normalizeCharacterLimit(maxCharacters ?? maxCharacterLimit ?? maxLength);
  const characterCount = value != null ? getCharacterCount(value) : uncontrolledCharacterCount;
  const showCharacterLimit = characterLimit != null;

  function resizeTextarea(textarea) {
    if (!textarea || maxVisibleLines == null) {
      return;
    }

    const { lineHeight, padding, border } = getLineBoxHeight(textarea);
    const minHeight = visibleLines * lineHeight + padding + border;
    const maxHeight = maxVisibleLines * lineHeight + padding + border;

    textarea.style.minHeight = `${minHeight}px`;
    textarea.style.maxHeight = `${maxHeight}px`;
    textarea.style.height = "auto";

    const nextHeight = Math.min(textarea.scrollHeight + border, maxHeight);
    textarea.style.height = `${Math.max(minHeight, nextHeight)}px`;
    textarea.style.overflowY = textarea.scrollHeight + border > maxHeight ? "auto" : "hidden";
  }

  useLayoutEffect(() => {
    resizeTextarea(textareaRef.current);
  }, [value, defaultValue, visibleLines, maxVisibleLines]);

  function handleInput(event) {
    setUncontrolledCharacterCount(event.currentTarget.value.length);
    resizeTextarea(event.currentTarget);
    onInput?.(event);
  }

  return (
    <label className={`flex flex-col gap-2 text-sm font-semibold text-soft ${className}`}>
      {label}
      {isMultiline ? (
        <textarea
          ref={textareaRef}
          id={inputId}
          name={name}
          placeholder={sampleText}
          rows={visibleLines}
          className={`${inputClasses} resize-none ${inputClassName}`}
          style={style}
          value={value}
          defaultValue={defaultValue}
          maxLength={characterLimit ?? undefined}
          onInput={handleInput}
          {...browserExtensionProps}
          {...props}
        />
      ) : (
        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={sampleText}
          className={`${inputClasses} ${inputClassName}`}
          style={style}
          value={value}
          defaultValue={defaultValue}
          maxLength={characterLimit ?? undefined}
          onInput={handleInput}
          {...browserExtensionProps}
          {...props}
        />
      )}
      {showCharacterLimit ? (
        <span className="self-end text-xs font-normal text-muted">
          {characterCount}/{characterLimit}
        </span>
      ) : null}
    </label>
  );
}
