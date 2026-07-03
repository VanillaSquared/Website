"use client";

import searchIcon from "@/assets/icons/search.svg";
import xIcon from "@/assets/icons/x.svg";
import { useId, useState } from "react";

export default function SearchBar({
  action,
  className = "",
  defaultValue = "",
  label = "Search",
  method = "GET",
  name = "q",
  onSearch,
  placeholder = "Search...",
}) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue);

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
      className={`w-full max-w-sm ${className}`}
    >
      <label htmlFor={inputId} className="sr-only">
        {label}
      </label>
      <div className="relative flex items-center">
        <img
          src={searchIcon.src}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute left-3 h-4 w-4"
        />
        <input
          id={inputId}
          type="text"
          name={name}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          placeholder={placeholder}
          className={`${value ? "bg-[#25262a]/90" : "bg-[#202124]/85"} h-9 w-full rounded-lg py-1.5 pr-9 pl-9 text-sm text-heading outline-none backdrop-blur-md transition-colors placeholder:text-search-placeholder hover:bg-[#25262a]/90 focus:bg-[#25262a]/90`}
        />
        {value ? (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setValue("")}
            className="absolute right-2 rounded-md p-1 transition-colors hover:bg-[#2b2c30]/90 focus:outline-none"
          >
            <img src={xIcon.src} alt="" aria-hidden="true" className="h-4 w-4" />
          </button>
        ) : null}
      </div>
    </form>
  );
}
