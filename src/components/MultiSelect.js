"use client";

import Preview from "@/components/Preview";

export default function MultiSelect({
  min = 0,
  max = Infinity,
  placeholder = "Select one or more...",
  ...props
}) {
  return <Preview multiple min={min} max={max} placeholder={placeholder} {...props} />;
}
