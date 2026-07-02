"use client";

import Link from "next/link";

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
      <section className="flex flex-col items-center justify-center px-6 py-24 text-center bg-[#171717]">
        <h1 className="text-5xl font-bold tracking-tight text-white sm:text-6xl">
          Vanilla²
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-gray-400">
          A Fabric combat and progression overhaul that keeps Minecraft close to
          vanilla while expanding weapons, armor, enchantments, and combat utility.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <span className="rounded-md bg-[#2d2d2d] px-3 py-1 text-sm font-medium text-gray-300">
            Minecraft 1.21.4
          </span>
          <span className="rounded-md bg-[#2d2d2d] px-3 py-1 text-sm font-medium text-gray-300">
            Fabric Loader ≥0.19.3
          </span>
          <span className="rounded-md bg-[#2d2d2d] px-3 py-1 text-sm font-medium text-gray-300">
            Java ≥25
          </span>
        </div>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <a
            href="https://modrinth.com/mod/vsq"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#B36BB3] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#9E5F9E]"
          >
            Download
          </a>
          <a
            href="https://github.com/mizius-studios/VanillaSquared"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-lg bg-[#3b4658] px-6 py-3 text-base font-semibold text-white transition-colors hover:bg-[#4a5870]"
          >
            GitHub
          </a>
        </div>
      </section>

      {/* Features */}
      <section className="px-6 py-20 bg-[#171717]">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-white">Features</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f}
                className="rounded-xl border border-transparent bg-[#1e1e1e] p-6 transition-colors hover:border-[#C269C2]"
              >
                <p className="text-gray-300">{f}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enchanting Overhaul */}
      <section className="px-6 py-20 bg-[#171717]">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-3xl font-bold text-white">
            Enchanting Overhaul
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-gray-400">
            Vanilla² replaces much of vanilla enchanting with a recipe-based
            enchantment table and an enchantment recipe book. Discover recipes
            through loot, fishing, piglin bartering, villager librarians, and
            structure chests.
          </p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {enchantments.map((e) => (
              <div
                key={e.name}
                className="rounded-xl border border-transparent bg-[#1e1e1e] p-6 transition-colors hover:border-[#C269C2]"
              >
                <h3 className="text-lg font-semibold text-[#C269C2]">
                  {e.name}
                </h3>
                <p className="mt-2 text-sm text-gray-400">{e.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#171717] px-6 py-10">
        <div className="mx-auto flex max-w-5xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-500">© Vanilla² (VSQ)</p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link
              href="https://github.com/mizius-studios/VanillaSquared"
              className="hover:text-gray-300 transition-colors"
            >
              GitHub
            </Link>
            <Link
              href="https://modrinth.com/mod/vsq"
              className="hover:text-gray-300 transition-colors"
            >
              Modrinth
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
