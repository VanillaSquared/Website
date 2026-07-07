"use client";

import { useEffect, useState } from "react";

const BUG_REPORT_CREATED_EVENT = "bug-report-created";

export { BUG_REPORT_CREATED_EVENT };

export default function BugReportSuccessNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timeoutId;

    function showNotice() {
      setVisible(true);
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setVisible(false), 5000);
    }

    window.addEventListener(BUG_REPORT_CREATED_EVENT, showNotice);

    return () => {
      window.removeEventListener(BUG_REPORT_CREATED_EVENT, showNotice);
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!visible) {
    return null;
  }

  return (
    <p role="status" className="mb-2 text-center text-sm font-medium text-success">
      Bug reported successfully.
    </p>
  );
}
