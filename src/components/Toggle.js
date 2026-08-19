"use client";

import { useId, useState } from "react";

import { getAssetUrl } from "@/utils/assets";

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
  variant = "default",
  checkedIcon,
  uncheckedIcon,
  "aria-label": ariaLabel,
  className = "",
}) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;
  const isCompact = variant === "compact";
  const activeIcon = isChecked ? checkedIcon : uncheckedIcon;

  function updateChecked(nextChecked, event) {
    if (locked) {
      return;
    }

    if (!isControlled) {
      setInternalChecked(nextChecked);
    }

    onChange?.(nextChecked, event);
  }

  function handleChange(event) {
    updateChecked(event.target.checked, event);
  }

  const iconElement = activeIcon ? (
    <img
      src={getAssetUrl(activeIcon)}
      alt=""
      aria-hidden="true"
      className={`block ${isCompact ? "h-3.5 w-3.5" : "h-4 w-4"}`}
    />
  ) : null;

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
        aria-label={ariaLabel}
        className="peer sr-only"
        checked={isChecked}
        disabled={disabled || locked}
        onChange={handleChange}
      />
      <span
        className={`relative rounded-full border shadow-inner transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-control-focus ${
          isCompact ? "h-7 w-11" : "h-8 w-14"
        } ${
          locked ? "border-locked-input-border bg-locked-input" : isChecked ? "border-control-accent bg-control-accent" : "border-control-border bg-control"
        }`}
      >
        <span
          className={`absolute top-1/2 left-1 grid -translate-y-1/2 place-items-center rounded-full bg-control-knob shadow-sm transition-transform ${
            isCompact ? "h-5 w-5" : "h-6 w-6"
          } ${isChecked ? (isCompact ? "translate-x-4" : "translate-x-6") : "translate-x-0"}`}
        >
          {iconElement}
        </span>
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
