"use client";

import { useState } from "react";

import plusIcon from "@cdn/icons/plus.svg";
import xIcon from "@cdn/icons/x.svg";
import {
  BUG_ATTACHMENT_ACCEPT,
  BUG_ATTACHMENT_EXTENSIONS,
  BUG_ATTACHMENT_MAX_FILES,
  BUG_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES,
  BUG_ATTACHMENT_MIME_TYPES,
  BUG_DESCRIPTION_MAX_LENGTH,
  BUG_REPORT_CATEGORY_CONFIGS,
  BUG_TITLE_MAX_LENGTH,
  MINECRAFT_VERSIONS,
  MOD_VERSIONS,
  OPERATING_SYSTEMS,
} from "@/bugs/config";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import TextInput from "@/components/TextInput";

const selectClassName = "rounded-lg border-0 bg-input px-3 py-2 text-heading outline-none transition-colors hover:bg-input-hover focus:bg-input-focus";

function SelectField({ label, name, options }) {
  return (
    <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
      {label}
      <select name={name} required defaultValue="" className={selectClassName}>
        <option value="" disabled>Select an option</option>
        {options.map((option) => (
          <option key={option.value ?? option} value={option.value ?? option}>{option.label ?? option}</option>
        ))}
      </select>
    </label>
  );
}

function supportsAttachment(file) {
  const fileName = file.name.split(/[\\/]/).pop() ?? "";
  const extension = fileName.match(/\.[a-z0-9]+$/i)?.[0].toLowerCase() ?? "";
  const mimeType = String(file.type ?? "").toLowerCase().split(";", 1)[0];
  return BUG_ATTACHMENT_EXTENSIONS.includes(extension)
    && (!mimeType || BUG_ATTACHMENT_MIME_TYPES.includes(mimeType));
}

