import AccessibilitySettings from "@/components/settings/AccessibilitySettings";
import AccountSettings from "@/components/settings/AccountSettings";
import AppearanceSettings from "@/components/settings/AppearanceSettings";
import BugPanelSettings from "@/components/settings/BugPanelSettings";
import DesignTestSettings from "@/components/settings/DesignTestSettings";
import DevOptionsSettings from "@/components/settings/DevOptionsSettings";
import LanguageTimeSettings from "@/components/settings/LanguageTimeSettings";
import PrivacySettings from "@/components/settings/PrivacySettings";
import UserManagementSettings from "@/components/settings/UserManagementSettings";

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
