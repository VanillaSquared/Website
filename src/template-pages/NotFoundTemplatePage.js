import Button from "@/components/Button";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export default function NotFoundTemplatePage() {
  return (
    <DefaultTemplatePage>
      <section className="flex flex-1 items-center justify-center bg-background px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-accent">
            404
          </p>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            Page not found
          </h1>
          <p className="mt-4 text-lg text-muted">
            The page you are looking for does not exist or has been moved.
          </p>
          <div className="mt-8 flex justify-center">
            <Button href="/">Return home</Button>
          </div>
        </div>
      </section>
    </DefaultTemplatePage>
  );
}
