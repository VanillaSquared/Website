import MarkdownContent from "@/markdown/MarkdownContent";

export default function DocsMarkdown({ source, basePath = "/docs" }) {
  return <MarkdownContent source={source} basePath={basePath} />;
}
