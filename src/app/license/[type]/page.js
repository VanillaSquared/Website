import { notFound } from "next/navigation";

import MarkdownContent from "@/markdown/MarkdownContent";
import { getLicence } from "@/licences/server";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

const licenceSlugs = {
  mod: "modlicence",
  website: "licence",
};

function getRouteLicence(type) {
  const slug = licenceSlugs[type];
  return slug ? getLicence(slug) : null;
}

export function generateStaticParams() {
  return Object.keys(licenceSlugs).map((type) => ({ type }));
}

export async function generateMetadata({ params }) {
  const { type } = await params;
  const licence = getRouteLicence(type);
  if (!licence) return { title: "License not found | Vanilla²" };

  return {
    title: `${licence.title} | Vanilla²`,
    description: licence.description,
  };
}

export default async function LicencePage({ params }) {
  const { type } = await params;
  const licence = getRouteLicence(type);
  if (!licence) notFound();

  return (
    <DefaultTemplatePage>
      <article className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:py-20">
        <MarkdownContent source={licence.source} basePath={`/license/${type}`} />
      </article>
    </DefaultTemplatePage>
  );
}
