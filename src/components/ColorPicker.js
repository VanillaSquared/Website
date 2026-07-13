"use client";

import { useId, useState } from "react";

const DEFAULT_COLOR = "#c269c2";

function isHexColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export default function ColorPicker({
  label = "Color",
  value,
  defaultValue = DEFAULT_COLOR,
  onChange,
  id,
  className = "",
  locked = false,
  disabled = false,
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [internalValue, setInternalValue] = useState(isHexColor(defaultValue) ? defaultValue.toLowerCase() : DEFAULT_COLOR);
  const currentValue = value ?? internalValue;
  const pickerValue = isHexColor(currentValue) ? currentValue.toLowerCase() : DEFAULT_COLOR;
  const isDisabled = locked || disabled;

  function update(nextValue) {
    if (value == null) setInternalValue(nextValue);
    onChange?.(nextValue);
  }

  function handleTextChange(event) {
    const nextValue = event.target.value.trim().toLowerCase();
    if (/^#[0-9a-f]{0,6}$/.test(nextValue) || nextValue === "") update(nextValue);
  }

  function restoreValidValue() {
    if (!isHexColor(currentValue)) update(pickerValue);
  }

  return (
    <label htmlFor={inputId} className={`block w-44 max-w-full space-y-1.5 ${className}`}>
      <span className="block text-sm font-medium text-soft">{label}</span>
      <span className={`flex items-center gap-2 rounded-lg border px-2 py-2 transition-colors ${isDisabled ? "cursor-not-allowed border-locked-input-border bg-locked-input" : "border-input-border bg-input hover:border-input-border-hover hover:bg-input-hover focus-within:border-input-border-focus focus-within:bg-input-focus"}`}>
        <input
          id={inputId}
          type="color"
          value={pickerValue}
          disabled={isDisabled}
          onChange={(event) => update(event.target.value.toLowerCase())}
          className="h-8 w-10 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0 disabled:cursor-not-allowed"
          aria-label={`${label} picker`}
        />
        <input
          type="text"
          value={currentValue}
          disabled={isDisabled}
          maxLength={7}
          spellCheck={false}
          onChange={handleTextChange}
          onBlur={restoreValidValue}
          className="min-w-0 flex-1 bg-transparent font-mono text-sm text-heading outline-none disabled:cursor-not-allowed disabled:text-locked-text"
          aria-label={`${label} hex value`}
        />
      </span>
    </label>
  );
}
