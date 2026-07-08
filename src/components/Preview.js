"use client";

import { useEffect, useRef, useState } from "react";
import Checkmark from "@/components/Checkmark";

function optionLabel(option) {
  return typeof option === "string" ? option : option.label;
}

function optionValue(option) {
  return typeof option === "string" ? option : option.value;
}

function normalizeValue(value, multiple) {
  if (multiple) {
    return Array.isArray(value) ? value : value ? [value] : [];
  }

  return value ? [value] : [];
}

export default function Preview({
  renderTrigger,
  children,
  label,
  options = [],
  value,
  defaultValue = [],
  onChange,
  multiple = true,
  min = 0,
  max = Infinity,
  name,
  placeholder = multiple ? "Select one or more..." : "Select one...",
  closeOnSelect = !multiple,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  menuMaxHeight = "max-h-64",
  emptyText = "No options found.",
  locked = false,
}) {
  const [open, setOpen] = useState(false);
  const [internalValue, setInternalValue] = useState(normalizeValue(defaultValue, multiple));
  const previewRef = useRef(null);
  const isControlled = value !== undefined;
  const previewControls = {
    open,
    setOpen,
    close: () => setOpen(false),
    toggle: () => setOpen((current) => !current),
  };
  const selectedValues = isControlled ? normalizeValue(value, multiple) : internalValue;
  const selectedLabels = options
    .filter((option) => selectedValues.includes(optionValue(option)))
    .map((option) => optionLabel(option));
  const hasMax = Number.isFinite(max);
  const limitText = [
    min > 0 ? `Min ${min}` : null,
    hasMax ? `Max ${max}` : null,
  ].filter(Boolean).join(" · ");

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    function handlePointerDown(event) {
      if (!previewRef.current?.contains(event.target)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function updateValue(nextValues) {
    if (!isControlled) {
      setInternalValue(nextValues);
    }

    onChange?.(multiple ? nextValues : nextValues[0] ?? "");
  }

  function toggleOption(nextValue) {
    if (locked) {
      return;
    }

    const selected = selectedValues.includes(nextValue);
    let nextValues;

    if (multiple) {
      if (selected) {
        if (selectedValues.length <= min) {
          return;
        }

        nextValues = selectedValues.filter((currentValue) => currentValue !== nextValue);
      } else {
        if (selectedValues.length >= max) {
          return;
        }

        nextValues = [...selectedValues, nextValue];
      }
    } else {
      nextValues = [nextValue];
    }

    updateValue(nextValues);

    if (closeOnSelect) {
      setOpen(false);
    }
  }

  if (renderTrigger) {
    const content = typeof children === "function" ? children(previewControls) : children;

    return (
      <div ref={previewRef} className={`relative ${className}`}>
        {renderTrigger(previewControls)}
        {open && content ? (
          <div
            className={`absolute z-20 mt-2 w-full overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-control-border bg-control-panel p-2 shadow-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${menuMaxHeight} ${menuClassName}`}
          >
            {content}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <>
      {name
        ? selectedValues.map((selectedValue) => (
            <input key={selectedValue} type="hidden" name={name} value={selectedValue} />
          ))
        : null}
      <div ref={previewRef} className={`flex flex-col gap-2 text-sm font-semibold text-soft ${className}`}>
        {label ? (
          <span className="flex items-center justify-between gap-3">
            <span>{label}</span>
            {limitText ? <span className="text-xs font-normal text-muted">{limitText}</span> : null}
          </span>
        ) : null}
        <div className="relative">
          <button
            type="button"
            aria-expanded={open}
            disabled={locked}
            onClick={() => setOpen((current) => !current)}
            className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-2 text-left outline-none transition-colors ${locked ? "cursor-not-allowed border-locked-input-border bg-locked-input text-locked-text" : "border-input-border bg-input text-heading hover:border-input-border-hover hover:bg-input-hover focus:border-input-border-focus focus:bg-input-focus"} ${buttonClassName}`}
          >
            <span className={selectedLabels.length ? "truncate" : `truncate italic ${locked ? "text-locked-text" : "text-input-sample"}`}>
              {selectedLabels.join(", ") || placeholder}
            </span>

            <span
              aria-hidden="true"
              className={`h-2 w-2 shrink-0 rotate-45 border-r-2 border-b-2 border-muted transition-transform ${
                open ? "rotate-[225deg]" : ""
              }`}
            />
          </button>
          {open ? (
            <div
              className={`absolute z-20 mt-2 w-full overflow-y-auto overflow-x-hidden overscroll-contain rounded-xl border border-control-border bg-control-panel p-2 shadow-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${menuMaxHeight} ${menuClassName}`}
            >
              <div className="flex w-full flex-col gap-0.5">
                {!options.length ? <p className="px-3 py-2 text-sm font-normal text-muted">{emptyText}</p> : null}
                {options.map((option) => {
                  const nextValue = optionValue(option);
                  const selected = selectedValues.includes(nextValue);
                  const disabled = multiple && ((selected && selectedValues.length <= min) || (!selected && selectedValues.length >= max));

                  return (
                    <button
                      key={nextValue}
                      type="button"
                      disabled={disabled}
                      onClick={() => toggleOption(nextValue)}
                      className="flex w-full items-center justify-between gap-3 rounded-lg px-3 py-1.5 text-left text-sm text-heading transition-colors hover:bg-control-hover focus-visible:bg-control-hover focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
                    >
                      <span>{optionLabel(option)}</span>
                      <Checkmark checked={selected} size="sm" />
                    </button>
                  );
                })}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
