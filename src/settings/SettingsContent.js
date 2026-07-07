import AccessibilitySettings from "@/settings/AccessibilitySettings";
import AccountSettings from "@/settings/AccountSettings";
import AppearanceSettings from "@/settings/AppearanceSettings";
import BugPanelSettings from "@/settings/BugPanelSettings";
import DesignTestSettings from "@/settings/DesignTestSettings";
import DevOptionsSettings from "@/settings/DevOptionsSettings";
import LanguageTimeSettings from "@/settings/LanguageTimeSettings";
import PrivacySettings from "@/settings/PrivacySettings";
import UserManagementSettings from "@/settings/UserManagementSettings";

const settingComponents = {
  Account: AccountSettings,
  Privacy: PrivacySettings,
  Appearance: AppearanceSettings,
  Accessibility: AccessibilitySettings,
  "Language&Time": LanguageTimeSettings,
  "Bug Panel": BugPanelSettings,
  "Dev Options": DevOptionsSettings,
  "Design Test": DesignTestSettings,
  "User Management": UserManagementSettings,
};

export default function SettingsContent({ activeItem, children }) {
  if (children) {
    return children;
  }

  const ActiveSetting = settingComponents[activeItem] ?? AccountSettings;

  return <ActiveSetting />;
}
