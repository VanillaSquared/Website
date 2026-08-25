import { compile, run } from "@mdx-js/mdx";
import { MDXProvider, useMDXComponents } from "@mdx-js/react";
import { renderToStaticMarkup } from "react-dom/server";
import * as runtime from "react/jsx-runtime";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { markdownComponents } from "@/markdown/components";
import { remarkEmDashes } from "@/markdown/emDash";
// Render repository MDX into static HTML for Astro pages.
import {
  formatBlockSpacing,
  formatSubheaders,
  prepareSubheaders,
  rejectModuleSyntax,
  resolveAssetImages,
  resolveLocalLinks,
} from "@/markdown/plugins";

export async function renderMarkdownToHtml(source, basePath = "", components = markdownComponents) {
  const preparedSource = prepareSubheaders(source);
  const compiled = await compile(preparedSource, {
    outputFormat: "function-body",
    providerImportSource: "@mdx-js/react",
    remarkPlugins: [
      remarkGfm,
      remarkEmDashes,
      rejectModuleSyntax,
      formatSubheaders,
      formatBlockSpacing(preparedSource),
      resolveLocalLinks(basePath),
      resolveAssetImages(),
    ],
    rehypePlugins: [rehypeSlug],
  });
  const { default: Content } = await run(compiled, {
    ...runtime,
    useMDXComponents,
  });

  return renderToStaticMarkup(
    <MDXProvider components={components}>
      <Content />
    </MDXProvider>,
  );
}
