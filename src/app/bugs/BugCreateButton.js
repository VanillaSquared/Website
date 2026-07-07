"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import plusIcon from "@/assets/icons/plus.svg";
import xIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

import BugReporterForm from "./BugReporterForm";

export default function BugCreateButton({ categories, versions, authenticated, creatorUser }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  function handleCreated() {
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
      <Modal open={open} onClose={() => setOpen(false)} variant="wide" className="max-h-[calc(100dvh-2rem)] overflow-hidden !p-0">
        <div className="flex max-h-[calc(100dvh-2rem)] flex-col">
          <div className="flex items-start justify-between border-b border-divider px-6 py-4">
            <div>
              <h2 className="text-xl font-semibold text-heading">Create bug report</h2>
              <p className="mt-1 text-sm text-muted">Report an issue for the Vanilla² team to triage.</p>
            </div>
            <Button size="icon" variant="tertiary" icon={xIcon} aria-label="Close create bug report" onClick={() => setOpen(false)} />
          </div>
          <div className="overflow-y-auto p-6">
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
