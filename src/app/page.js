"use client";

import Button from "@/components/Button";
import Card from "@/components/Card";
import Footer from "@/components/Footer";
import Tag from "@/components/Tag";

export default function Home() {
  const features = [
    "Rebalanced combat for swords, axes, spears, maces, shields, and fishing rods",
    "Expanded armor & protection scaling beyond vanilla limits",
    "New attributes and damage types for deeper combat interactions",
    "Fishing rods as combat tools with hook damage & enchantments",
    "Extended armor HUD for values above 20",
    "Custom Sulfur Cube entity with new loot & food items",
  ];

  const enchantments = [
    { name: "Dash", desc: "Burst forward and strike entities caught in the lunge." },
    { name: "Fractured", desc: "Mine multiple blocks asynchronously through manual clicks." },
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
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
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
          <Button
            href="https://github.com/VanillaSquared/Website/wiki"
            variant="blue"
            external
          >
            Docs
          </Button>
          <Button
            href="https://github.com/VanillaSquared/Website/issues/new"
            variant="purple"
            external
          >
            Bug Reporter
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
              <Card key={f}>
                <p className="text-soft">{f}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enchanting Overhaul */}
      <section className="px-6 py-20 bg-background">
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
              <Card key={e.name} title={e.name}>
                <p className="mt-2 text-sm text-muted">{e.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
