"use client";

import { useEffect, useState } from "react";

import xIcon from "@cdn/icons/x.svg";
import Button from "@/components/Button";
import CategoryNavigation from "@/components/CategoryNavigation";
import Modal from "@/components/Modal";

function HamburgerIcon() {
  return (
    <span aria-hidden="true" className="flex h-4 w-4 flex-col justify-center gap-1">
      <span className="h-0.5 w-full rounded-full bg-current" />
      <span className="h-0.5 w-full rounded-full bg-current" />
      <span className="h-0.5 w-full rounded-full bg-current" />
    </span>
  );
}

export default function DocsNavigationSidebar({ items = [], selectedId }) {
  const [open, setOpen] = useState(false);

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
        closeOnOutsideClick={false}
        openAnimation="slide-left"
        closeAnimation="slide-left"
        ariaLabelledBy="docs-navigation-title"
      >
        <div className="flex h-full min-h-0 flex-col">
          <div className="relative shrink-0 pb-4">
            <div>
              <h2 id="docs-navigation-title" className="text-xl font-semibold text-heading">Documentation</h2>
              <p className="mt-1 text-sm text-muted">Browse categories and pages.</p>
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

          <div className="min-h-0 flex-1 overflow-y-auto py-4">
            <CategoryNavigation
              items={items}
              selectedId={selectedId}
              onNavigate={() => setOpen(false)}
              className="!bg-transparent !px-0 !py-0"
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
