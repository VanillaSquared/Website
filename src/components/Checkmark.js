"use client";

import { useState } from "react";

export default function Checkmark({
  checked,
  defaultChecked = true,
  onChange,
  onClick,
  interactive = false,
  disabled = false,
  label,
  className = "",
  size = "md",
  variant = "default",
  icon,
  cycle = false,
  cycleStates = [
    { checked: true, variant: "green", icon: "check" },
    { checked: false, variant: "red", icon: "x" },
    { checked: false, variant: "unconfirmed", icon: "dash" },
  ],
  "aria-label": ariaLabel,
  ...props
}) {
  const sizes = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };
  const variants = {
    default: {
      checked: "border-control-accent bg-control-accent text-control-accent-text",
      unchecked: "border-control-border bg-control text-transparent",
    },
    green: {
      checked: "border-transparent bg-[var(--vsq-checkmark-green-bg)] text-[var(--vsq-checkmark-green-text)]",
      unchecked: "border-transparent bg-[var(--vsq-checkmark-green-bg)] text-[var(--vsq-checkmark-green-text)]",
    },
    red: {
      checked: "border-transparent bg-[var(--vsq-checkmark-red-bg)] text-[var(--vsq-checkmark-red-text)]",
      unchecked: "border-transparent bg-[var(--vsq-checkmark-red-bg)] text-[var(--vsq-checkmark-red-text)]",
    },
    unconfirmed: {
      checked: "border-[1.5px] border-[var(--vsq-checkmark-unconfirmed-border)] bg-[var(--vsq-checkmark-unconfirmed-bg)] text-[var(--vsq-checkmark-unconfirmed-text)]",
      unchecked: "border-[1.5px] border-[var(--vsq-checkmark-unconfirmed-border)] bg-[var(--vsq-checkmark-unconfirmed-bg)] text-[var(--vsq-checkmark-unconfirmed-text)]",
    },
  };
  const activeCycleStates = Array.isArray(cycle) ? cycle : cycle ? cycleStates : null;
  const isInteractive = Boolean(interactive || onChange || onClick || activeCycleStates);
  const [internalChecked, setInternalChecked] = useState(defaultChecked);
  const [cycleIndex, setCycleIndex] = useState(null);
  const isControlled = checked !== undefined;
  const cycleState = cycleIndex === null ? null : activeCycleStates?.[cycleIndex] ?? null;
  const isChecked = cycleState ? cycleState.checked : isControlled ? checked : internalChecked;
  const Component = isInteractive ? "button" : "span";
  const selectedVariantName = cycleState?.variant ?? variant;
  const selectedVariant = variants[selectedVariantName] ?? variants.default;
  const selectedIcon = cycleState?.icon ?? icon ?? (isChecked ? "check" : "none");
  const hasLabel = label !== undefined && label !== null;
  const accessibleLabel = ariaLabel ?? (hasLabel ? undefined : "Toggle checked state");

  function handleClick(event) {
    if (disabled) {
      return;
    }

    if (activeCycleStates?.length) {
      const nextIndex = cycleIndex === null ? 0 : (cycleIndex + 1) % activeCycleStates.length;
      const nextState = activeCycleStates[nextIndex];

      setCycleIndex(nextIndex);
      setInternalChecked(nextState.checked);
      onChange?.(nextState.checked, event, nextState, nextIndex);
      onClick?.(event);
      return;
    }

    const nextChecked = !isChecked;

    if (!isControlled) {
      setInternalChecked(nextChecked);
    }

    onChange?.(nextChecked, event);
    onClick?.(event);
  }

  const iconContent = (
    <>
      {selectedIcon === "check" ? (
        <span className="absolute top-[45%] left-1/2 h-[55%] w-[32%] -translate-x-1/2 -translate-y-1/2 rotate-45 border-r-2 border-b-2 border-current" />
      ) : null}
      {selectedIcon === "x" ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="absolute h-0.5 w-[55%] rotate-45 rounded-full bg-current" />
          <span className="absolute h-0.5 w-[55%] -rotate-45 rounded-full bg-current" />
        </span>
      ) : null}
      {selectedIcon === "dash" ? (
        <span className="absolute inset-0 flex items-center justify-center">
          <span className="h-0.5 w-[55%] rounded-full bg-current" />
        </span>
      ) : null}
    </>
  );

  if (hasLabel) {
    return (
      <Component
        type={isInteractive ? "button" : undefined}
        aria-label={isInteractive ? accessibleLabel : undefined}
        aria-pressed={isInteractive ? isChecked : undefined}
        disabled={isInteractive ? disabled : undefined}
        onClick={isInteractive ? handleClick : undefined}
        className={`inline-flex items-center gap-2 ${
          isInteractive && !disabled ? "cursor-pointer" : ""
        } ${disabled ? "cursor-not-allowed" : ""} ${className}`}
        {...props}
      >
        <span
          aria-hidden="true"
          className={`${sizes[size] ?? sizes.md} relative inline-flex shrink-0 items-center justify-center rounded-full border transition-colors ${
            isChecked ? selectedVariant.checked : selectedVariant.unchecked
          }`}
        >
          {iconContent}
        </span>
        <span>{label}</span>
      </Component>
    );
  }

  return (
    <Component
      type={isInteractive ? "button" : undefined}
      aria-hidden={isInteractive ? undefined : "true"}
      aria-label={isInteractive ? accessibleLabel : undefined}
      aria-pressed={isInteractive ? isChecked : undefined}
      disabled={isInteractive ? disabled : undefined}
      onClick={isInteractive ? handleClick : undefined}
      className={`${sizes[size] ?? sizes.md} relative inline-flex shrink-0 items-center justify-center rounded-full border transition-colors ${
        isInteractive && !disabled ? "cursor-pointer" : ""
      } ${disabled ? "cursor-not-allowed" : ""} ${
        isChecked ? selectedVariant.checked : selectedVariant.unchecked
      } ${className}`}
      {...props}
    >
      {iconContent}
    </Component>
  );
}
