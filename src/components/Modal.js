"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

import Card from "@/components/Card";

const MODAL_ANIMATIONS = {
  none: { duration: 0, popupEnter: "", popupExit: "", backdropEnter: "", backdropExit: "" },
  "fade+pop": {
    duration: 140,
    popupEnter: "modal-popup-enter",
    popupExit: "modal-popup-exit",
    backdropEnter: "modal-backdrop-enter",
    backdropExit: "modal-backdrop-exit",
  },
  "slide-right": {
    duration: 180,
    popupEnter: "modal-slide-right-enter",
    popupExit: "modal-slide-right-exit",
    backdropEnter: "",
    backdropExit: "",
  },
  "slide-left": {
    duration: 180,
    popupEnter: "modal-slide-left-enter",
    popupExit: "modal-slide-left-exit",
    backdropEnter: "",
    backdropExit: "",
  },
};

const variants = {
  default: { overlay: "items-center justify-center overflow-y-auto p-4", card: "w-full max-w-lg min-h-24", openAnimation: "fade+pop", closeAnimation: "fade+pop" },
  compact: { overlay: "items-center justify-center overflow-y-auto p-4", card: "w-full max-w-sm min-h-24", openAnimation: "fade+pop", closeAnimation: "fade+pop" },
  corner: { overlay: "pointer-events-none items-end justify-end p-4", card: "w-full max-w-sm min-h-0", lockBodyScroll: false, modal: false, openAnimation: "fade+pop", closeAnimation: "fade+pop" },
  wide: { overlay: "items-center justify-center overflow-y-auto p-4", card: "w-full max-w-3xl min-h-40", openAnimation: "fade+pop", closeAnimation: "fade+pop" },
  drawer: { overlay: "items-stretch justify-end overflow-hidden", card: "h-full w-full max-w-md rounded-none !border-y-0 !border-r-0", openAnimation: "fade+pop", closeAnimation: "fade+pop" },
  filterSidebar: { root: "top-16 right-0 bottom-0 left-0", overlay: "items-stretch justify-end overflow-hidden p-4", card: "h-full w-full max-w-sm rounded-2xl", content: "h-full min-h-0", lockBodyScroll: false, openAnimation: "slide-right", closeAnimation: "slide-right" },
  bottomSheet: { overlay: "items-end justify-center overflow-hidden p-0 sm:p-4", card: "w-full max-w-2xl rounded-b-none sm:rounded-b-xl", openAnimation: "fade+pop", closeAnimation: "fade+pop" },
  fullscreen: { overlay: "items-stretch justify-stretch overflow-y-auto p-0 sm:p-6", card: "min-h-full w-full rounded-none sm:rounded-xl", openAnimation: "none", closeAnimation: "none" },
};

const backgrounds = { dim: "bg-modal-backdrop", none: "bg-transparent" };
const focusableSelector = [
  "a[href]",
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[tabindex]:not([tabindex='-1'])",
].join(",");
let bodyScrollLockCount = 0;
let restoreBodyScroll = null;

function getModalAnimation(animation, fallback = "fade+pop") {
  return MODAL_ANIMATIONS[animation] ? animation : fallback;
}

