export function replaceDoubleHyphens(value) {
  return value.replace(/--/g, "—");
}

export function remarkEmDashes() {
  return (tree) => {
    function visit(node) {
      const isTable = node.type === "table"
        || ((node.type === "mdxJsxFlowElement" || node.type === "mdxJsxTextElement") && (node.name === "Table" || node.name === "table"));

      if (isTable) return;

      if (node.type === "text") {
        node.value = replaceDoubleHyphens(node.value);
      }

      node.children?.forEach(visit);
    }

    visit(tree);
  };
}
