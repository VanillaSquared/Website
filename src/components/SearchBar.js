"use client";

import searchIcon from "@/assets/icons/search.svg";
import xIcon from "@/assets/icons/x.svg";
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

  function handleSubmit(event) {
    if (!onSearch && !action) {
      event.preventDefault();
      return;
    }

    if (onSearch) {
      event.preventDefault();
      onSearch(value);
    }
  }

  return (
    <form
      role="search"
      action={onSearch ? undefined : action}
      method={method}
      onSubmit={handleSubmit}
      className={`w-full ${variantConfig.form} ${className}`}
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
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className={`${value ? variantConfig.filled : variantConfig.empty} ${variantConfig.input} ${variantConfig.hover} relative w-full pr-9 pl-9 text-heading outline-none backdrop-blur-md transition-colors placeholder:text-search-placeholder`}
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setValue("")}
            className={`absolute right-2 z-10 rounded-md p-1 transition-colors focus:outline-none ${variantConfig.clear}`}
          >
            <img src={xIcon.src} alt="" aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </form>
  );
}
