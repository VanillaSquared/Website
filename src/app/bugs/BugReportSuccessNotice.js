"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const BUG_REPORT_CREATED_EVENT = "bug-report-created";

export { BUG_REPORT_CREATED_EVENT };

export default function BugReportSuccessNotice() {
  const [bugId, setBugId] = useState(null);

  useEffect(() => {
    let timeoutId;

    function showNotice(event) {
      setBugId(event.detail?.bugId ?? null);
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => setBugId(null), 5000);
    }

    window.addEventListener(BUG_REPORT_CREATED_EVENT, showNotice);

    return () => {
      window.removeEventListener(BUG_REPORT_CREATED_EVENT, showNotice);
      window.clearTimeout(timeoutId);
    };
  }, []);

  if (!bugId) {
    return null;
  }

  return (
    <p role="status" className="mb-2 text-center text-sm font-medium">
      <Link href={`/bugs/${encodeURIComponent(bugId)}`} className="text-success hover:underline">
        Bug reported successfully.
      </Link>
    </p>
  );
}
