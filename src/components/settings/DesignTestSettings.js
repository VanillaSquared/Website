import Button from "@/components/Button";
import ComponentPreviewContent from "@/components/ComponentPreviewContent";

export default function DesignTestSettings() {
  return (
    <div className="space-y-6">
      <Button href="/components" size="sm">Open full preview</Button>
      <ComponentPreviewContent embedded />
    </div>
  );
}
