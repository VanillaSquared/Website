"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import plusIcon from "@/assets/icons/plus.svg";
import xIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

import { BUG_REPORT_CREATED_EVENT } from "./BugReportSuccessNotice";
import BugReporterForm from "./BugReporterForm";

export default function BugCreateButton({ categories, versions, authenticated, creatorUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleCreated() {
    setOpen(false);
    window.dispatchEvent(new Event(BUG_REPORT_CREATED_EVENT));
    router.refresh();
  }

  return (
    <>
      <Button
        variant="iconButton"
        size="iconButton"
        icon={plusIcon}
        iconClassName="h-5 w-5"
        aria-label="Add bug report"
        title="Add bug report"
        onClick={() => setOpen(true)}
      />
      <Modal open={open} onClose={() => setOpen(false)} variant="wide" className="!p-0">
        <div className="flex flex-col">
          <div className="flex items-start justify-between border-b border-divider px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-heading">Create bug report</h2>
              <p className="mt-1 text-sm text-muted">No Troll bug reports!</p>
            </div>
            <Button size="icon" variant="tertiary" icon={xIcon} aria-label="Close create bug report" onClick={() => setOpen(false)} />
          </div>
          <div className="p-6">
            <BugReporterForm
              categories={categories}
              versions={versions}
              authenticated={authenticated}
              creatorUser={creatorUser}
              onCreated={handleCreated}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
