"use client";

import searchIcon from "@/assets/icons/search.svg";
import xIcon from "@/assets/icons/x.svg";
import Preview from "@/components/Preview";
import { useId, useState } from "react";

const variants = {
  default: {
    form: "max-w-sm",
    input: "h-9 rounded-lg py-1.5 text-sm",
    filled: "bg-[#25262a]/90",
    empty: "bg-[#202124]/85",
    hover: "hover:bg-[#25262a]/90 focus:bg-[#25262a]/90",
    clear: "hover:bg-[#2b2c30]/90",
  },
  settings: {
    form: "max-w-none",
    input: "h-11 rounded-xl py-2 text-base",
    filled: "bg-search-hover",
    empty: "bg-search",
    hover: "hover:bg-search-hover focus:bg-search-hover",
    clear: "hover:bg-button-tertiary-hover",
  },
};

export default function SearchBar({
  action,
  className = "",
  defaultValue = "",
  label = "Search",
  method = "GET",
  name = "q",
  onSearch,
  placeholder = "Search...",
  variant = "default",
}) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue);
  const variantConfig = variants[variant] ?? variants.default;

  function submitSearch(event, close) {
    if (!onSearch && !action) {
      event.preventDefault();
      return;
    }

    if (onSearch) {
      event.preventDefault();
      onSearch(value);
    }

    close();
  }

  return (
    <Preview
      className={`w-full ${variantConfig.form} ${className}`}
      menuClassName="p-2"
      menuMaxHeight="max-h-40"
      renderTrigger={({ setOpen, close }) => (
        <form
          role="search"
          action={onSearch ? undefined : action}
          method={method}
          onSubmit={(event) => submitSearch(event, close)}
          className="w-full"
        >
          <label htmlFor={inputId} className="sr-only">
            {label}
          </label>
          <div className="relative flex items-center">
            <img
              src={searchIcon.src}
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute left-3 z-10 h-4 w-4"
            />
            <input
              id={inputId}
              type="text"
              name={name}
              value={value}
              onFocus={() => setOpen(true)}
              onChange={(event) => {
                setValue(event.target.value);
                setOpen(true);
              }}
              placeholder={placeholder}
              className={`${value ? variantConfig.filled : variantConfig.empty} ${variantConfig.input} ${variantConfig.hover} relative w-full pr-9 pl-9 text-heading outline-none backdrop-blur-md transition-colors placeholder:text-search-placeholder`}
            />
            {value ? (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => {
                  setValue("");
                  close();
                }}
                className={`absolute right-2 z-10 rounded-md p-1 transition-colors focus:outline-none ${variantConfig.clear}`}
              >
                <img src={xIcon.src} alt="" aria-hidden="true" className="h-4 w-4" />
              </button>
            ) : null}
          </div>
        </form>
      )}
    >
      {({ close }) => value ? (
        <button
          type="button"
          onClick={() => {
            onSearch?.(value);
            close();
          }}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-normal text-heading transition-colors hover:bg-control-hover focus-visible:bg-control-hover focus-visible:outline-none"
        >
          <img src={searchIcon.src} alt="" aria-hidden="true" className="h-4 w-4" />
          <span className="truncate">Search for “{value}”</span>
        </button>
      ) : null}
    </Preview>
  );
}
