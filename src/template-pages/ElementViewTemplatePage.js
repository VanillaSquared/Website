import Link from "next/link";

import Card from "@/components/Card";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export default function ElementViewTemplatePage({
  children,
  routeSegments = [],
  backHref,
  backLabel = "Back",
  eyebrow,
  title,
  subtitle,
  badges,
  meta = [],
  aside,
  search = {},
  maxWidth = "max-w-6xl",
  className = "",
}) {
  return (
    <DefaultTemplatePage search={search}>
      <section className={`flex flex-1 justify-center bg-background px-6 py-10 ${className}`}>
        <div className={`w-full ${maxWidth}`}>
          {routeSegments.length ? (
            <nav aria-label="Route" className="mb-5 flex flex-wrap items-center gap-2 text-sm text-muted">
              {routeSegments.map((segment, index) => {
                const isLast = index === routeSegments.length - 1;
                const content = <span className={isLast ? "font-semibold text-heading" : "transition-colors hover:text-soft"}>{segment.label}</span>;

                return (
                  <span key={`${segment.label}-${index}`} className="flex items-center gap-2">
                    {index > 0 ? <span className="text-subtle">/</span> : null}
                    {segment.href && !isLast ? <Link href={segment.href}>{content}</Link> : content}
                  </span>
                );
              })}
            </nav>
          ) : null}

          {backHref ? (
            <Link href={backHref} className="mb-4 inline-flex text-sm font-semibold text-accent transition-colors hover:text-heading">
              ← {backLabel}
            </Link>
          ) : null}

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem]">
            <article className="min-w-0 overflow-hidden rounded-2xl border border-divider bg-card">
              <header className="border-b border-divider px-5 py-5 sm:px-7">
                {eyebrow ? <p className="mb-2 font-mono text-xs font-bold text-accent">{eyebrow}</p> : null}
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <h1 className="text-2xl font-bold tracking-tight text-heading sm:text-3xl">{title}</h1>
                    {subtitle ? <p className="mt-2 text-sm leading-6 text-muted">{subtitle}</p> : null}
                  </div>
                  {badges ? <div className="flex shrink-0 flex-wrap gap-2 sm:justify-end">{badges}</div> : null}
                </div>
              </header>

              <div className="px-5 py-6 sm:px-7">{children}</div>
            </article>

            <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
              {meta.length ? (
                <Card title="Details" preset="auth" size="p-5" titleAs="h2" titleClassName="text-base font-semibold text-heading" contentClassName="mt-3" hoverAccent={false}>
                  <dl className="space-y-2.5">
                    {meta.map((item) => (
                      <div key={item.label}>
                        <dt className="text-xs font-semibold leading-4 text-subtle">{item.label}</dt>
                        <dd className={`mt-0.5 text-sm leading-5 ${item.className ?? "text-soft"}`}>{item.value}</dd>
                      </div>
                    ))}
                  </dl>
                </Card>
              ) : null}
              {aside}
            </aside>
          </div>
        </div>
      </section>
    </DefaultTemplatePage>
  );
}
