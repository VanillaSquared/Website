import fs from "node:fs";
import path from "node:path";

import Image from "next/image";
import Link from "next/link";

import craftableGunpowderImage from "@cdn/frontpage/craftable-gunpowder-showcase.png";
import datapackImage from "@cdn/frontpage/datapack-showcase.png";
import enchantingSystemImage from "@cdn/frontpage/enchanting-system.png";
import rebalanceImage from "@cdn/frontpage/rebalance-showcase.png";
import redstoneSulfurCubeImage from "@cdn/frontpage/redstone-sulfur-cube.png";
import swirlingImage from "@cdn/frontpage/swirling-showcase.png";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Footer from "@/components/Footer";
import FrontPageSecret from "@/components/FrontPageSecret";
import ModrinthDownloadStats from "@/components/ModrinthDownloadStats";
import Tag from "@/components/Tag";
import { getVisibleNewsArticles } from "@/news/server";

const splashTexts = fs
  .readFileSync(path.resolve(process.cwd(), "cdn", "frontpage", "super-secret-splash-texts.txt"), "utf8")
  .split(/\r?\n/)
  .map((splashText) => splashText.trim())
  .filter(Boolean);

export default function Home() {
  const latestNews = getVisibleNewsArticles().slice(0, 6);
  const features = [
    {
      title: "Rebalanced armor, tools and weapons.",
      image: rebalanceImage,
      imageAlt: "Rebalanced Vanilla² equipment",
      loading: "eager",
      href: "/docs/items",
    },
    {
      title: "New Redstone Sulfur Cube.",
      image: redstoneSulfurCubeImage,
      imageAlt: "Redstone Sulfur Cube",
      loading: "eager",
      href: "/docs/items/sulfur_goo",
    },
    {
      title: "New Enchantments.",
      image: swirlingImage,
      imageAlt: "Swirling enchantment in action",
      loading: "eager",
      href: "/docs/enchanting",
    },
    {
      title: "Remade enchantment system.",
      image: enchantingSystemImage,
      imageAlt: "Vanilla² enchanting system",
      href: "/docs/enchanting",
    },
    {
      title: "Sulfur Goo & craftable gunpowder.",
      image: craftableGunpowderImage,
      imageAlt: "Craftable gunpowder recipe",
      href: "/docs/items/sulfur_goo",
    },
    {
      title: "Lots of new Datapack features.",
      image: datapackImage,
      imageAlt: "Vanilla² datapack features",
      href: "/docs/datapacks/enchanting/custom_enchantments",
    },
  ];

  const enchantments = [
    { name: "Dash", desc: "Burst forward and strike entities caught in the lunge.", href: "/docs/enchanting/dash" },
    { name: "Ruthless", desc: "Greatly increases attack damage at a self-damage cost.", href: "/docs/enchanting/ruthless" },
    { name: "Swirling", desc: "Spin with your weapon and repeatedly strike nearby enemies.", href: "/docs/enchanting/swirling" },
    { name: "Void Strike", desc: "Applies the Voided effect to targets.", href: "/docs/enchanting/void_strike" },
  ];

  return (
    <div className="flex flex-col flex-1 font-sans">
      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center bg-background">
        <FrontPageSecret
          splashTexts={splashTexts}
          statsContent={<ModrinthDownloadStats compact />}
        />
        <p className="mt-4 max-w-2xl text-lg text-muted">
            This Mod overhauls many of Minecrafts outdated system, like the combat system and enchanting system. 
            On top of that the mod also adds a few other features.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Tag>Minecraft 26.2</Tag>
          <Tag>Fabric Loader ≥0.19.3</Tag>
          <Tag>Java ≥25</Tag>
        </div>
        <ModrinthDownloadStats showFollowers={false} />
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
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-background">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-heading">Features</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <Card
                key={feature.title}
                href={feature.href}
                preset="imgCard"
                title={feature.title}
                media={(
                  <Image
                    src={feature.image}
                    alt={feature.imageAlt}
                    loading={feature.loading}
                    sizes="(min-width: 1024px) 320px, (min-width: 640px) 50vw, 100vw"
                  />
                )}
              />
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
              <Card key={e.name} href={e.href} preset="homepage" title={e.name}>
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
                    preset="imgCard"
                    title={article.title}
                    media={article.image ? <img src={article.image} alt={article.imageAlt} /> : null}
                    className="h-full"
                  >
                    <div className="flex flex-wrap gap-2">
                      {article.tags.map((articleTag) => (
                        <Tag key={articleTag.name} variant={articleTag.name}>{articleTag.label}</Tag>
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
