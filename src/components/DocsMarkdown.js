import fs from "node:fs";
import path from "node:path";

import { compileMDX } from "next-mdx-remote/rsc";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";

import { docsComponents } from "@/docs/components";
import { remarkEmDashes } from "@/markdown/emDash";

const SUBHEADER_MARKER = "VSQ_SUBHEADER:";

function prepareSubheaders(source) {
  let fenceCharacter = null;
  const lines = String(source).split("\n");
  const prepared = [];

  lines.forEach((line, index) => {
    const fence = /^\s*(`{3,}|~{3,})/.exec(line);
    if (fence) {
      const character = fence[1][0];
      if (!fenceCharacter) fenceCharacter = character;
      else if (fenceCharacter === character) fenceCharacter = null;
      prepared.push(line);
      return;
    }

    const subheader = !fenceCharacter ? /^\s*-#[ \t]+(.+)$/.exec(line) : null;
    if (!subheader) {
      prepared.push(line);
      return;
    }

    const compactBefore = index > 0 && lines[index - 1].trim() !== "";
    const compactAfter = index < lines.length - 1 && lines[index + 1].trim() !== "";
    if (prepared.at(-1) !== "") prepared.push("");
    prepared.push(`${SUBHEADER_MARKER}${compactBefore ? "1" : "0"}${compactAfter ? "1" : "0"}: ${subheader[1]}`, "");
  });

  return prepared.join("\n");
}

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

function resolveAssetImages() {
  const assetsDirectory = path.resolve(process.cwd(), "src/assets");
  const mimeTypes = {
    ".gif": "image/gif",
    ".jpeg": "image/jpeg",
    ".jpg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".webp": "image/webp",
  };

  return () => (tree) => {
    function visit(node) {
      if (node.type === "image" && node.url?.startsWith("@/assets/")) {
        const assetPath = path.resolve(process.cwd(), "src", node.url.slice(2));
        const mimeType = mimeTypes[path.extname(assetPath).toLowerCase()];

        if (assetPath.startsWith(`${assetsDirectory}${path.sep}`) && mimeType && fs.existsSync(assetPath)) {
          node.url = `data:${mimeType};base64,${fs.readFileSync(assetPath).toString("base64")}`;
        }
      }

      node.children?.forEach(visit);
    }

    visit(tree);
  };
}

function formatBlockSpacing(source) {
  return () => (tree) => {
    const lines = source.split("\n");

    function visit(node) {
      if ((node.type === "heading" || node.type === "thematicBreak") && node.position) {
        const previousLine = lines[node.position.start.line - 2];
        const nextLine = lines[node.position.end.line];
        const compactBefore = previousLine !== undefined && previousLine.trim() !== "";
        const compactAfter = nextLine !== undefined && nextLine.trim() !== "";
        const classPrefix = node.type === "heading" ? "docs-heading" : "docs-separator";
        node.data = {
          ...node.data,
          hProperties: {
            ...node.data?.hProperties,
            className: [
              classPrefix,
              compactBefore ? `${classPrefix}-compact-before` : null,
              compactAfter ? `${classPrefix}-compact-after` : null,
            ].filter(Boolean),
          },
        };
      }

      node.children?.forEach(visit);
    }

    visit(tree);
  };
}

function formatSubheaders() {
  return (tree) => {
    function visit(node) {
      if (node.type === "paragraph" && node.children?.[0]?.type === "text") {
        const marker = /^VSQ_SUBHEADER:([01])([01]): /.exec(node.children[0].value);
        if (marker) {
          node.children[0].value = node.children[0].value.slice(marker[0].length);
          node.data = {
            ...node.data,
            hProperties: {
              ...node.data?.hProperties,
              className: [
                "docs-subheader",
                marker[1] === "1" ? "docs-subheader-compact-before" : null,
                marker[2] === "1" ? "docs-subheader-compact-after" : null,
              ].filter(Boolean),
            },
          };
        }
      }

      node.children?.forEach(visit);
    }

    visit(tree);
  };
}

export default async function DocsMarkdown({ source, basePath = "/docs" }) {
  const preparedSource = prepareSubheaders(source);
  const { content } = await compileMDX({
    source: preparedSource,
    components: docsComponents,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm, remarkEmDashes, rejectModuleSyntax, formatSubheaders, formatBlockSpacing(preparedSource), resolveLocalLinks(basePath), resolveAssetImages()],
        rehypePlugins: [rehypeSlug],
      },
    },
  });

  return <div className="docs-content">{content}</div>;
}
