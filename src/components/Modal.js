"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

import accountIcon from "@/assets/icons/settings/account.svg";
import accessibilityIcon from "@/assets/icons/settings/accessibility.svg";
import appearanceIcon from "@/assets/icons/settings/appearance.svg";
import auditLogIcon from "@/assets/icons/settings/audit-log.svg";
import beakerIcon from "@/assets/icons/settings/beaker.svg";
import codeIcon from "@/assets/icons/settings/code.svg";
import logoutIcon from "@/assets/icons/settings/logout.svg";
import privacyIcon from "@/assets/icons/settings/privacy.svg";
import supportIcon from "@/assets/icons/settings/support.svg";
import timeIcon from "@/assets/icons/settings/time.svg";
import userManagementIcon from "@/assets/icons/settings/user-management.svg";
import closeIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Card from "@/components/Card";
import ProfilePicture from "@/components/ProfilePicture";
import SearchBar from "@/components/SearchBar";
import Separator from "@/components/Separator";
import SettingsContent from "@/settings/SettingsContent";

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
    content: "h-full min-h-0",
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
    items: [{ label: "Account" }, { label: "Privacy" }],
  },
  {
    label: "Experience",
    items: [{ label: "Appearance" }, { label: "Accessibility" }, { label: "Language&Time" }],
  },
  {
    label: "Staff",
    items: [
      { label: "Bug Panel", permission: "bug_panel" },
      { label: "Dev Options", permission: "dev_options" },
      { label: "Design Test", permission: "design_test" },
      { label: "User Management", permissions: ["user_management", "manage_roles"] },
      { label: "Audit Log", permission: "audit_log" },
    ],
  },
];

const settingsItemIcons = {
  Account: accountIcon,
  Privacy: privacyIcon,
  Appearance: appearanceIcon,
  Accessibility: accessibilityIcon,
  "Language&Time": timeIcon,
  "Dev Options": codeIcon,
  "Bug Panel": supportIcon,
  "Design Test": beakerIcon,
  "User Management": userManagementIcon,
  "Audit Log": auditLogIcon,
};

function canViewSettingsItem(item, permissions) {
  const requiredPermissions = item.permissions ?? (item.permission ? [item.permission] : []);
  if (!requiredPermissions.length) {
    return true;
  }

  return requiredPermissions.some((permission) => (
    permissions?.permissionMap?.[permission] || permissions?.permissions?.includes?.(permission)
  ));
}

function getVisibleSettingsCategories(permissions, query = "") {
  const normalizedQuery = query.trim().toLowerCase();

  return settingsCategories
    .map((category) => {
      const visibleItems = category.items
        .filter((item) => canViewSettingsItem(item, permissions))
        .filter((item) => !normalizedQuery || category.label.toLowerCase().includes(normalizedQuery) || item.label.toLowerCase().includes(normalizedQuery));

      return { ...category, items: visibleItems };
    })
    .filter((category) => category.items.length > 0);
}

function SettingsModalContent({ user, permissions, onClose, onLogout, children }) {
  const [searchQuery, setSearchQuery] = useState("");
  const visibleCategories = getVisibleSettingsCategories(permissions, searchQuery);
  const [activeItem, setActiveItem] = useState(visibleCategories[0]?.items[0]?.label ?? "Account");
  const username = user?.username || "VanillaSquared User";
  const email = user?.email || "Manage your account";

  useEffect(() => {
    if (!visibleCategories.some((category) => category.items.some((item) => item.label === activeItem))) {
      setActiveItem(visibleCategories[0]?.items[0]?.label ?? "Account");
    }
  }, [activeItem, visibleCategories]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-modal text-soft md:flex-row">
      <aside className="flex min-h-0 shrink-0 flex-col overflow-hidden border-b border-divider bg-card/50 p-5 md:w-72 md:border-b-0 md:border-r">
        <div className="shrink-0 bg-card/50 pb-4">
          <div className="flex items-center gap-3">
            <ProfilePicture
              src={user?.profilePicture ?? user?.avatarUrl ?? user?.image}
              username={username}
              email={email}
            />
            <div className="min-w-0">
              <p className="truncate font-semibold text-heading">{username}</p>
              <p className="truncate text-sm text-muted">{email}</p>
            </div>
          </div>

          <SearchBar variant="settings" placeholder="Search settings" className="mt-5 shrink-0" value={searchQuery} onChange={setSearchQuery} showPreview={false} />
        </div>

        <nav className="mt-4 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1">
          {visibleCategories.map((category, categoryIndex) => (
            <div key={category.label}>
              {categoryIndex > 0 ? <Separator className="mb-5" /> : null}
              <p className="mb-3 px-2 text-sm font-semibold text-subtle">{category.label}</p>
              <div className="space-y-0.5">
                {category.items.map((item) => (
                  <Button
                    key={item.label}
                    size="sm"
                    variant="tertiary"
                    border={false}
                    icon={settingsItemIcons[item.label]}
                    iconClassName="h-[18px] w-[18px] self-center"
                    className={`h-8 w-full !justify-start rounded-lg px-2.5 py-1.5 text-sm leading-none ${activeItem === item.label ? "bg-button-tertiary-hover text-heading" : "bg-transparent text-muted hover:text-soft"}`}
                    onClick={() => setActiveItem(item.label)}
                  >
                    <span className="inline-flex items-center leading-none">{item.label}</span>
                  </Button>
                ))}
              </div>
            </div>
          ))}
          {!visibleCategories.length ? <p className="px-2 text-sm text-muted">No settings found.</p> : null}
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

        <div className={["User Management", "Audit Log"].includes(activeItem) ? "min-h-0 flex-1 overflow-hidden px-6 pt-8 md:px-12" : "min-h-0 flex-1 overflow-y-auto px-6 py-8 md:px-12"}>
          <SettingsContent activeItem={activeItem} permissions={permissions}>{children}</SettingsContent>
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
  closeOnOutsideClick = true,
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
    <div className={`fixed ${variantConfig.root ?? "inset-0"} z-[100] flex ${variantConfig.overlay} ${closeOnOutsideClick ? "" : "pointer-events-none"}`}>
      {closeOnOutsideClick ? (
        <button
          type="button"
          className={`absolute inset-0 ${backdropBackground} ${backdropAnimationClass}`}
          aria-label="Close modal"
          onClick={onClose}
        />
      ) : null}
      <Card
        role="dialog"
        aria-modal="true"
        preset="homepage"
        hoverAccent={false}
        className={`pointer-events-auto relative z-10 !border-modal-border !bg-modal ${variantConfig.card} ${popupAnimationClass} ${className}`}
        contentClassName={variantConfig.content ?? ""}
        onClick={(event) => event.stopPropagation()}
      >
        {content}
      </Card>
    </div>,
    document.body
  );
}
