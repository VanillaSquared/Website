"use client";

import xIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

export default function FilterSidebar({ open, onClose, title = "Filters", subtitle, footer, children }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      variant="filterSidebar"
      background="none"
      blurBackground={false}
      closeOnOutsideClick={false}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="shrink-0 flex items-center justify-between border-b border-divider pb-4">
          <div>
            <h2 className="text-xl font-semibold text-heading">{title}</h2>
            {subtitle ? <p className="mt-1 text-sm text-muted">{subtitle}</p> : null}
          </div>
          <Button size="icon" variant="tertiary" icon={xIcon} aria-label="Close filters" onClick={onClose} />
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto py-4">{children}</div>

        {footer ? <div className="mt-auto shrink-0 border-t border-divider pt-3">{footer}</div> : null}
      </div>
    </Modal>
  );
}
