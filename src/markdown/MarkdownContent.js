import "server-only";

import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { markdownComponents } from "@/markdown/components";
import { remarkEmDashes } from "@/markdown/emDash";
import {
  formatBlockSpacing,
  formatSubheaders,
  prepareSubheaders,
  rejectModuleSyntax,
  resolveAssetImages,
  resolveLocalLinks,
} from "@/markdown/plugins";

export default async function MarkdownContent({ source, basePath, className = "docs-content" }) {
  const preparedSource = prepareSubheaders(source);
  const { content } = await compileMDX({
    source: preparedSource,
    components: markdownComponents,
    options: {
      mdxOptions: {
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
      },
    },
  });

  return <div className={className}>{content}</div>;
}
