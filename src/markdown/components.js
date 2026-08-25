import Button from "@/components/Button";
import Card from "@/components/Card";
import CategoryNavigation from "@/components/CategoryNavigation";
import Checkmark from "@/components/Checkmark";
import CodeBlock from "@/components/CodeBlock";
import CollapsibleCategory from "@/components/CollapsibleCategory";
import ColorPicker from "@/components/ColorPicker";
import File from "@/components/File";
import FileTree from "@/components/FileTree";
import JsonTree, { JsonTreeItem } from "@/components/JsonTree";
import JsonTypeIcon from "@/components/JsonTypeIcon";
import Markdown from "@/components/Markdown";
import MultiSelect from "@/components/MultiSelect";
import SearchBar from "@/components/SearchBar";
import Separator from "@/components/Separator";
import Table from "@/components/Table";
import Tag from "@/components/Tag";
import Tabs from "@/components/Tabs";
import TextInput from "@/components/TextInput";
import Toggle from "@/components/Toggle";

function FencedCodeBlock({ children }) {
  const codeElement = children;
  const language = codeElement?.props?.className?.replace(/^language-/, "") || undefined;
  const code = String(codeElement?.props?.children ?? "").replace(/\n$/, "");
  return <CodeBlock code={code} language={language} />;
}

function MarkdownLink({ className = "", ...props }) {
  return (
    <a
      {...props}
      className={`${className} text-accent underline-offset-2 hover:underline`}
    />
  );
}

function isGithubAttachmentUrl(value) {
  if (typeof value !== "string") return false;

  try {
    const url = new URL(value);
    return url.protocol === "https:"
      && url.hostname === "github.com"
      && url.pathname.startsWith("/user-attachments/");
  } catch {
    return false;
  }
}

function textFromChildren(children) {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textFromChildren).join("");
  return "";
}

function BugMarkdownLink({ href, children, ...props }) {
  if (isGithubAttachmentUrl(href)) {
    const name = textFromChildren(children).trim();
    return <File href={href} name={name || undefined} />;
  }

  return <MarkdownLink href={href} {...props}>{children}</MarkdownLink>;
}

function BugMarkdownImage({ src, alt, ...props }) {
  if (isGithubAttachmentUrl(src)) return <File href={src} name={alt || undefined} />;
  return <img src={src} alt={alt ?? ""} {...props} />;
}

/** Components approved for use in repository Markdown content. */
export const markdownComponents = {
  a: MarkdownLink,
  Button,
  Card,
  CategoryNavigation,
  Checkmark,
  CodeBlock,
  CollapsibleCategory,
  ColorPicker,
  File,
  FileTree,
  JsonTree,
  JsonTreeItem,
  JsonTypeIcon,
  Markdown,
  MultiSelect,
  SearchBar,
  Separator,
  Table,
  Tag,
  Tabs,
  table: Table,
  TextInput,
  Toggle,
  hr: Separator,
  pre: FencedCodeBlock,
};

export const bugMarkdownComponents = {
  ...markdownComponents,
  a: BugMarkdownLink,
  img: BugMarkdownImage,
};
