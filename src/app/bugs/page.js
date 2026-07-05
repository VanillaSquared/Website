import { getAuthSubject } from "@/app/auth";
import { BUG_REPORT_CATEGORIES, BUG_REPORT_VERSIONS } from "@/bugs/reporter";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

import BugReporterForm from "./BugReporterForm";

export const metadata = {
  title: "Bug Reporter | Vanilla²",
  description: "Report a bug for Vanilla².",
};

export default async function BugsPage() {
  const subject = await getAuthSubject({ updateTokens: false });

  return (
    <DefaultTemplatePage>
      <section className="flex flex-1 items-center justify-center bg-background px-6 py-20">
        <div className="w-full max-w-3xl">
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold tracking-tight text-heading sm:text-5xl">
              Bug Reporter
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-muted">
              Found something broken in Vanilla²? Send a clear report with steps to
              reproduce it so we can investigate faster.
            </p>
          </div>

          <BugReporterForm
            categories={BUG_REPORT_CATEGORIES}
            versions={BUG_REPORT_VERSIONS}
            authenticated={Boolean(subject)}
          />
        </div>
      </section>
    </DefaultTemplatePage>
  );
}
