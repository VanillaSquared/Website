import Button from "@/components/Button";
import ComponentPreviewContent from "@/components/ComponentPreviewContent";

export default function DesignTestSettings() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-3">
        <Button href="/components" size="sm">Open full preview</Button>
        <Button size="sm" chatbox={{ title: "Design test", description: "Button chatbox preview" }}>Chatbox test</Button>
      </div>
      <ComponentPreviewContent embedded />
    </div>
  );
}
