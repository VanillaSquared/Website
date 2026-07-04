"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import Card from "@/components/Card";

const MODAL_POPUP_ANIMATION_MS = 120;

const variants = {
  default: {
    overlay: "items-center justify-center overflow-y-auto p-4",
    card: "w-full max-w-lg min-h-24",
    popupAnimation: true,
  },
  settings: {
    overlay: "items-center justify-center overflow-y-auto p-4",
    card: "w-full max-w-sm min-h-64",
    popupAnimation: true,
  },
};

export default function Modal({
  open,
  onClose,
  children,
  variant = "default",
  blurBackground = true,
  popupAnimation,
  className = "",
}) {
  const variantConfig = variants[variant] ?? variants.default;
  const popupAnimationEnabled = popupAnimation ?? variantConfig.popupAnimation ?? false;
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      return undefined;
    }

    if (!popupAnimationEnabled) {
      setShouldRender(false);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setShouldRender(false);
    }, MODAL_POPUP_ANIMATION_MS);

    return () => window.clearTimeout(timeout);
  }, [open, popupAnimationEnabled]);

  useEffect(() => {
    if (!shouldRender) {
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
  }, [shouldRender, onClose]);

  if (!shouldRender || typeof document === "undefined") {
    return null;
  }

  const popupAnimationClass = popupAnimationEnabled
    ? open
      ? "modal-popup-enter"
      : "modal-popup-exit"
    : "";
  const backdropAnimationClass = popupAnimationEnabled
    ? open
      ? "modal-backdrop-enter"
      : "modal-backdrop-exit"
    : "";

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex ${variantConfig.overlay}`}>
      <button
        type="button"
        className={`absolute inset-0 ${blurBackground ? "bg-modal-backdrop" : "bg-transparent"} ${backdropAnimationClass}`}
        aria-label="Close modal"
        onClick={onClose}
      />
      <Card
        role="dialog"
        aria-modal="true"
        preset="homepage"
        hoverAccent={false}
        className={`relative z-10 !border-modal-border !bg-modal ${variantConfig.card} ${popupAnimationClass} ${className}`}
        onClick={(event) => event.stopPropagation()}
      >
        {children}
      </Card>
    </div>,
    document.body
  );
}
