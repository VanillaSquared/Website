import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { docsComponents } from "@/docs/components";

function rejectModuleSyntax() {
  return (tree) => {
    const moduleNode = tree.children?.find((node) => node.type === "mdxjsEsm");
    if (moduleNode) {
      throw new Error("Documentation Markdown cannot import or export modules. Use the component registry instead.");
    }
  };
}

export default async function DocsMarkdown({ source }) {
  const { content } = await compileMDX({
    source,
    components: docsComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, rejectModuleSyntax],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  return <div className="docs-content">{content}</div>;
}
