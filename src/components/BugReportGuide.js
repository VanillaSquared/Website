"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import plusIcon from "@cdn/icons/plus.svg";
import {
  BUG_ATTACHMENT_CHUNK_BYTES,
  BUG_DESCRIPTION_MAX_LENGTH,
  BUG_REPORT_CATEGORY_CONFIGS,
  BUG_TITLE_MAX_LENGTH,
  MINECRAFT_VERSIONS,
  MOD_VERSIONS,
  OPERATING_SYSTEMS,
} from "@/bugs/config";
import Button from "@/components/Button";
import FileUpload from "@/components/FileUpload";
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

function createUploadManifest(files) {
  return files.map((file, fileIndex) => ({
    file,
    fileId: crypto.randomUUID(),
    fileIndex,
    name: file.name,
    fileSize: file.size,
    chunkCount: Math.max(1, Math.ceil(file.size / BUG_ATTACHMENT_CHUNK_BYTES)),
  }));
}

async function createUploadSession(reportInput, uploadManifest) {
  const response = await fetch("/api/bugs/uploads", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      ...reportInput,
      manifest: uploadManifest.map(({ fileId, fileIndex, name, fileSize, chunkCount }) => ({
        fileId,
        fileIndex,
        name,
        fileSize,
        chunkCount,
      })),
    }),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok || typeof result.sessionToken !== "string") {
    throw new Error(result.error || "Could not start the attachment upload.");
  }
  return result.sessionToken;
}

async function uploadAttachmentChunks(uploadManifest, sessionToken) {
  const tokens = [];

  for (const entry of uploadManifest) {
    const { file, fileId, fileIndex, name, fileSize, chunkCount } = entry;

    for (let chunkIndex = 0; chunkIndex < chunkCount; chunkIndex += 1) {
      const start = chunkIndex * BUG_ATTACHMENT_CHUNK_BYTES;
      const end = Math.min(fileSize, start + BUG_ATTACHMENT_CHUNK_BYTES);
      const chunk = file.slice(start, end);
      const searchParams = new URLSearchParams({
        fileId,
        fileIndex: String(fileIndex),
        name,
        fileSize: String(fileSize),
        chunkIndex: String(chunkIndex),
        chunkCount: String(chunkCount),
      });

      const response = await fetch(`/api/bugs/uploads?${searchParams}`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/octet-stream",
          "X-VSQ-Upload-Session": sessionToken,
        },
        body: chunk,
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || typeof result.token !== "string") {
        throw new Error(result.error || `Could not upload ${name}.`);
      }
      tokens.push(result.token);
    }
  }

  return tokens;
}

export default function BugReportGuide() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [files, setFiles] = useState([]);

  function openForm() {
    setError("");
    setStartedAt(Date.now());
    setOpen(true);
  }

  function closeForm() {
    setOpen(false);
    setFiles([]);
    setError("");
  }

  async function submitReport(event) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const form = event.currentTarget;
    const fields = new FormData(form);
    const reportInput = {
      title: String(fields.get("title") ?? ""),
      description: String(fields.get("description") ?? ""),
      category: String(fields.get("category") ?? ""),
      minecraftVersion: String(fields.get("minecraftVersion") ?? ""),
      modVersion: String(fields.get("modVersion") ?? ""),
      operatingSystem: String(fields.get("operatingSystem") ?? ""),
      website: String(fields.get("website") ?? ""),
      startedAt,
    };

    try {
      let uploadSession = "";
      let attachmentTokens = [];

      if (files.length) {
        const uploadManifest = createUploadManifest(files);
        uploadSession = await createUploadSession(reportInput, uploadManifest);
        attachmentTokens = await uploadAttachmentChunks(uploadManifest, uploadSession);
      }

      const response = await fetch("/api/bugs", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...reportInput,
          attachmentTokens,
          uploadSession,
        }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Bug report could not be created.");

      form.reset();
      closeForm();
      const partialFailure = result.attachmentUploadFailed === true ? "?attachmentUpload=failed" : "";
      router.push(`/bugs/${result.bug.id}${partialFailure}`);
      router.refresh();
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
            <FileUpload files={files} onChange={setFiles} disabled={submitting} className="sm:col-span-2" />
            <SelectField
              label="Category"
              name="category"
              options={BUG_REPORT_CATEGORY_CONFIGS.map(({ slug, label }) => ({ value: slug, label }))}
            />
            <SelectField label="Minecraft version" name="minecraftVersion" options={MINECRAFT_VERSIONS} />
            <SelectField label="Mod version" name="modVersion" options={MOD_VERSIONS} />
            <SelectField label="Operating system" name="operatingSystem" options={OPERATING_SYSTEMS} />
          </div>

          <label className="absolute -left-[10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" />
          </label>

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
