"use client";

import { useEffect, useMemo, useState } from "react";

import xIcon from "@cdn/icons/x.svg";
import Button from "@/components/Button";
import CategoryNavigation from "@/components/CategoryNavigation";
import Modal from "@/components/Modal";
import SearchBar from "@/components/SearchBar";

function HamburgerIcon() {
  return (
    <span aria-hidden="true" className="flex h-4 w-4 flex-col justify-center gap-1">
      <span className="h-0.5 w-full rounded-full bg-current" />
      <span className="h-0.5 w-full rounded-full bg-current" />
      <span className="h-0.5 w-full rounded-full bg-current" />
    </span>
  );
}

function getDesktopNavigationFocusTarget() {
  const navigationTarget = document.querySelector(
    ".docs-layout-navigation nav[aria-label='Documentation'] [aria-current='page'], "
      + ".docs-layout-navigation nav[aria-label='Documentation'] a[href], "
      + ".docs-layout-navigation nav[aria-label='Documentation'] button"
  );

  if (navigationTarget instanceof HTMLElement && navigationTarget.getClientRects().length > 0) {
    return navigationTarget;
  }

  return document.querySelector("button[aria-label='Expand documentation navigation']");
}

function filterNavigation(items, query) {
  const terms = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  if (!terms.length) return items;

  return items.flatMap((item) => {
    const label = String(item.label ?? "").toLowerCase();
    const matches = terms.every((term) => label.includes(term));

    if (matches) {
      return [{
        ...item,
        defaultOpen: Boolean(item.children?.length),
      }];
    }

    const children = item.children ? filterNavigation(item.children, query) : [];
    if (!children.length) return [];

    return [{
      ...item,
      children,
      defaultOpen: true,
    }];
  });
}

export default function DocsNavigationSidebar({ items = [], selectedId }) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const filteredItems = useMemo(() => filterNavigation(items, searchQuery), [items, searchQuery]);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 64rem)");
    const handleChange = (event) => {
      if (event.matches) setOpen(false);
    };

    media.addEventListener("change", handleChange);
    return () => media.removeEventListener("change", handleChange);
  }, []);

  return (
    <>
      <Button
        variant="tertiary"
        size="iconButtonSm"
        className="shrink-0 lg:hidden"
        aria-label="Open documentation navigation"
        title="Documentation navigation"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <HamburgerIcon />
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        variant="filterSidebar"
        className="!mr-auto !ml-0 !border-0"
        background="none"
        blurBackground={false}
        openAnimation="slide-left"
        closeAnimation="slide-left"
        restoreFocusTo={getDesktopNavigationFocusTarget}
        ariaLabelledBy="docs-navigation-title"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="relative shrink-0 pb-4">
            <div>
              <h2 id="docs-navigation-title" className="text-xl font-semibold text-heading">Documentation</h2>
            </div>
            <Button
              size="icon"
              variant="tertiary"
              icon={xIcon}
              aria-label="Close documentation navigation"
              className="absolute top-0 right-0"
              onClick={() => setOpen(false)}
            />
          </div>

          <div className="shrink-0 pb-2 sm:hidden">
            <SearchBar
              placeholder="Search documentation"
              label="Search documentation navigation"
              value={searchQuery}
              onChange={setSearchQuery}
              onSearch={() => {}}
              showPreview={false}
            />
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto py-4">
            {filteredItems.length ? (
              <CategoryNavigation
                items={filteredItems}
                selectedId={selectedId}
                onNavigate={() => setOpen(false)}
                className="!bg-transparent !px-0 !py-0"
              />
            ) : (
              <p className="px-3 py-2 text-sm text-muted">No matching documentation.</p>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}
