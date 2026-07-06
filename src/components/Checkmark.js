"use client";

import { useState } from "react";

export default function Checkmark({
  checked,
  defaultChecked = true,
  onChange,
  onClick,
  interactive = false,
  disabled = false,
  className = "",
  size = "md",
  variant = "default",
  "aria-label": ariaLabel = "Toggle checked state",
  ...props
}) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };
  const checkedVariants = {
    default: "border-control-accent bg-control-accent text-control-accent-text",
    green: "border-[var(--vsq-checkmark-green-border)] bg-[var(--vsq-checkmark-green-bg)] text-[var(--vsq-checkmark-green-text)]",
  };
  const isInteractive = Boolean(interactive || onChange || onClick);
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const isControlled = checked !== undefined;
  const isChecked = isControlled ? checked : internalChecked;
  const Component = isInteractive ? "button" : "span";

  function handleClick(event) {
    if (disabled) {
      return;
    }

    const nextChecked = !isChecked;

    if (!isControlled) {
      setInternalChecked(nextChecked);
    }

    onChange?.(nextChecked, event);
    onClick?.(event);
  }

  return (
    <Component
      type={isInteractive ? "button" : undefined}
      aria-hidden={isInteractive ? undefined : "true"}
      aria-label={isInteractive ? ariaLabel : undefined}
      aria-pressed={isInteractive ? isChecked : undefined}
      disabled={isInteractive ? disabled : undefined}
      onClick={isInteractive ? handleClick : undefined}
      className={`${sizes[size] ?? sizes.md} relative inline-flex shrink-0 items-center justify-center rounded-full border transition-colors ${
        isInteractive && !disabled ? "cursor-pointer" : ""
      } ${
        disabled ? "cursor-not-allowed opacity-60" : ""
      } ${
        isChecked
          ? checkedVariants[variant] ?? checkedVariants.default
          : "border-control-border bg-control text-transparent"
      } ${className}`}
      {...props}
    >
      <span className="absolute top-[45%] left-1/2 h-[55%] w-[32%] -translate-x-1/2 -translate-y-1/2 rotate-45 border-r-2 border-b-2 border-current" />
    </Component>
  );
}