function isIOSDevice() {
  if (typeof navigator === "undefined") return false;
  return /iPad|iPhone|iPod/.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isVisibleElement(element) {
  return element instanceof HTMLElement
    && !element.hasAttribute("aria-hidden")
    && element.getClientRects().length > 0;
}

function getFocusableElements(container) {
  if (!container) return [];
  return [...container.querySelectorAll(focusableSelector)].filter(isVisibleElement);
}

function resolveFocusTarget(target) {
  const resolved = typeof target === "function" ? target() : target;
  return isVisibleElement(resolved) ? resolved : null;
}

function lockBodyScroll() {
  if (bodyScrollLockCount === 0) {
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const original = {
      htmlOverflow: document.documentElement.style.overflow,
      bodyOverflow: document.body.style.overflow,
      bodyPaddingRight: document.body.style.paddingRight,
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    if (scrollbarWidth > 0) {
      const paddingRight = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${paddingRight + scrollbarWidth}px`;
    }

    restoreBodyScroll = () => {
      document.documentElement.style.overflow = original.htmlOverflow;
      document.body.style.overflow = original.bodyOverflow;
      document.body.style.paddingRight = original.bodyPaddingRight;
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
  closeOnOutsideClick = true,
  restoreFocusTo,
  ariaLabelledBy,
  ariaDescribedBy,
  className = "",
}) {
  const variantConfig = variants[variant] ?? variants.default;
  const backdropBackground = backgrounds[background ?? (blurBackground ? "dim" : "none")] ?? backgrounds.dim;
  const legacyAnimation = typeof popupAnimation === "boolean" ? (popupAnimation ? "fade+pop" : "none") : undefined;
  const resolvedOpenAnimation = getModalAnimation(openAnimation ?? legacyAnimation ?? variantConfig.openAnimation);
  const resolvedCloseAnimation = getModalAnimation(closeAnimation ?? legacyAnimation ?? variantConfig.closeAnimation);
  const closeAnimationConfig = MODAL_ANIMATIONS[resolvedCloseAnimation];
  const [shouldRender, setShouldRender] = useState(open);
  const contentRef = useRef(null);
  const restoreFocusRef = useRef(null);
  const isIOS = isIOSDevice();

  useEffect(() => {
    if (open) {
      setShouldRender(true);
      return undefined;
    }
    if (closeAnimationConfig.duration === 0) {
      setShouldRender(false);
      return undefined;
    }
    const timeout = window.setTimeout(() => setShouldRender(false), closeAnimationConfig.duration);
    return () => window.clearTimeout(timeout);
  }, [open, closeAnimationConfig.duration]);

  useEffect(() => {
    if (!shouldRender) return undefined;
    const unlockBodyScroll = variantConfig.lockBodyScroll === false ? null : lockBodyScroll();
    return () => unlockBodyScroll?.();
  }, [shouldRender, variantConfig.lockBodyScroll]);

  useEffect(() => {
    if (!shouldRender || !isIOS) return undefined;
    const animationName = open ? resolvedOpenAnimation : resolvedCloseAnimation;
    if (animationName !== "slide-right") return undefined;

    const dialog = contentRef.current?.closest("[role='dialog']");
    if (!dialog) return undefined;

    const animation = dialog.animate(
      open
        ? [{ transform: "translateX(1%)" }, { transform: "translateX(0)" }]
        : [{ transform: "translateX(0)" }, { transform: "translateX(1%)" }],
      {
        duration: MODAL_ANIMATIONS["slide-right"].duration,
        easing: open ? "ease-out" : "ease-in",
        fill: "both",
      }
    );

    return () => animation.cancel();
  }, [open, shouldRender, isIOS, resolvedOpenAnimation, resolvedCloseAnimation]);

  useEffect(() => {
    if (!open || !shouldRender || variantConfig.modal === false) return undefined;

    restoreFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const frame = window.requestAnimationFrame(() => {
      const focusable = getFocusableElements(contentRef.current);
      (focusable[0] ?? contentRef.current)?.focus();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [open, shouldRender, variantConfig.modal]);

  useEffect(() => {
    if (shouldRender || !restoreFocusRef.current) return;
    const previousFocus = restoreFocusRef.current;
    restoreFocusRef.current = null;
    (resolveFocusTarget(restoreFocusTo) ?? (isVisibleElement(previousFocus) ? previousFocus : null))?.focus();
  }, [shouldRender, restoreFocusTo]);

  useEffect(() => () => {
    const previousFocus = restoreFocusRef.current;
    (resolveFocusTarget(restoreFocusTo) ?? (isVisibleElement(previousFocus) ? previousFocus : null))?.focus();
  }, [restoreFocusTo]);

  function handleDialogKeyDown(event) {
    if (variantConfig.modal === false) return;

    if (event.key === "Escape") {
      event.stopPropagation();
      onClose?.();
      return;
    }

    if (event.key !== "Tab") return;

    const focusable = getFocusableElements(contentRef.current);
    if (!focusable.length) {
      event.preventDefault();
      contentRef.current?.focus();
      return;
    }

    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || active === contentRef.current)) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  if (!shouldRender || typeof document === "undefined") return null;

  const activeAnimationName = open ? resolvedOpenAnimation : resolvedCloseAnimation;
  const activeAnimation = MODAL_ANIMATIONS[activeAnimationName];
  const popupAnimationClass = isIOS && activeAnimationName === "slide-right"
    ? ""
    : open ? activeAnimation.popupEnter : activeAnimation.popupExit;

  return createPortal(
    <div className={`fixed ${variantConfig.root ?? "inset-0"} z-[100] flex ${variantConfig.overlay}`} onKeyDown={handleDialogKeyDown}>
      {closeOnOutsideClick ? (
        <button type="button" className={`absolute inset-0 ${backdropBackground} ${open ? activeAnimation.backdropEnter : activeAnimation.backdropExit}`} aria-label="Close modal" onClick={onClose} />
      ) : (
        <div className={`absolute inset-0 ${backdropBackground} ${open ? activeAnimation.backdropEnter : activeAnimation.backdropExit}`} aria-hidden="true" />
      )}
      <Card
        role="dialog"
        aria-modal={variantConfig.modal === false ? undefined : "true"}
        aria-labelledby={ariaLabelledBy}
        aria-describedby={ariaDescribedBy}
        preset="homepage"
        hoverAccent={false}
        className={`pointer-events-auto relative z-10 !border-modal-border !bg-modal ${variantConfig.card} ${popupAnimationClass} ${className}`}
        contentClassName={variantConfig.content ?? ""}
        onClick={(event) => event.stopPropagation()}
      >
        <div ref={contentRef} tabIndex={-1} className="h-full min-h-0 outline-none">
          {children}
        </div>
      </Card>
    </div>,
    document.body
  );
}
