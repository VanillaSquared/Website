import Link from "next/link";
import { notFound } from "next/navigation";

import Card from "@/components/Card";
import CategoryNavigation from "@/components/CategoryNavigation";
import CopyDocumentButton from "@/components/CopyDocumentButton";
import DocsLayout from "@/components/DocsLayout";
import DocsMarkdown from "@/components/DocsMarkdown";
import OnThisPage from "@/components/OnThisPage";
import { getBreadcrumbs, getDocsData, getDocument } from "@/docs/server";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export function generateStaticParams() {
  return getDocsData().documents.map((document) => ({ slug: document.segments }));
}

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;
  const document = getDocument(slug);
  if (!document) return { title: "Documentation not found | Vanilla²" };

  return {
    title: `${document.title} | Vanilla² Docs`,
    description: document.description || `Vanilla² documentation: ${document.title}.`,
  };
}

export default async function DocsPage({ params }) {
  const { slug = [] } = await params;
  const document = getDocument(slug);
  if (!document) notFound();

  const { navigation } = getDocsData();
  const breadcrumbs = getBreadcrumbs(document);
  return (
    <DefaultTemplatePage>
      <DocsLayout navigation={(
        <aside className="hidden bg-category lg:block">
          <div className="sticky top-16 max-h-[calc(100vh-4rem)] overflow-y-auto">
            <CategoryNavigation items={navigation} selectedId={document.path} />
          </div>
        </aside>
      )} content={(
        <main className="min-w-0 px-5 py-8 lg:px-8 xl:px-10">
          <details className="mb-6 border-b border-category-line bg-category p-2 lg:hidden">
            <summary className="cursor-pointer px-2 py-1 font-semibold text-heading">Documentation navigation</summary>
            <CategoryNavigation items={navigation} selectedId={document.path} className="mt-2" />
          </details>

          <nav aria-label="Breadcrumb" className="mb-5 text-sm text-muted">
            <ol className="flex flex-wrap items-center gap-2">
              {breadcrumbs.map((breadcrumb, index) => (
                <li key={`${breadcrumb.title}-${index}`} className="flex items-center gap-2">
                  {index ? <span aria-hidden="true" className="text-subtle">/</span> : null}
                  {breadcrumb.href && index < breadcrumbs.length - 1 ? (
                    <Link href={breadcrumb.href} className="transition-colors hover:text-heading">{breadcrumb.title}</Link>
                  ) : <span aria-current={index === breadcrumbs.length - 1 ? "page" : undefined}>{breadcrumb.title}</span>}
                </li>
              ))}
            </ol>
          </nav>

          <header className="mb-8 border-b border-divider pb-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{document.title}</h1>
                {document.description ? <p className="mt-3 max-w-3xl text-lg text-muted">{document.description}</p> : null}
              </div>
              <CopyDocumentButton source={document.source} />
            </div>
          </header>

          <DocsMarkdown source={document.source} basePath={document.linkBase} />
        </main>
      )} sidebar={(
        <aside className="hidden bg-category px-6 py-8 xl:block">
          <div className="sticky top-24 max-h-[calc(100vh-7rem)] space-y-8 overflow-y-auto">
            {document.sidebarCard ? (
              <Card
                title={document.sidebarCard.title}
                preset="info"
                media={document.sidebarCard.image ? <img src={document.sidebarCard.image} alt={document.sidebarCard.imageAlt} className="h-auto w-full object-contain" /> : null}
                description={document.sidebarCard.description}
                details={document.sidebarCard.details}
              />
            ) : null}
            <OnThisPage headings={document.headings} />
          </div>
        </aside>
      )} />
    </DefaultTemplatePage>
  );
}
