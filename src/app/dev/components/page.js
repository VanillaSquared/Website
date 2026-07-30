import ComponentPreviewContent from "@/components/ComponentPreviewContent";
import DefaultTemplatePage from "@/template-pages/DefaultTemplatePage";

export const metadata = {
  title: "Component Preview - Vanilla²",
};

export default function ComponentPreviewPage() {
  return (
    <DefaultTemplatePage>
      <ComponentPreviewContent />
    </DefaultTemplatePage>
  );
}
