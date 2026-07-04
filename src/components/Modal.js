"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import Card from "@/components/Card";

const MODAL_ANIMATIONS = {
  none: {
    duration: 0,
    popupEnter: "",
    popupExit: "",
    backdropEnter: "",
    backdropExit: "",
  },
  "fade+pop": {
    duration: 140,
    popupEnter: "modal-popup-enter",
    popupExit: "modal-popup-exit",
    backdropEnter: "modal-backdrop-enter",
    backdropExit: "modal-backdrop-exit",
  },
};

function getModalAnimation(animation, fallback = "fade+pop") {
  return MODAL_ANIMATIONS[animation] ? animation : fallback;
}

const variants = {
  default: {
    overlay: "items-center justify-center overflow-y-auto p-4",
    card: "w-full max-w-lg min-h-24",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
  },
  compact: {
    overlay: "items-center justify-center overflow-y-auto p-4",
    card: "w-full max-w-sm min-h-24",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
  },
  wide: {
    overlay: "items-center justify-center overflow-y-auto p-4",
    card: "w-full max-w-3xl min-h-40",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
  },
  drawer: {
    overlay: "items-stretch justify-end overflow-hidden",
    card: "h-full w-full max-w-md rounded-none !border-y-0 !border-r-0",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
  },
  bottomSheet: {
    overlay: "items-end justify-center overflow-hidden p-0 sm:p-4",
    card: "w-full max-w-2xl rounded-b-none sm:rounded-b-xl",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
  },
  fullscreen: {
    overlay: "items-stretch justify-stretch overflow-y-auto p-0 sm:p-6",
    card: "min-h-full w-full rounded-none sm:rounded-xl",
    openAnimation: "none",
    closeAnimation: "none",
  },
  settings: {
    overlay: "items-center justify-center overflow-y-auto p-4",
    card: "w-full max-w-sm min-h-64",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
  },
};

const backgrounds = {
  dim: "bg-modal-backdrop",
  none: "bg-transparent",
};

let bodyScrollLockCount = 0;
let restoreBodyScroll = null;

function lockBodyScroll() {
  if (bodyScrollLockCount === 0) {
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

    restoreBodyScroll = () => {
      document.body.style.position = originalBodyStyles.position;
      document.body.style.top = originalBodyStyles.top;
      document.body.style.left = originalBodyStyles.left;
      document.body.style.right = originalBodyStyles.right;
      document.body.style.width = originalBodyStyles.width;
      document.body.style.paddingRight = originalBodyStyles.paddingRight;
      window.scrollTo(0, scrollY);
    };
  }

  bodyScrollLockCount += 1;

  return () => {
    bodyScrollLockCount = Math.max(0, bodyScrollLockCount - 1);

    if (bodyScrollLockCount === 0) {
      restoreBodyScroll?.();
      restoreBodyScroll = null;
    }
  };
}

export default function Modal({
  open,
  onClose,
  children,
  variant = "default",
  blurBackground = true,
  background,
  openAnimation,
  closeAnimation,
  popupAnimation,
  className = "",
}) {
  const variantConfig = variants[variant] ?? variants.default;
  const backdropBackground = backgrounds[background ?? (blurBackground ? "dim" : "none")] ?? backgrounds.dim;
  const legacyAnimation = typeof popupAnimation === "boolean" ? (popupAnimation ? "fade+pop" : "none") : undefined;
  const resolvedOpenAnimation = getModalAnimation(openAnimation ?? legacyAnimation ?? variantConfig.openAnimation ?? "fade+pop");
  const resolvedCloseAnimation = getModalAnimation(closeAnimation ?? legacyAnimation ?? variantConfig.closeAnimation ?? "fade+pop");
  const closeAnimationConfig = MODAL_ANIMATIONS[resolvedCloseAnimation];
  const [shouldRender, setShouldRender] = useState(open);

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      return undefined;
    }

    if (closeAnimationConfig.duration === 0) {
      setShouldRender(false);
      return undefined;
    }

    const timeout = window.setTimeout(() => {
      setShouldRender(false);
    }, closeAnimationConfig.duration);

    return () => window.clearTimeout(timeout);
  }, [open, closeAnimationConfig.duration]);

  useEffect(() => {
    if (!shouldRender) {
      return;
    }

    const unlockBodyScroll = lockBodyScroll();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        onClose?.();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);

      unlockBodyScroll();
    };
  }, [shouldRender, onClose]);

  if (!shouldRender || typeof document === "undefined") {
    return null;
  }

  const activeAnimationConfig = MODAL_ANIMATIONS[open ? resolvedOpenAnimation : resolvedCloseAnimation];
  const popupAnimationClass = open ? activeAnimationConfig.popupEnter : activeAnimationConfig.popupExit;
  const backdropAnimationClass = open ? activeAnimationConfig.backdropEnter : activeAnimationConfig.backdropExit;

  return createPortal(
    <div className={`fixed inset-0 z-[100] flex ${variantConfig.overlay}`}>
      <button
        type="button"
        className={`absolute inset-0 ${backdropBackground} ${backdropAnimationClass}`}
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
