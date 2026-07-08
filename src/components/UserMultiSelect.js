"use client";

import { useMemo } from "react";

import MultiSelect from "@/components/MultiSelect";

function userLabel(user) {
  return user?.username || user?.id || "Unnamed user";
}

export default function UserMultiSelect({
  users = [],
  value = [],
  placeholder = "Select users",
  label = "Users",
  emptyText = "No users found.",
  ...props
}) {
  const options = useMemo(() => {
    const seen = new Set();
    return users
      .filter((user) => user?.id && !seen.has(user.id) && seen.add(user.id))
      .sort((a, b) => userLabel(a).localeCompare(userLabel(b)))
      .map((user) => ({ label: userLabel(user), value: user.id }));
  }, [users]);

  return (
    <MultiSelect
      label={label}
      options={options}
      value={value}
      placeholder={placeholder}
      emptyText={emptyText}
      {...props}
    />
  );
}
