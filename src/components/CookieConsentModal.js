"use client";

import { useEffect, useState } from "react";

import xIcon from "@cdn/icons/x.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import {
  COOKIE_CONSENT_ACCEPTED,
  clearCookieConsent,
  getCookieConsent,
  removeCookie,
  saveCookieConsent,
} from "@/utils/cookieConsent";
import { registerConsoleCommands } from "@/utils/consoleCommands";

const THEME_COOKIE_NAME = "vsq-theme";

export default function CookieConsentModal() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(getCookieConsent() !== COOKIE_CONSENT_ACCEPTED);

    return registerConsoleCommands({
      displayCookieModal() {
        setOpen(true);
      },
      toggleCookies(enabled) {
        if (typeof enabled !== "boolean") {
          throw new TypeError("toggleCookies(enabled) requires a boolean.");
        }

        if (enabled) {
          saveCookieConsent(COOKIE_CONSENT_ACCEPTED);
          setOpen(false);
          return;
        }

        clearCookieConsent();
        removeCookie(THEME_COOKIE_NAME);
        setOpen(true);
      },
    });
  }, []);

  function acceptCookies() {
    saveCookieConsent(COOKIE_CONSENT_ACCEPTED);
    setOpen(false);
  }

  return (
    <Modal
      open={open}
      variant="corner"
      background="none"
      closeOnOutsideClick={false}
      ariaLabelledBy="cookie-consent-title"
      ariaDescribedBy="cookie-consent-description"
      className="!p-4"
    >
      <Button
        size="iconButtonSm"
        variant="iconButton"
        icon={xIcon}
        iconClassName="h-3.5 w-3.5"
        aria-label="Hide cookie notice"
        className="!absolute top-2 right-2"
        onClick={() => setOpen(false)}
      />
      <div className="flex items-end gap-4 pr-6">
        <div className="min-w-0 flex-1">
          <h2 id="cookie-consent-title" className="font-semibold text-heading">Cookie usage</h2>
          <p id="cookie-consent-description" className="mt-1 text-sm leading-5 text-muted">
            Vanilla² uses cookies for your selected theme and to remember website secrets. Cookies stay disabled until you accept.
          </p>
        </div>
        <Button size="sm" className="shrink-0" onClick={acceptCookies}>
          Accept
        </Button>
      </div>
    </Modal>
  );
}
