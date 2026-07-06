"use client";

import { useEffect, useId, useState } from "react";

import searchIcon from "@/assets/icons/search.svg";
import xIcon from "@/assets/icons/x.svg";
import Preview from "@/components/Preview";

const EMPTY_HIDDEN_FIELDS = Object.freeze({});

const variants = {
  default: {
    form: "max-w-sm",
    input: "h-9 rounded-lg py-1.5 text-sm",
    filled: "bg-[#25262a]/90",
    empty: "bg-[#202124]/85",
    hover: "hover:bg-[#25262a]/90 focus:bg-[#25262a]/90",
    clear: "hover:bg-[#2b2c30]/90 hover:text-heading",
  },
  settings: {
    form: "max-w-none",
    input: "h-11 rounded-xl py-2 text-base",
    filled: "bg-search-hover",
    empty: "bg-search",
    hover: "hover:bg-search-hover focus:bg-search-hover",
    clear: "hover:bg-button-tertiary-hover hover:text-heading",
  },
  large: {
    form: "max-w-none",
    input: "h-12 rounded-xl py-2.5 text-base",
    filled: "bg-search-hover",
    empty: "bg-search",
    hover: "hover:bg-search-hover focus:bg-search-hover",
    clear: "hover:bg-button-tertiary-hover hover:text-heading",
  },
};

function getPathValue(item, path) {
  return String(path.split(".").reduce((value, key) => value?.[key], item) ?? "");
}

export default function SearchBar({
  action,
  className = "",
  defaultValue = "",
  hiddenFields = EMPTY_HIDDEN_FIELDS,
  label = "Search",
  method = "GET",
  name = "q",
  onSearch,
  placeholder = "Search...",
  previewEndpoint,
  previewResultsKey = "results",
  previewTitleKey = "title",
  previewDescriptionKey = "description",
  previewMetaKey,
  variant = "default",
}) {
  const inputId = useId();
  const [value, setValue] = useState(defaultValue);
  const [previewItems, setPreviewItems] = useState([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const variantConfig = variants[variant] ?? variants.default;

  useEffect(() => {
    if (!previewEndpoint || !value.trim()) {
      setPreviewItems([]);
      setPreviewLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setPreviewLoading(true);

      try {
        const url = new URL(previewEndpoint, window.location.origin);
        Object.entries(hiddenFields).forEach(([fieldName, fieldValue]) => {
          if (fieldValue) {
            url.searchParams.set(fieldName, fieldValue);
          }
        });
        url.searchParams.set(name, value.trim());
        const response = await fetch(url, { signal: controller.signal });
        const json = await response.json();
        const results = previewResultsKey ? json?.[previewResultsKey] : json;
        setPreviewItems(Array.isArray(results) ? results.slice(0, 6) : []);
      } catch (error) {
        if (error.name !== "AbortError") {
          setPreviewItems([]);
        }
      } finally {
        if (!controller.signal.aborted) {
          setPreviewLoading(false);
        }
      }
    }, 120);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [hiddenFields, name, previewEndpoint, previewResultsKey, value]);

  function getSearchHref(nextValue) {
    const params = new URLSearchParams();
    Object.entries(hiddenFields).forEach(([fieldName, fieldValue]) => {
      if (fieldValue) {
        params.set(fieldName, fieldValue);
      }
    });
    if (nextValue) {
      params.set(name, nextValue);
    }
    return `${action}${params.toString() ? `?${params.toString()}` : ""}`;
  }

  function clearSearch(close) {
    setValue("");
    close();

    if (action && defaultValue) {
      window.location.href = getSearchHref("");
    }
  }

  function submitSearch(event, close, nextValue = value) {
    if (!onSearch && !action) {
      event.preventDefault();
      return;
    }

    if (onSearch) {
      event.preventDefault();
      onSearch(nextValue);
    } else if (action) {
      event.preventDefault();
      window.location.href = getSearchHref(nextValue);
    }

    close();
  }

  return (
    <Preview
      className={`w-full ${variantConfig.form} ${className}`}
      menuClassName="p-2"
      menuMaxHeight="max-h-72"
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
          {Object.entries(hiddenFields).map(([fieldName, fieldValue]) => (
            fieldValue ? <input key={fieldName} type="hidden" name={fieldName} value={fieldValue} /> : null
          ))}
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
                onClick={() => clearSearch(close)}
                className={`absolute right-2 z-10 rounded-md p-1 text-muted transition-colors focus:outline-none ${variantConfig.clear}`}
              >
                <span
                  aria-hidden="true"
                  className="block h-4 w-4 bg-current"
                  style={{
                    WebkitMask: `url(${xIcon.src}) center / contain no-repeat`,
                    mask: `url(${xIcon.src}) center / contain no-repeat`,
                  }}
                />
              </button>
            ) : null}
          </div>
        </form>
      )}
    >
      {({ close }) => {
        if (!value) {
          return null;
        }

        return (
          <div className="space-y-1">
            {previewEndpoint ? (
              previewLoading ? <p className="px-3 py-2 text-sm text-muted">Searching...</p> : null
            ) : null}
            {previewItems.map((item, index) => {
              const title = getPathValue(item, previewTitleKey);
              const description = getPathValue(item, previewDescriptionKey);
              const meta = previewMetaKey ? getPathValue(item, previewMetaKey) : "";

              return (
                <button
                  key={item.id ?? `${title}-${index}`}
                  type="button"
                  onClick={(event) => {
                    setValue(title);
                    submitSearch(event, close, title);
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left transition-colors hover:bg-control-hover focus-visible:bg-control-hover focus-visible:outline-none"
                >
                  <span className="flex items-center gap-2 text-sm font-semibold text-heading">
                    {meta ? <span className="font-mono text-xs text-accent">{meta.toLowerCase()}</span> : null}
                    <span className="truncate">{title}</span>
                  </span>
                  {description ? <span className="mt-1 block truncate text-xs text-muted">{description}</span> : null}
                </button>
              );
            })}
            {!previewLoading && previewEndpoint && !previewItems.length ? (
              <p className="px-3 py-2 text-sm text-muted">No results found.</p>
            ) : null}
            <button
              type="button"
              onClick={(event) => submitSearch(event, close)}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-1.5 text-left text-sm font-normal text-heading transition-colors hover:bg-control-hover focus-visible:bg-control-hover focus-visible:outline-none"
            >
              <img src={searchIcon.src} alt="" aria-hidden="true" className="h-4 w-4" />
              <span className="truncate">Search for “{value}”</span>
            </button>
          </div>
        );
      }}
    </Preview>
  );
}
