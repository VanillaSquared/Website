import Button from "@/components/Button";
import Card from "@/components/Card";
import CategoryNavigation from "@/components/CategoryNavigation";
import Checkmark from "@/components/Checkmark";
import CodeBlock from "@/components/CodeBlock";
import CollapsibleCategory from "@/components/CollapsibleCategory";
import ColorPicker from "@/components/ColorPicker";
import FileTree from "@/components/FileTree";
import FileUpload from "@/components/FileUpload";
import JsonTree, { JsonTreeItem } from "@/components/JsonTree";
import JsonTypeIcon from "@/components/JsonTypeIcon";
import Markdown from "@/components/Markdown";
import MultiSelect from "@/components/MultiSelect";
import ProfilePicture from "@/components/ProfilePicture";
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

/**
 * Existing application components approved for use in documentation Markdown.
 * Add reviewed components here rather than importing modules in .md files.
 */
export const docsComponents = {
  Button,
  Card,
  CategoryNavigation,
  Checkmark,
  CodeBlock,
  CollapsibleCategory,
  ColorPicker,
  FileTree,
  FileUpload,
  JsonTree,
  JsonTreeItem,
  JsonTypeIcon,
  Markdown,
  MultiSelect,
  ProfilePicture,
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
