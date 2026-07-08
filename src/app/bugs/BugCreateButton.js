"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import plusIcon from "@/assets/icons/plus.svg";
import xIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

import { BUG_REPORT_CREATED_EVENT } from "./BugReportSuccessNotice";
import BugReporterForm from "./BugReporterForm";

function formatRemainingTime(target) {
  if (!target) return "";

  const remaining = new Date(target).getTime() - Date.now();
  if (!Number.isFinite(remaining) || remaining <= 0) return "available soon";

  const totalSeconds = Math.ceil(remaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

function getLockedDescription(creationAvailability, remainingTime) {
  if (!creationAvailability || creationAvailability.allowed) return "";
  if (creationAvailability.permanent) return "You are permanently banned\nfrom creating bugs.";
  if (remainingTime) return `You are banned from\ncreating bugs until:\n${remainingTime}`;
  return creationAvailability.error || "Bug creation is currently locked.";
}

export default function BugCreateButton({ categories, versions, authenticated, creatorUser, creationAvailability }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [remainingTime, setRemainingTime] = useState(formatRemainingTime(creationAvailability?.blockedUntil));
  const creationLocked = Boolean(authenticated && creationAvailability && !creationAvailability.allowed);

  useEffect(() => {
    if (!creationAvailability?.blockedUntil || creationAvailability?.permanent) return undefined;

    const update = () => setRemainingTime(formatRemainingTime(creationAvailability.blockedUntil));
    update();
    const interval = window.setInterval(update, 1000);
    return () => window.clearInterval(interval);
  }, [creationAvailability?.blockedUntil, creationAvailability?.permanent]);

  function handleCreated(result) {
    setOpen(false);
    window.dispatchEvent(new CustomEvent(BUG_REPORT_CREATED_EVENT, {
      detail: { bugId: result?.publicId ?? result?.id },
    }));
    router.refresh();
  }

  return (
    <>
      <Button
        variant={creationLocked ? "locked" : "iconButton"}
        size="iconButton"
        icon={plusIcon}
        iconClassName="h-5 w-5"
        aria-label="Add bug report"
        title={creationLocked ? undefined : "Add bug report"}
        locked={creationLocked}
        chatbox={creationLocked ? { description: getLockedDescription(creationAvailability, remainingTime), placement: "below" } : null}
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
