import Link from "next/link";

import { getAuthSubject } from "@/app/auth";
import Card from "@/components/Card";
import Tag from "@/components/Tag";
import { getVisibleNewsArticles, NEWS_TAGS } from "@/news/server";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export const metadata = {
  title: "News | Vanilla²",
  description: "News and updates from Vanilla².",
};

export default async function NewsPage({ searchParams }) {
  const subject = await getAuthSubject({ updateTokens: false });
  const articles = await getVisibleNewsArticles(subject?.properties ?? null);
  const { tag } = await searchParams;
  const requestedTags = Array.isArray(tag) ? tag : tag ? [tag] : [];
  const selectedTags = [...new Set(requestedTags)].filter((name) => Object.hasOwn(NEWS_TAGS, name));
  const filteredArticles = selectedTags.length
    ? articles.filter((article) => article.tags.some(({ name }) => selectedTags.includes(name)))
    : articles;
  const tagOptions = Object.entries(NEWS_TAGS).map(([value, { label }]) => ({ value, label }));

  return (
    <DefaultTemplatePage
      header={{
        variant: "news",
        newsTagFilter: { options: tagOptions, value: selectedTags },
      }}
    >
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-10 sm:px-8 lg:px-10">
        {filteredArticles.length ? (
          <section aria-label="News articles" className="grid grid-cols-[repeat(auto-fill,minmax(min(100%,18rem),1fr))] gap-6">
            {filteredArticles.map((article) => (
              <article key={article.path}>
                <Card
                  as={Link}
                  href={article.path}
                  preset="news"
                  title={article.title}
                  media={article.image ? <img src={article.image} alt={article.imageAlt} className="h-full w-full object-cover" /> : null}
                  className="h-full"
                >
                  <div className="flex flex-wrap gap-2">
                    {article.tags.map((tag) => <Tag key={tag.name} variant="accent">{tag.label}</Tag>)}
                  </div>
                </Card>
              </article>
            ))}
          </section>
        ) : (
          <div className="py-10 text-center">
            <h2 className="text-lg font-semibold text-heading">{selectedTags.length ? "No matching news" : "No news yet"}</h2>
            <p className="mt-2 text-sm text-muted">
              {selectedTags.length ? "Choose different tags to see more articles." : "Check back later for Vanilla² updates."}
            </p>
          </div>
        )}
      </main>
    </DefaultTemplatePage>
  );
}
