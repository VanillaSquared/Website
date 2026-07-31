export const COOKIE_CONSENT_STORAGE_KEY = "vsq-cookie-consent";
export const COOKIE_CONSENT_ACCEPTED = "accepted";

let sessionConsent;

export function getCookieConsent() {
  if (sessionConsent !== undefined) return sessionConsent;

  try {
    return window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveCookieConsent(consent) {
  sessionConsent = consent;

  try {
    window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, consent);
  } catch {
    // The choice remains active for this page even when storage is unavailable.
  }
}

export function clearCookieConsent() {
  sessionConsent = null;

  try {
    window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY);
  } catch {
    // The in-memory choice still disables cookies for this page.
  }
}

export function hasCookieConsent() {
  return getCookieConsent() === COOKIE_CONSENT_ACCEPTED;
}

export function setConsentedCookie(name, value, attributes) {
  if (!hasCookieConsent()) return false;

  document.cookie = `${name}=${encodeURIComponent(value)}; ${attributes}`;
  return true;
}

export function removeCookie(name) {
  document.cookie = `${name}=; Path=/; Max-Age=0; SameSite=Lax`;
}

