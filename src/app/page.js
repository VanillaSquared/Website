import Link from "next/link";

import Button from "@/components/Button";
import Card from "@/components/Card";
import Footer from "@/components/Footer";
import ModrinthDownloadStats from "@/components/ModrinthDownloadStats";
import Tag from "@/components/Tag";
import { getVisibleNewsArticles } from "@/news/server";

export default function Home() {
  const latestNews = getVisibleNewsArticles().slice(0, 6);
  const features = [
    "Rebalanced armor, tools and weapons.",
    "New Redstone Sulfur Cube.",
    "New Enchantments.",
    "Remade enchantment system.",
    "Sulfur Goo & craftable gunpowder.",
    "Lots of new Datapack features.",
  ];

  const enchantments = [
    { name: "Dash", desc: "Burst forward and strike entities caught in the lunge." },
    { name: "Ruthless", desc: "Greatly increases attack damage at a self-damage cost." },
    { name: "Swirling", desc: "Spin with your weapon and repeatedly strike nearby enemies." },
    { name: "Void Strike", desc: "Applies the Voided effect to targets." },
  ];

  return (
    <div className="flex flex-col flex-1 font-sans">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center bg-background">
        <h1 className="text-5xl font-bold tracking-tight text-heading sm:text-6xl">
          Vanilla²
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-muted">
          A Fabric combat and progression overhaul that keeps Minecraft close to
          vanilla while expanding weapons, armor, enchantments, and combat utility.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Tag>Minecraft 26.2</Tag>
          <Tag>Fabric Loader ≥0.19.3</Tag>
          <Tag>Java ≥25</Tag>
        </div>
        <ModrinthDownloadStats />
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button href="https://modrinth.com/mod/vsq" external>
            Download
          </Button>
          <Button
            href="https://discord.gg/pppHybq9xT"
            variant="blurple"
            external
          >
            Discord
          </Button>
          <Button href="/docs" variant="blue">
            Docs
          </Button>
          <Button href="/bugs" variant="purple">
            Bug Reporter
          </Button>
          <Button href="/news" variant="secondary">
            News
          </Button>
          <Button
            href="https://github.com/VanillaSquared/"
            variant="secondary"
            external
          >
            GitHub
          </Button>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-background">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-heading">Features</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <Card key={f} preset="homepage">
                <p className="text-soft">{f}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enchanting Overhaul */}
      <section className="bg-background px-6 py-18">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-heading">
            Enchanting Overhaul
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-muted">
            Vanilla² replaces much of vanilla enchanting with a recipe-based
            enchantment table and an enchantment recipe book. Discover recipes
            through loot, fishing, piglin bartering, villager librarians, and
            structure chests.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enchantments.map((e) => (
              <Card key={e.name} preset="homepage" title={e.name}>
                <p className="mt-2 text-sm text-muted">{e.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Latest News */}
      {latestNews.length ? (
        <section className="mt-1 bg-background px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-center text-3xl font-bold text-heading">Latest News</h2>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {latestNews.map((article) => (
                <article key={article.path}>
                  <Card
                    as={Link}
                    href={article.path}
                    preset="news"
                    title={article.title}
                    media={article.image ? <img src={article.image} alt={article.imageAlt} /> : null}
                    className="h-full"
                  >
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((articleTag) => (
                        <Tag key={articleTag.name} variant="accent">{articleTag.label}</Tag>
                      ))}
                    </div>
                  </Card>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <Footer />
    </div>
  );
}
