import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export const metadata = {
  title: "Template Preview - Vanilla²",
};

export default function TemplatePreviewPage() {
  return (
    <DefaultTemplatePage search={{ placeholder: "Search the preview..." }}>
      <section className="bg-background px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold text-heading">Template Preview</h1>
          <p className="mt-4 max-w-2xl text-muted">
            This page previews the default template page and its top header with
            the reusable SearchBar component.
          </p>
        </div>
      </section>
    </DefaultTemplatePage>
  );
}
