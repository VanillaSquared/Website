import { notFound } from "next/navigation";

import { getAuthSubject } from "@/app/auth";
import NewsAuthorCard from "@/components/NewsAuthorCard";
import Tag from "@/components/Tag";
import MarkdownContent from "@/markdown/MarkdownContent";
import { getNewsArticle, getNewsArticles, getVisibleNewsArticles } from "@/news/server";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export function generateStaticParams() {
  return getNewsArticles().map((article) => ({ slug: article.segments }));
}

async function getVisibleNewsArticle(slug) {
  const requestedArticle = getNewsArticle(slug);
  if (!requestedArticle) return null;

  const subject = await getAuthSubject({ updateTokens: false });
  const articles = await getVisibleNewsArticles(subject?.properties ?? null);
  return articles.find((article) => article.path === requestedArticle.path) ?? null;
}

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;
  const article = await getVisibleNewsArticle(slug);
  if (!article) return { title: "News article not found | Vanilla²" };

  return {
    title: `${article.title} | Vanilla² News`,
    description: `${article.tags.map((tag) => tag.label).join(", ")} from Vanilla²: ${article.title}.`,
  };
}

export default async function NewsArticlePage({ params }) {
  const { slug = [] } = await params;
  const article = await getVisibleNewsArticle(slug);
  if (!article) notFound();

  return (
    <DefaultTemplatePage>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 lg:px-10">
        <article>
          <header className={`mb-8 border-b border-divider pb-7 ${article.author ? "lg:ml-40" : ""}`}>
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

          {article.author ? (
            <div className="lg:grid lg:grid-cols-[8rem_minmax(0,1fr)] lg:gap-8">
              <aside className="mb-6 lg:mb-0" aria-label="Article author">
                <NewsAuthorCard author={article.author} username={article.authorUsername} createdAt={article.createdAtMs} />
              </aside>
              <MarkdownContent source={article.source} basePath={article.linkBase} />
            </div>
          ) : <MarkdownContent source={article.source} basePath={article.linkBase} />}
        </article>
      </main>
    </DefaultTemplatePage>
  );
}
