import Button from "@/components/Button";
import SearchBar from "@/components/SearchBar";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export const metadata = {
  title: "Template Preview - Vanilla²",
};

export default function TemplatePreviewPage() {
  return (
    <DefaultTemplatePage
      barItems={[
        "Raw text item",
        "Another text item",
        <Button key="primary" href="/" size="sm">
          Primary Button
        </Button>,
        <Button key="secondary" href="/" size="sm" variant="secondary">
          Secondary Button
        </Button>,
      ]}
      search={<SearchBar placeholder="Search the preview..." />}
    >
      <section className="bg-background px-6 py-20">
        <div className="mx-auto max-w-5xl">
          <h1 className="text-4xl font-bold text-heading">Template Preview</h1>
          <p className="mt-4 max-w-2xl text-muted">
            This page previews the default template page and its top header with
            raw text entries, Button components, and the reusable SearchBar
            component.
          </p>
        </div>
      </section>
    </DefaultTemplatePage>
  );
}
