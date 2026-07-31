"use client";

import xIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

export default function FilterSidebar({ open, onClose, title = "Filters", subtitle, footer, children, borderless = false }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="filterSidebar"
      className={borderless ? "!border-0" : ""}
      background="none"
      blurBackground={false}
      closeOnOutsideClick={false}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className={`shrink-0 flex items-center justify-between pb-4 ${borderless ? "" : "border-b border-divider"}`}>
          <div>
            <h2 className="text-xl font-semibold text-heading">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          </div>
          <Button size="icon" variant="tertiary" icon={xIcon} aria-label="Close filters" onClick={onClose} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-4">{children}</div>

        {footer ? <div className={`mt-auto shrink-0 pt-3 ${borderless ? "" : "border-t border-divider"}`}>{footer}</div> : null}
      </div>
    </Modal>
  );
}
