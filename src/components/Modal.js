"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import accountIcon from "@/assets/icons/settings/account.svg";
import accessibilityIcon from "@/assets/icons/settings/accessibility.svg";
import appearanceIcon from "@/assets/icons/settings/appearance.svg";
import beakerIcon from "@/assets/icons/settings/beaker.svg";
import codeIcon from "@/assets/icons/settings/code.svg";
import logoutIcon from "@/assets/icons/settings/logout.svg";
import privacyIcon from "@/assets/icons/settings/privacy.svg";
import supportIcon from "@/assets/icons/settings/support.svg";
import timeIcon from "@/assets/icons/settings/time.svg";
import closeIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Card from "@/components/Card";
import SearchBar from "@/components/SearchBar";
import Separator from "@/components/Separator";

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
  "slide-right": {
    duration: 180,
    popupEnter: "modal-slide-right-enter",
    popupExit: "modal-slide-right-exit",
    backdropEnter: "",
    backdropExit: "",
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
  filterSidebar: {
    root: "top-16 right-0 bottom-0 left-0",
    overlay: "items-stretch justify-end overflow-hidden",
    card: "h-full w-full max-w-sm rounded-none !border-y-0 !border-r-0",
    openAnimation: "slide-right",
    closeAnimation: "slide-right",
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
    overlay: "items-center justify-center overflow-y-auto p-3 sm:p-6",
    card: "h-[min(760px,calc(100dvh-2rem))] w-full max-w-6xl overflow-hidden !p-0",
    content: "h-full",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
  },
};

const backgrounds = {
  dim: "bg-modal-backdrop",
  none: "bg-transparent",
};

const settingsCategories = [
  {
    label: "Account",
    items: ["Account", "Privacy"],
  },
  {
    label: "Experience",
    items: ["Appearance", "Accessibility", "Language&Time"],
  },
  {
    label: "Staff",
    permission: "canViewStaffSettings",
    items: ["Dev Options", "Support Panel", "Design Test"],
  },
];

const settingsItemIcons = {
  Account: accountIcon,
  Privacy: privacyIcon,
  Appearance: appearanceIcon,
  Accessibility: accessibilityIcon,
  "Language&Time": timeIcon,
  "Dev Options": codeIcon,
  "Support Panel": supportIcon,
  "Design Test": beakerIcon,
};

function getInitials(username, email) {
  const displayName = username || email || "VS";

  return displayName
    .split(/[\s._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "VS";
}

function getVisibleSettingsCategories(permissions) {
  return settingsCategories.filter((category) => !category.permission || permissions?.[category.permission]);
}

function SettingsModalContent({ user, permissions, onClose, onLogout, children }) {
  const visibleCategories = getVisibleSettingsCategories(permissions);
  const [activeItem, setActiveItem] = useState(visibleCategories[0]?.items[0] ?? "Account");
  const username = user?.username || "VanillaSquared User";
  const email = user?.email || "Manage your account";

  useEffect(() => {
    if (!visibleCategories.some((category) => category.items.includes(activeItem))) {
      setActiveItem(visibleCategories[0]?.items[0] ?? "Account");
    }
  }, [activeItem, visibleCategories]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-modal text-soft md:flex-row">
      <aside className="flex min-h-0 shrink-0 flex-col overflow-hidden border-b border-divider bg-card/50 p-5 md:w-72 md:border-b-0 md:border-r">
        <div className="shrink-0 bg-card/50 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-accent/50 bg-accent/20 text-lg font-bold text-heading">
              {getInitials(username, email)}
            </div>
            <div className="min-w-0">
              <p className="truncate font-semibold text-heading">{username}</p>
              <p className="truncate text-sm text-muted">{email}</p>
            </div>
          </div>

          <SearchBar variant="settings" placeholder="Search settings" className="mt-5 shrink-0" />
        </div>

        <nav className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {visibleCategories.map((category, categoryIndex) => (
            <div key={category.label}>
              {categoryIndex > 0 ? <Separator className="mb-5" /> : null}
              <p className="mb-3 px-2 text-xs font-semibold uppercase tracking-wide text-subtle">{category.label}</p>
              <div className="space-y-0.5">
                {category.items.map((item) => (
                  <Button
                    key={item}
                    size="sm"
                    variant="tertiary"
                    border={false}
                    icon={settingsItemIcons[item]}
                    iconClassName="h-[18px] w-[18px] self-center"
                    className={`h-8 w-full !justify-start rounded-lg px-2.5 py-1.5 text-sm leading-none ${activeItem === item ? "bg-button-tertiary-hover text-heading" : "bg-transparent text-muted hover:text-soft"}`}
                    onClick={() => setActiveItem(item)}
                  >
                    <span className="inline-flex items-center leading-none">{item}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        {onLogout ? (
          <div className="mt-4 shrink-0">
            <Separator className="mb-4" />
            <Button
              className="h-8 w-full !justify-start rounded-lg bg-transparent px-2.5 py-1.5 leading-none text-muted hover:text-soft"
              size="sm"
              variant="tertiary"
              border={false}
              icon={logoutIcon}
              iconClassName="h-[18px] w-[18px] self-center"
              onClick={onLogout}
            >
              <span className="inline-flex items-center leading-none">Logout</span>
            </Button>
          </div>
        ) : null}
      </aside>

      <section className="flex min-h-0 min-w-0 flex-1 flex-col">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-divider px-6">
          <h2 className="text-xl font-semibold text-heading">{activeItem}</h2>
          <Button size="icon" variant="tertiary" icon={closeIcon} aria-label="Close settings" onClick={onClose} />
        </header>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-12">
          {children}
        </div>
      </section>
    </div>
  );
}

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
  settingsUser,
  settingsPermissions,
  onSettingsLogout,
  settingsContent,
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
  const content = variant === "settings"
    ? <SettingsModalContent user={settingsUser} permissions={settingsPermissions} onClose={onClose} onLogout={onSettingsLogout}>{settingsContent ?? children}</SettingsModalContent>
    : children;

  return createPortal(
    <div className={`fixed ${variantConfig.root ?? "inset-0"} z-[100] flex ${variantConfig.overlay}`}>
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
        contentClassName={variantConfig.content ?? ""}
        onClick={(event) => event.stopPropagation()}
      >
        {content}
      </Card>
    </div>,
    document.body
  );
}
