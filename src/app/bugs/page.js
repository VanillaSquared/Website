import Button from "@/components/Button";
import Card from "@/components/Card";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export const metadata = {
  title: "Bug Reporter | Vanilla²",
  description: "Report a bug for Vanilla².",
};

export default function BugsPage() {
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

          <Card
            title="Bug reports coming soon"
            description="The bug reporter form is temporarily unavailable while we prepare it."
            className="rounded-2xl border-divider text-center"
            hoverAccent={false}
          >
            <div className="mt-6 flex justify-center">
              <Button
                href="https://github.com/VanillaSquared/Website/issues"
                variant="secondary"
                external
              >
                View existing reports
              </Button>
            </div>
          </Card>
        </div>
      </section>
    </DefaultTemplatePage>
  );
}
