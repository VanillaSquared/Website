"use client";

import { useState } from "react";

import Button from "@/components/Button";
import FileUpload from "@/components/FileUpload";
import Preview from "@/components/Preview";
import TextInput from "@/components/TextInput";

export default function BugReporterForm({ categories, versions, authenticated, creatorUser, onCreated }) {
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
      const response = await fetch("/api/bugs/create", {
        method: "POST",
        body: formData,
        credentials: "same-origin",
      });
      const result = await response.json();

      if (!response.ok) {
        setStatus({ type: "error", message: result.error ?? "Failed to submit bug report." });
        return;
      }

      form.reset();
      setResetKey((current) => current + 1);
      setStatus({ type: "success", message: `Bug report submitted. ID: ${result.publicId ?? result.id}` });
      onCreated?.(result);
    } catch {
      setStatus({ type: "error", message: "Failed to submit bug report." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!authenticated || !creatorUser?.id) {
    return (
      <div className="rounded-2xl border border-divider bg-card p-6 text-center">
        <h2 className="text-2xl font-bold text-heading">Log in to submit reports</h2>
        <p className="mt-2 text-muted">Bug reports are linked to your Vanilla² account.</p>
        <Button href="/login?returnTo=/bugs" className="mt-5">Log in</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input type="hidden" name="creatorUserId" value={creatorUser?.id ?? ""} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Preview
          key={`category-${resetKey}`}
          label="Category"
          name="category"
          multiple={false}
          placeholder="Choose a category"
          options={categories.map((category) => ({ value: category.slug ?? category, label: category.label ?? category }))}
        />

        <TextInput label="Title" name="title" sampleText="Short summary of the issue" required minCharacters={3} maxCharacters={120} />
      </div>

      <TextInput
        label="Description"
        name="description"
        sampleText="What happened? What did you expect? Include steps to reproduce the bug."
        lines={5}
        required
        minCharacters={3}
        maxCharacters={8000}
      />

      <Preview
        key={`versions-${resetKey}`}
        label="Affected versions"
        name="affectedVersions"
        options={versions}
        placeholder="Choose affected versions"
        menuClassName="!w-64"
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
      />

      {status ? (
        <p className={`rounded-lg border px-4 py-3 text-sm ${status.type === "success" ? "border-divider text-heading" : "border-input-border-focus text-soft"}`}>
          {status.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit bug report"}</Button>
      </div>
    </form>
  );
}
