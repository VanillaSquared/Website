import { notFound } from "next/navigation";

import { NewsCard } from "@/components/Card";
import Tag from "@/components/Tag";
import MarkdownContent from "@/markdown/MarkdownContent";
import { getVisibleNewsArticles } from "@/news/server";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export function generateStaticParams() {
  return getVisibleNewsArticles().map((article) => ({ slug: article.segments }));
}

function getVisibleNewsArticle(slug) {
  const segments = Array.isArray(slug) ? slug : [];
  const pathname = `/news/${segments.join("/")}`;
  return getVisibleNewsArticles().find((article) => article.path === pathname) ?? null;
}

export async function generateMetadata({ params }) {
  const { slug = [] } = await params;
  const article = getVisibleNewsArticle(slug);
  if (!article) return { title: "News article not found | Vanilla²" };

  return {
    title: `${article.title} | Vanilla² News`,
    description: `${article.tags.map((tag) => tag.label).join(", ")} from Vanilla²: ${article.title}.`,
  };
}

export default async function NewsArticlePage({ params }) {
  const { slug = [] } = await params;
  const article = getVisibleNewsArticle(slug);
  if (!article) notFound();

  return (
    <DefaultTemplatePage>
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-8 lg:px-10">
        <article>
          <header className="mb-8 border-b border-divider pb-7">
            {article.image && article.showImageOnPage ? <img src={article.image} alt={article.imageAlt} className="mb-7 aspect-[16/9] w-full rounded-xl object-cover" /> : null}
            <h1 className="text-3xl font-bold tracking-tight text-heading sm:text-4xl">{article.title}</h1>
            <div className="mt-4 flex flex-wrap gap-2" aria-label="Article tags">
              {article.tags.map((tag) => <Tag key={tag.name} variant={tag.name} className="rounded-full">{tag.label}</Tag>)}
            </div>
          </header>

          {article.author ? (
            <div className="lg:grid lg:grid-cols-[8rem_minmax(0,1fr)] lg:gap-8">
              <aside className="mb-6 lg:mb-0" aria-label="Article author">
                <NewsCard author={article.author} authorImage={article.authorImage} authorLink={article.authorLink} publishedAt={article.publishedAt} />
              </aside>
              <MarkdownContent source={article.source} basePath={article.linkBase} />
            </div>
          ) : <MarkdownContent source={article.source} basePath={article.linkBase} />}
        </article>
      </main>
    </DefaultTemplatePage>
  );
}
