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

/** Components approved for use in repository Markdown content. */
export const markdownComponents = {
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
