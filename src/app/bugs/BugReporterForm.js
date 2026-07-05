"use client";

import { useState } from "react";

import Button from "@/components/Button";
import TextInput from "@/components/TextInput";

export default function BugReporterForm({ categories, versions, authenticated }) {
  const [fixed, setFixed] = useState(false);
  const [status, setStatus] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus(null);
    setSubmitting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    formData.set("fixed", fixed ? "true" : "false");

    if (!fixed) {
      formData.delete("fixedVersion");
    }

    try {
      const response = await fetch("/api/bugs", {
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
      setFixed(false);
      setStatus({ type: "success", message: `Bug report submitted. ID: ${result.id}` });
    } catch {
      setStatus({ type: "error", message: "Failed to submit bug report." });
    } finally {
      setSubmitting(false);
    }
  }

  if (!authenticated) {
    return (
      <div className="rounded-2xl border border-divider bg-card p-6 text-center">
        <h2 className="text-2xl font-bold text-heading">Log in to submit reports</h2>
        <p className="mt-2 text-muted">Bug reports are linked to your Vanilla² account.</p>
        <Button href="/login?returnTo=/bugs" className="mt-5">Log in</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-2xl border border-divider bg-card p-6 shadow-sm">
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
          Category
          <select
            name="category"
            required
            className="rounded-lg border border-input-border bg-input px-3 py-2 text-heading outline-none transition-colors hover:border-input-border-hover hover:bg-input-hover focus:border-input-border-focus focus:bg-input-focus"
          >
            <option value="">Choose a category</option>
            {categories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </label>

        <TextInput label="Title" name="title" sampleText="Short summary of the issue" required maxLength={160} />
      </div>

      <label className="mt-5 flex flex-col gap-2 text-sm font-semibold text-soft">
        Description
        <textarea
          name="description"
          required
          rows={8}
          maxLength={8000}
          placeholder="What happened? What did you expect? Include steps to reproduce the bug."
          className="rounded-lg border border-input-border bg-input px-3 py-2 text-heading outline-none transition-colors placeholder:text-input-sample placeholder:italic hover:border-input-border-hover hover:bg-input-hover focus:border-input-border-focus focus:bg-input-focus"
        />
      </label>

      <fieldset className="mt-5 rounded-xl border border-divider p-4">
        <legend className="px-2 text-sm font-semibold text-soft">Affected versions</legend>
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
          {versions.map((version) => (
            <label key={version} className="flex items-center gap-2 text-sm text-muted">
              <input type="checkbox" name="affectedVersions" value={version} className="h-4 w-4" />
              {version}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="mt-5 grid gap-5 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-semibold text-soft">
          <input
            type="checkbox"
            checked={fixed}
            onChange={(event) => setFixed(event.target.checked)}
            className="h-4 w-4"
          />
          Already fixed
        </label>

        {fixed ? (
          <label className="flex flex-col gap-2 text-sm font-semibold text-soft">
            Fixed version
            <select
              name="fixedVersion"
              required={fixed}
              className="rounded-lg border border-input-border bg-input px-3 py-2 text-heading outline-none transition-colors hover:border-input-border-hover hover:bg-input-hover focus:border-input-border-focus focus:bg-input-focus"
            >
              <option value="">Choose fixed version</option>
              {versions.map((version) => (
                <option key={version} value={version}>{version}</option>
              ))}
            </select>
          </label>
        ) : null}
      </div>

      <label className="mt-5 flex flex-col gap-2 text-sm font-semibold text-soft">
        Attachments
        <input
          name="files"
          type="file"
          multiple
          accept=".log,.png,.txt,.json,.html"
          className="rounded-lg border border-input-border bg-input px-3 py-2 text-heading file:mr-4 file:rounded-lg file:border-0 file:bg-button-secondary file:px-3 file:py-1 file:text-button-text"
        />
        <span className="text-xs font-normal text-muted">Up to 3 files, 10 MB each. Allowed: .log, .png, .txt, .json, .html.</span>
      </label>

      {status ? (
        <p className={`mt-5 rounded-lg border px-4 py-3 text-sm ${status.type === "success" ? "border-divider text-heading" : "border-input-border-focus text-soft"}`}>
          {status.message}
        </p>
      ) : null}

      <div className="mt-6 flex flex-wrap gap-3">
        <Button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Submit bug report"}</Button>
        <Button href="https://github.com/VanillaSquared/Website/issues" variant="secondary" external>View existing reports</Button>
      </div>
    </form>
  );
}
