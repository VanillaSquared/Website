import MarkdownContent from "@/markdown/MarkdownContent";
import { getLicence } from "@/licences/server";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export function generateMetadata() {
  const licence = getLicence("modlicence");

  return {
    title: `${licence.title} | Vanilla²`,
    description: licence.description,
  };
}

export default function ModLicencePage() {
  const licence = getLicence("modlicence");

  return (
    <DefaultTemplatePage>
      <article className="mx-auto w-full max-w-3xl flex-1 px-6 py-16 sm:py-20">
        <MarkdownContent source={licence.source} basePath="/modlicence" />
      </article>
    </DefaultTemplatePage>
  );
}