export default function BugReportGuide() {
  const [open, setOpen] = useState(false);
  const [selectedAttachments, setSelectedAttachments] = useState([]);
  const [attachmentError, setAttachmentError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function openForm() {
    setError("");
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setSelectedAttachments([]);
    setAttachmentError("");
  }

  function handleAttachmentChange(event) {
    const accepted = [...selectedAttachments];
    let acceptedSize = accepted.reduce((total, file) => total + file.size, 0);
    const rejected = [];

    for (const file of event.currentTarget.files) {
      let reason = "";
      if (accepted.length >= BUG_ATTACHMENT_MAX_FILES) {
        reason = `the ${BUG_ATTACHMENT_MAX_FILES}-file limit was reached`;
      } else if (file.size > BUG_ATTACHMENT_MAX_FILE_SIZE_BYTES) {
        reason = `it exceeds the ${BUG_ATTACHMENT_MAX_FILE_SIZE_BYTES / 1024 / 1024} MB per-file limit`;
      } else if (!supportsAttachment(file)) {
        reason = "its file type is not supported";
      } else if (acceptedSize + file.size > BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES) {
        reason = `it would exceed the ${BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES / 1024 / 1024} MB total limit`;
      }

      if (reason) {
        rejected.push(`${file.name || "Unnamed file"} (${reason})`);
        continue;
      }

      accepted.push(file);
      acceptedSize += file.size;
    }

    setSelectedAttachments(accepted);
    if (rejected.length) {
      const shownRejected = rejected.slice(0, 3).join(", ");
      const remainingCount = rejected.length - 3;
      setAttachmentError(`Not added: ${shownRejected}${remainingCount > 0 ? ` and ${remainingCount} more` : ""}. The remaining files can still be submitted with the bug report.`);
    } else {
      setAttachmentError("");
    }

    event.currentTarget.value = "";
  }

  function removeAttachment(index) {
    setSelectedAttachments((attachments) => attachments.filter((_, attachmentIndex) => attachmentIndex !== index));
  }

  async function submitReport(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = event.currentTarget;
    const fields = new FormData(form);
    fields.delete("attachments");
    for (const file of selectedAttachments) fields.append("attachments", file);

    try {
      const response = await fetch("/api/bugs", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fields,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Bug report could not be created.");

      closeForm();
      form.reset();
      window.location.assign(`/bugs/${result.bug.id}`);
    } catch (submissionError) {
      setError(submissionError.message || "Bug report could not be created.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Button
        variant="tertiary"
        size="icon"
        className="!bg-search hover:!bg-search-hover focus-visible:!bg-search-hover"
        icon={plusIcon}
        iconClassName="h-5 w-5 text-button-tertiary-text"
        aria-label="Create bug report"
        title="Create bug report"
        onClick={openForm}
      />

      <Modal
        open={open}
        onClose={closeForm}
        variant="wide"
        className="!border-0"
        ariaLabelledBy="create-bug-report-title"
        ariaDescribedBy="create-bug-report-description"
      >
        <form onSubmit={submitReport} className="space-y-5">
          <header>
            <h2 id="create-bug-report-title" className="text-2xl font-bold text-heading">Create a bug report</h2>
            <p id="create-bug-report-description" className="mt-2 text-sm leading-6 text-muted">
              Describe one problem clearly. Reports can be submitted without signing in.
            </p>
          </header>

          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput
              label="Title"
              name="title"
              className="sm:col-span-2"
              inputClassName="!border-0"
              sampleText="A short summary of the problem"
              maxLength={BUG_TITLE_MAX_LENGTH}
              required
            />
            <TextInput
              label="Description"
              name="description"
              className="sm:col-span-2"
              inputClassName="!border-0"
              sampleText="What happened, what did you expect, and how can it be reproduced?"
              lines={5}
              maxLines={10}
              maxLength={BUG_DESCRIPTION_MAX_LENGTH}
              required
            />
            <SelectField
              label="Category"
              name="category"
              options={BUG_REPORT_CATEGORY_CONFIGS.map(({ slug, label }) => ({ value: slug, label }))}
            />
            <SelectField label="Minecraft version" name="minecraftVersion" options={MINECRAFT_VERSIONS} />
            <SelectField label="Mod version" name="modVersion" options={MOD_VERSIONS} />
            <SelectField label="Operating system" name="operatingSystem" options={OPERATING_SYSTEMS} />
            <div className="flex flex-col gap-2 text-sm font-semibold text-soft sm:col-span-2">
              <span>Attachments</span>
              <div className="flex min-h-10 flex-wrap items-center gap-2 rounded-lg bg-input px-3 py-2 font-normal text-heading outline-none transition-colors hover:bg-input-hover focus-within:bg-input-focus focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-accent">
                <input
                  id="attachments"
                  name="attachments"
                  type="file"
                  multiple
                  accept={BUG_ATTACHMENT_ACCEPT}
                  onChange={handleAttachmentChange}
                  className="sr-only"
                  aria-describedby="attachments-help"
                />
                <label
                  htmlFor="attachments"
                  className="inline-flex shrink-0 cursor-pointer items-center rounded-md bg-button-primary px-3 py-1 text-sm font-semibold text-button-text transition-colors hover:bg-button-primary-hover focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
                >
                  Choose files
                </label>
                {selectedAttachments.map((file, index) => (
                  <span key={`${file.name}-${file.lastModified}-${index}`} className="group/file relative inline-flex min-w-0 max-w-full items-center overflow-hidden rounded-md bg-input-hover px-2 py-1 transition-colors hover:bg-input-focus">
                    <span className="min-w-0 max-w-52 truncate">{file.name || "Unnamed file"}</span>
                    <Button
                      type="button"
                      variant="iconButton"
                      size="iconButtonSm"
                      icon={xIcon}
                      iconClassName="h-3.5 w-3.5"
                      aria-label={`Remove ${file.name || "attachment"}`}
                      className="!absolute top-1/2 right-1 z-10 !h-5 !w-5 -translate-y-1/2 !rounded !bg-input-hover !text-muted opacity-0 transition-opacity group-hover/file:opacity-100 group-focus-within/file:opacity-100 hover:!bg-input-focus hover:!text-heading focus-visible:opacity-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-accent"
                      onClick={() => removeAttachment(index)}
                    />
                  </span>
                ))}
              </div>
              {attachmentError ? <span role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-xs font-normal leading-5 text-error">{attachmentError}</span> : null}
              <span id="attachments-help" className="text-xs font-normal leading-5 text-muted">
                Optional. Up to {BUG_ATTACHMENT_MAX_FILES} files, {BUG_ATTACHMENT_MAX_FILE_SIZE_BYTES / 1024 / 1024} MB each and {BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES / 1024 / 1024} MB total. Screenshots, logs, and ZIP files are supported.
              </span>
            </div>
          </div>

          {error ? <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p> : null}

          <footer className="flex justify-end gap-2">
            <Button variant="tertiary" onClick={closeForm} disabled={submitting}>Cancel</Button>
            <Button type="submit" border={false} disabled={submitting}>{submitting ? "Submitting…" : "Submit report"}</Button>
          </footer>
        </form>
      </Modal>
    </>
  );
}
