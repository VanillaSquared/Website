"use client";

import { useState } from "react";

import Button from "@/components/Button";
import FileUpload from "@/components/FileUpload";
import Preview from "@/components/Preview";
import TextInput from "@/components/TextInput";
import Toggle from "@/components/Toggle";

export default function BugReporterForm({ categories, versions, authenticated, creatorUser, onCreated, mode = "create", report = null, onUpdated }) {
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [resetKey, setResetKey] = useState(0);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);

    try {
      const editing = mode === "edit" && report?.publicId;
      const response = await fetch(editing ? `/api/bugs/${encodeURIComponent(report.publicId)}` : "/api/bugs/create", {
        method: editing ? "PATCH" : "POST",
        body: formData,
        credentials: "same-origin",
      });
      const result = await response.json();

      if (!response.ok) {
        setStatus({ type: "error", message: result.error ?? "Failed to submit bug report." });
        return;
      }

      if (editing) {
        setStatus({ type: "success", message: `Bug report ${result.publicId} updated.` });
        onUpdated?.(result);
      } else {
        form.reset();
        setResetKey((current) => current + 1);
        setStatus({ type: "success", message: `Bug report submitted. ID: ${result.publicId ?? result.id}` });
        onCreated?.(result);
      }
    } catch {
      setStatus({ type: "error", message: "Failed to submit bug report." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!authenticated || !creatorUser?.id) {
    return (
      <div className="py-3 text-center">
        <h2 className="text-xl font-bold text-heading">Log in to submit reports</h2>
        <p className="mt-1 text-sm text-muted">Bug reports are linked to your Vanilla² account.</p>
        <Button href="/login?returnTo=/bugs" className="mt-4">Log in</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <Preview
          key={`category-${resetKey}`}
          label="Category"
          name="category"
          multiple={false}
          placeholder="Choose a category"
          options={categories.map((category) => ({ value: category.slug ?? category, label: category.label ?? category }))}
          defaultValue={report?.category ?? []}
        />

        <TextInput label="Title" name="title" sampleText="Short summary of the issue" required minCharacters={3} maxCharacters={120} defaultValue={report?.title ?? ""} />
      </div>

      <TextInput
        label="Description"
        name="description"
        sampleText="What happened? What did you expect? Include steps to reproduce the bug."
        lines={5}
        required
        minCharacters={3}
        maxCharacters={8000}
        defaultValue={report?.description ?? ""}
      />

      <Preview
        key={`versions-${resetKey}`}
        label="Affected versions"
        name="affectedVersions"
        options={versions}
        placeholder="Choose affected versions"
        menuClassName="!w-64"
        defaultValue={report?.affectedVersions ?? []}
      />

      <Toggle
        key={`comments-${resetKey}`}
        name="allowComments"
        label="Allow comments"
        description="Let users discuss this report. Existing comments remain available if this is disabled later."
        defaultChecked={report?.allowComments ?? true}
      />

      <FileUpload
        key={`files-${resetKey}`}
        label="Attachments"
        description="Drop files here or click to upload."
        name="files"
        multiple
        accept=".log,.png,.txt,.json,.html"
        maxFiles={3}
        maxFileSize={10 * 1024 * 1024}
        compact
        showBrowseButton={false}
        existingFiles={report?.files ?? []}
      />

      {status ? (
        <p className={`rounded-lg border px-4 py-3 text-sm ${status.type === "success" ? "border-divider text-heading" : "border-input-border-focus text-soft"}`}>
          {status.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>
          {submitting ? (mode === "edit" ? "Saving..." : "Submitting...") : (mode === "edit" ? "Save changes" : "Submit bug report")}
        </Button>
      </div>
    </form>
  );
}
