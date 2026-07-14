export const DEVELOPER_MODE_STORAGE_KEY = "vsq-developer-mode";
export const DEVELOPER_MODE_EVENT = "vsq-developer-mode-change";

export function getDeveloperMode() {
  return typeof window !== "undefined" && window.localStorage.getItem(DEVELOPER_MODE_STORAGE_KEY) === "true";
}

export function setDeveloperMode(enabled) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(DEVELOPER_MODE_STORAGE_KEY, enabled ? "true" : "false");
  window.dispatchEvent(new CustomEvent(DEVELOPER_MODE_EVENT, { detail: Boolean(enabled) }));
}
