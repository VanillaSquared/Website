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

function resolveLocalLinks(basePath) {
  return () => (tree) => {
    function visit(node) {
      if (node.type === "link" && node.url?.startsWith("./")) {
        const resolved = new URL(node.url, `https://docs.local${basePath.replace(/\/$/, "")}/`);
        const pathname = resolved.pathname.length > 1 ? resolved.pathname.replace(/\/$/, "") : resolved.pathname;
        node.url = `${pathname}${resolved.search}${resolved.hash}`;
      }

      node.children?.forEach(visit);
    }

    visit(tree);
  };
}

function formatSubheaders() {
  return (tree) => {
    function visit(node) {
      if (
        node.type === "paragraph"
        && node.position?.start.line === node.position?.end.line
        && node.children?.[0]?.type === "text"
        && node.children[0].value.startsWith("-# ")
      ) {
        node.children[0].value = node.children[0].value.slice(3);
        node.data = {
          ...node.data,
          hProperties: {
            ...node.data?.hProperties,
            className: "docs-subheader",
          },
        };
      }

      node.children?.forEach(visit);
    }

    visit(tree);
  };
}

export default async function DocsMarkdown({ source, basePath = "/docs" }) {
  const { content } = await compileMDX({
    source,
    components: docsComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, rejectModuleSyntax, formatSubheaders, resolveLocalLinks(basePath)],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  return <div className="docs-content">{content}</div>;
}
