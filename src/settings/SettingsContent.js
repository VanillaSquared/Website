import AccountSettings from "@/settings/AccountSettings";
import { settingsRegistry } from "@/settings/settingsRegistry";

export default function SettingsContent({ activeItem, preparedView, permissions, onPreparedDataChange, children }) {
  if (children) {
    return children;
  }

  const registration = settingsRegistry[activeItem] ?? settingsRegistry.Account;
  const ActiveSetting = preparedView?.name === activeItem
    ? preparedView.Component
    : registration.component ?? AccountSettings;
  const preparedData = preparedView?.name === activeItem ? preparedView.data : undefined;

  return (
    <ActiveSetting
      permissions={permissions}
      preparedData={preparedData}
      onPreparedDataChange={(update) => onPreparedDataChange?.(activeItem, update)}
    />
  );
}
