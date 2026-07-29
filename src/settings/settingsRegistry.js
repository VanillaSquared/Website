import AccessibilitySettings from "@/settings/AccessibilitySettings";
import AccountSettings from "@/settings/AccountSettings";
import AppearanceSettings from "@/settings/AppearanceSettings";
import AuditLogSettings from "@/settings/AuditLogSettings";
import BugPanelSettings from "@/settings/BugPanelSettings";
import DevOptionsSettings from "@/settings/DevOptionsSettings";
import ExperimentsSettings from "@/settings/ExperimentsSettings";
import LanguageTimeSettings from "@/settings/LanguageTimeSettings";
import PrivacySettings from "@/settings/PrivacySettings";
import UserManagementSettings from "@/settings/UserManagementSettings";

async function getJson(path) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin",
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Could not prepare settings.");
  return data;
}

async function loadBugPanelData() {
  const [config, moderationOptions] = await Promise.all([
    getJson("/api/bug-panel/config"),
    getJson("/api/bug-panel/moderation-options"),
  ]);

  return {
    config: config.config,
    users: Array.isArray(moderationOptions.users) ? moderationOptions.users : [],
    types: Array.isArray(moderationOptions.types) ? moderationOptions.types : [],
  };
}

async function loadDeveloperOptionsData() {
  const data = await getJson("/api/auth/preferences");
  return { developerMode: Boolean(data.preferences?.developerMode) };
}

export const settingsRegistry = {
  Account: { component: AccountSettings },
  Privacy: { component: PrivacySettings },
  Appearance: { component: AppearanceSettings },
  Accessibility: { component: AccessibilitySettings },
  "Language&Time": { component: LanguageTimeSettings },
  "Bug Panel": { component: BugPanelSettings, loadData: loadBugPanelData },
  "Dev Options": { component: DevOptionsSettings, loadData: loadDeveloperOptionsData },
  "Design Test": { loadComponent: () => import("@/settings/DesignTestSettings").then((module) => module.default) },
  "User&Role Management": { component: UserManagementSettings },
  "Audit Log": { component: AuditLogSettings },
  Experiments: { component: ExperimentsSettings },
};

export function getSettingsView(name) {
  const registration = settingsRegistry[name] ?? settingsRegistry.Account;
  return { name: settingsRegistry[name] ? name : "Account", Component: registration.component, data: undefined };
}

export function prepareSettingsView(name, cache) {
  const registration = settingsRegistry[name] ?? settingsRegistry.Account;
  const resolvedName = settingsRegistry[name] ? name : "Account";

  if (!registration.loadComponent && !registration.loadData) {
    return Promise.resolve(getSettingsView(resolvedName));
  }

  const cached = cache.get(resolvedName);
  if (cached) return cached;

  const preparation = Promise.all([
    registration.loadComponent ? registration.loadComponent() : registration.component,
    registration.loadData ? registration.loadData() : undefined,
  ]).then(([Component, data]) => ({ name: resolvedName, Component, data }));

  cache.set(resolvedName, preparation);
  preparation.catch(() => {
    if (cache.get(resolvedName) === preparation) cache.delete(resolvedName);
  });
  return preparation;
}
