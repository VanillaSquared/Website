"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

import Card from "@/components/Card";

const variants = {
  default: {
    overlay: "items-center justify-center overflow-y-auto p-4",
    card: "w-full max-w-lg min-h-24",
  },
  settings: {
    overlay: "items-center justify-center overflow-y-auto p-4",
    card: "w-full max-w-sm min-h-64",
  },
};

export default function Modal({
  open,
  onClose,
  children,
  variant = "default",
  blurBackground = true,
  className = "",
}) {
  const variantConfig = variants[variant] ?? variants.default;

  useEffect(() => {
    if (!open) {
      return;
    }

    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const originalBodyStyles = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
    };

    document.body.style.position = "fixed";
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = "0";
    document.body.style.right = "0";
    document.body.style.width = "100%";

    if (scrollbarWidth > 0) {
      const currentPaddingRight = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`;
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      document.body.style.position = originalBodyStyles.position;
      document.body.style.top = originalBodyStyles.top;
      document.body.style.left = originalBodyStyles.left;
      document.body.style.right = originalBodyStyles.right;
      document.body.style.width = originalBodyStyles.width;
      document.body.style.paddingRight = originalBodyStyles.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }, [open, onClose]);

  if (!open || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex ${variantConfig.overlay}`}>
      <button
        type="button"
        className={`absolute inset-0 bg-modal-backdrop ${blurBackground ? "backdrop-blur-sm" : ""}`}
        aria-label="Close modal"
        onClick={onClose}
      />
      <Card
        role="dialog"
        aria-modal="true"
        preset="homepage"
        hoverAccent={false}
        className={`relative z-10 !border-modal-border !bg-modal ${variantConfig.card} ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </Card>
    </div>,
    document.body
  );
}
