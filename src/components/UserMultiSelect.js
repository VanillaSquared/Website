"use client";

import { useMemo } from "react";

import MultiSelect from "@/components/MultiSelect";

function userLabel(user) {
  const name = user?.username || "Unnamed user";
  const detail = user?.email || user?.id || "Unknown id";
  return `${name} (${detail})`;
}

export default function UserMultiSelect({
  users = [],
  value = [],
  placeholder = "Select users",
  label = "Users",
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
      {...props}
    />
  );
}
