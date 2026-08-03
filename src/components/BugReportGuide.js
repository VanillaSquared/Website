"use client";

import { useState } from "react";

import questionIcon from "@/assets/icons/question.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";

const guideSteps = [
  {
    title: "Check for duplicates",
    description: "Search the bug list first. If the problem already exists, add any missing details to that report instead.",
  },
  {
    title: "Create the report file",
    description: "Add a Markdown file in src/bugs/ using the next vsq- ID for mod bugs or web- ID for website bugs.",
  },
  {
    title: "Describe and submit it",
    description: "Complete the report header, write clear reproduction steps, then submit your change to the Website repository.",
  },
];

const guidelines = [
  "Use a short, specific title and report only one problem per report.",
  "Include the exact Vanilla Squared version; do not write \"latest.\" (*the website doesn't have versions)",
  "Explain what happened and the exact steps needed to reproduce it.",
  "Do not distribute material you don't have the rights to.",
  "Attach relevant logs or crash reports. Screenshots and videos should support, not replace, written steps.",
  "Remove access tokens, private server addresses, and any other sensitive information before submitting.",
  "Leave new reports as unconfirmed with no priority until they have been reviewed.",
];

export default function BugReportGuide() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        variant="tertiary"
        size="icon"
        className="!bg-search hover:!bg-search-hover focus-visible:!bg-search-hover"
        icon={questionIcon}
        iconClassName="h-6 w-6 text-button-tertiary-text"
        aria-label="Bug report guide"
        title="How to create a bug report"
        onClick={() => setOpen(true)}
      />

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        variant="wide"
        ariaLabelledBy="bug-report-guide-title"
        ariaDescribedBy="bug-report-guide-description"
      >
        <div className="space-y-6">
          <header>
            <p className="text-sm font-semibold text-accent">Bug reporting help</p>
            <h2 id="bug-report-guide-title" className="mt-1 text-2xl font-bold text-heading">
              Create a useful bug report
            </h2>
            <p id="bug-report-guide-description" className="mt-2 text-sm leading-6 text-muted">
              A complete report makes it easier to reproduce the problem and get it fixed quickly.
            </p>
          </header>

          <section aria-labelledby="quick-guide-title">
            <h3 id="quick-guide-title" className="text-lg font-semibold text-heading">Quick guide</h3>
            <ol className="mt-3 grid gap-3 md:grid-cols-3">
              {guideSteps.map((step, index) => (
                <li key={step.title} className="rounded-xl border border-divider bg-control/40 p-4">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-control-accent-soft text-sm font-bold text-accent">
                    {index + 1}
                  </span>
                  <h4 className="mt-3 font-semibold text-heading">{step.title}</h4>
                  <p className="mt-1 text-sm leading-5 text-muted">{step.description}</p>
                </li>
              ))}
            </ol>
          </section>

          <section aria-labelledby="report-guidelines-title">
            <h3 id="report-guidelines-title" className="text-lg font-semibold text-heading">Bug report guidelines</h3>
            <ul className="mt-3 grid gap-x-8 gap-y-2 text-sm leading-6 text-soft md:grid-cols-2">
              {guidelines.map((guideline) => (
                <li key={guideline} className="flex gap-3">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{guideline}</span>
                </li>
              ))}
            </ul>
          </section>

          <footer className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="tertiary" onClick={() => setOpen(false)}>Close</Button>
            <Button href="/docs/website/making_a_bug_report" variant="secondary">Read the full guide</Button>
            <Button href="https://github.com/VanillaSquared/Website" external>Open GitHub</Button>
          </footer>
        </div>
      </Modal>
    </>
  );
}
