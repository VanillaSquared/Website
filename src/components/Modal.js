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
  filterSidebar: { root: "top-16 right-0 bottom-0 left-0", overlay: "items-stretch justify-end overflow-hidden p-4", card: "h-full w-full max-w-sm rounded-2xl", content: "h-full min-h-0", openAnimation: "slide-right", closeAnimation: "slide-right" },
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
    const scrollY = window.scrollY;
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    const original = {
      position: document.body.style.position,
      top: document.body.style.top,
      left: document.body.style.left,
      right: document.body.style.right,
      width: document.body.style.width,
      paddingRight: document.body.style.paddingRight,
    };

    Object.assign(document.body.style, { position: "fixed", top: `-${scrollY}px`, left: "0", right: "0", width: "100%" });
    if (scrollbarWidth > 0) {
      const paddingRight = parseFloat(window.getComputedStyle(document.body).paddingRight) || 0;
      document.body.style.paddingRight = `${paddingRight + scrollbarWidth}px`;
    }

    restoreBodyScroll = () => {
      Object.assign(document.body.style, original);
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

  const activeAnimation = MODAL_ANIMATIONS[open ? resolvedOpenAnimation : resolvedCloseAnimation];

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
        className={`pointer-events-auto relative z-10 !border-modal-border !bg-modal ${variantConfig.card} ${open ? activeAnimation.popupEnter : activeAnimation.popupExit} ${className}`}
        contentClassName={variantConfig.content ?? ""}
        onClick={(event) => event.stopPropagation()}
      >
        <div ref={contentRef} tabIndex={-1} className="h-full min-h-0 outline-none">
          {children}
        </div>
      </Card>
      <style jsx global>{`
        @keyframes modal-slide-right-in {
          from { transform: translate3d(100%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }

        @keyframes modal-slide-right-out {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(100%, 0, 0); }
        }

        @keyframes modal-slide-left-in {
          from { transform: translate3d(-100%, 0, 0); }
          to { transform: translate3d(0, 0, 0); }
        }

        @keyframes modal-slide-left-out {
          from { transform: translate3d(0, 0, 0); }
          to { transform: translate3d(-100%, 0, 0); }
        }

        .modal-slide-right-enter {
          animation: modal-slide-right-in 180ms ease-out both;
          will-change: transform;
        }

        .modal-slide-right-exit {
          animation: modal-slide-right-out 180ms ease-in both;
          pointer-events: none;
          will-change: transform;
        }

        .modal-slide-left-enter {
          animation: modal-slide-left-in 180ms ease-out both;
          will-change: transform;
        }

        .modal-slide-left-exit {
          animation: modal-slide-left-out 180ms ease-in both;
          pointer-events: none;
          will-change: transform;
        }

        @media (prefers-reduced-motion: reduce) {
          .modal-slide-right-enter,
          .modal-slide-right-exit,
          .modal-slide-left-enter,
          .modal-slide-left-exit {
            animation-duration: 1ms;
          }
        }
      `}</style>
    </div>,
    document.body
  );
}
