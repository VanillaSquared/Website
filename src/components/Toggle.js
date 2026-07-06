"use client";

import { useId, useState } from "react";

export default function Toggle({
  label,
  description,
  checked,
  defaultChecked = false,
  onChange,
  disabled = false,
  locked = false,
  id,
  name,
  className = "",
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;

  function handleChange(event) {
    if (locked) {
      return;
    }

    if (!isControlled) {
      setInternalChecked(event.target.checked);
    }

    onChange?.(event.target.checked, event);
  }

  return (
    <label
      htmlFor={inputId}
      className={`flex w-fit items-center gap-3 text-sm font-semibold text-soft ${
        disabled || locked ? "cursor-not-allowed opacity-60" : "cursor-pointer"
      } ${className}`}
    >
      <input
        id={inputId}
        name={name}
        type="checkbox"
        className="peer sr-only"
        checked={isChecked}
        disabled={disabled || locked}
        onChange={handleChange}
      />
      <span
        className={`relative h-8 w-14 rounded-full border shadow-inner transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-control-focus ${
          locked ? "border-locked-input-border bg-locked-input" : isChecked ? "border-control-accent bg-control-accent" : "border-control-border bg-control"
        }`}
      >
        <span
          className={`absolute top-1/2 left-1 block h-6 w-6 -translate-y-1/2 rounded-full bg-control-knob shadow-sm transition-transform ${
            isChecked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </span>
      {label || description ? (
        <span className="flex flex-col gap-0.5">
          {label ? <span className="text-heading">{label}</span> : null}
          {description ? <span className="font-normal text-muted">{description}</span> : null}
        </span>
      ) : null}
    </label>
  );
}
