"use client";

import { useState } from "react";

import plusIcon from "@cdn/icons/plus.svg";
import {
  BUG_ATTACHMENT_ACCEPT,
  BUG_ATTACHMENT_MAX_FILES,
  BUG_ATTACHMENT_MAX_FILE_SIZE_BYTES,
  BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES,
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

export default function BugReportGuide() {
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function openForm() {
    setError("");
    setOpen(true);
  }

  async function submitReport(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = event.currentTarget;
    const fields = new FormData(form);

    try {
      const response = await fetch("/api/bugs", {
        method: "POST",
        headers: { Accept: "application/json" },
        body: fields,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Bug report could not be created.");

      setOpen(false);
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
        onClose={() => setOpen(false)}
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
            <label className="flex flex-col gap-2 text-sm font-semibold text-soft sm:col-span-2" htmlFor="attachments">
              Attachments
              <input
                id="attachments"
                name="attachments"
                type="file"
                multiple
                accept={BUG_ATTACHMENT_ACCEPT}
                className="rounded-lg bg-input px-3 py-2 text-sm font-normal text-heading outline-none transition-colors file:mr-3 file:rounded-md file:border-0 file:bg-button-tertiary file:px-3 file:py-1 file:font-semibold file:text-button-tertiary-text hover:bg-input-hover hover:file:bg-button-tertiary-hover focus:bg-input-focus"
                aria-describedby="attachments-help"
              />
              <span id="attachments-help" className="text-xs font-normal leading-5 text-muted">
                Optional. Up to {BUG_ATTACHMENT_MAX_FILES} files, {BUG_ATTACHMENT_MAX_FILE_SIZE_BYTES / 1024 / 1024} MB each and {BUG_ATTACHMENT_MAX_TOTAL_SIZE_BYTES / 1024 / 1024} MB total. Screenshots, logs, and ZIP files are supported.
              </span>
            </label>
          </div>

          {error ? <p role="alert" className="rounded-lg bg-error-surface px-3 py-2 text-sm text-error">{error}</p> : null}

          <footer className="flex justify-end gap-2">
            <Button variant="tertiary" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button type="submit" border={false} disabled={submitting}>{submitting ? "Submitting…" : "Submit report"}</Button>
          </footer>
        </form>
      </Modal>
    </>
  );
}
