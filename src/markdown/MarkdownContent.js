import { renderMarkdownToHtml } from "@/markdown/render.jsx";

export default async function MarkdownContent({ source, basePath, className = "docs-content" }) {
  const html = await renderMarkdownToHtml(source, basePath);
  return <div className={className} dangerouslySetInnerHTML={{ __html: html }} />;
}
