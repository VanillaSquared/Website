import MarkdownContent from "@/markdown/MarkdownContent";
import { getLicence } from "@/licences/server";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export function generateMetadata() {
  const licence = getLicence("licence");

  return {
    title: `${licence.title} | Vanilla²`,
    description: licence.description,
  };
}

export default function LicencePage() {
  const licence = getLicence("licence");

  return (
    <DefaultTemplatePage>
      <article className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:py-20">
        <MarkdownContent source={licence.source} basePath="/licence" />
      </article>
    </DefaultTemplatePage>
  );
}
