import Button from "@/components/Button";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export default function ErrorTemplatePage({
  code,
  title,
  description,
  actionHref = "/",
  actionLabel = "Return home",
}) {
  return (
    <DefaultTemplatePage>
      <section className="flex flex-1 items-center justify-center bg-background px-6 py-24 text-center">
        <div className="mx-auto max-w-2xl">
          {code ? (
            <h1 className="text-6xl font-bold uppercase tracking-[0.08em] text-accent sm:text-7xl">
              {code}
            </h1>
          ) : null}
          <h2 className="mt-4 text-4xl font-bold tracking-tight text-heading sm:text-5xl">
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-lg text-muted">{description}</p>
          ) : null}
          {actionHref && actionLabel ? (
            <div className="mt-8 flex justify-center">
              <Button href={actionHref}>{actionLabel}</Button>
            </div>
          ) : null}
        </div>
      </section>
    </DefaultTemplatePage>
  );
}
