import { notFound } from "next/navigation";

import Tag from "@/components/Tag";
import MarkdownContent from "@/markdown/MarkdownContent";
import { getNewsArticle, getNewsArticles } from "@/news/server";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export function generateStaticParams() {
  return getNewsArticles().map((article) => ({ slug: article.segments }));
}

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;
  const article = getNewsArticle(slug);
  if (!article) return { title: "News article not found | Vanilla²" };

  return {
    title: `${article.title} | Vanilla² News`,
    description: `${article.tags.map((tag) => tag.label).join(", ")} from Vanilla²: ${article.title}.`,
  };
}

export default async function NewsArticlePage({ params }) {
  const { slug = [] } = await params;
  const article = getNewsArticle(slug);
  if (!article) notFound();

  return (
    <DefaultTemplatePage>
      <main className="mx-auto w-full max-w-4xl flex-1 px-5 py-10 sm:px-8 lg:px-10">
        <article>
          <header className="mb-8 border-b border-divider pb-7">
            {article.image && article.showImageOnPage ? (
              <img
                src={article.image}
                alt={article.imageAlt}
                className="mb-7 aspect-[16/9] w-full rounded-xl object-cover"
              />
            ) : null}
            <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{article.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Article tags">
              {article.tags.map((tag) => (
                <Tag key={tag.name} variant="accent" className="rounded-full">{tag.label}</Tag>
              ))}
            </div>
          </header>

          <MarkdownContent source={article.source} basePath={article.linkBase} />
        </article>
      </main>
    </DefaultTemplatePage>
  );
}
