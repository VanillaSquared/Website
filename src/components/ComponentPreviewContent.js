"use client";

import Image from "next/image";
import { useState } from "react";

import enchantingTableImage from "@/assets/docs/enchantment_table.png";
import settingsIcon from "@/assets/icons/settings.svg";
import HeaderAuthButton from "@/components/AuthButton";
import Button from "@/components/Button";
import Card from "@/components/Card";
import CategoryNavigation from "@/components/CategoryNavigation";
import Checkmark from "@/components/Checkmark";
import CodeBlock from "@/components/CodeBlock";
import CollapsibleCategory from "@/components/CollapsibleCategory";
import ColorPicker from "@/components/ColorPicker";
import EmojiPicker from "@/components/EmojiPicker";
import FileTree from "@/components/FileTree";
import FileUpload from "@/components/FileUpload";
import Markdown from "@/components/Markdown";
import MessageComposer from "@/components/MessageComposer";
import ModalShowcase from "@/components/ModalShowcase";
import MultiSelect from "@/components/MultiSelect";
import ProfilePicture from "@/components/ProfilePicture";
import SaveConfirmation from "@/components/SaveConfirmation";
import SearchBar from "@/components/SearchBar";
import Tag from "@/components/Tag";
import Tabs from "@/components/Tabs";
import TextInput from "@/components/TextInput";
import ThreadRow from "@/components/ThreadRow";
import Toggle from "@/components/Toggle";
import UserMultiSelect from "@/components/UserMultiSelect";

const previewCommentCreatedAt = "2026-07-14T14:23:20.000Z";

const buttonVariants = ["primary", "secondary", "tertiary", "iconButton", "blue", "purple", "blurple", "green", "red"];
const buttonSizes = ["sm", "md", "icon", "iconButton"];
const cardSizes = ["sm", "md", "lg", "popup"];
const checkmarkCycleStates = [
  { checked: true, variant: "green", icon: "check" },
  { checked: false, variant: "red", icon: "x" },
  { checked: false, variant: "unconfirmed", icon: "dash" },
];

const customCheckmarkCycleStates = [
  { checked: false, variant: "unconfirmed", icon: "dash" },
  { checked: true, variant: "green", icon: "check" },
  { checked: false, variant: "red", icon: "x" },
  { checked: true, variant: "default", icon: "check" },
];

const previewUsers = [
  { id: "00000000-0000-4000-8000-000000000001", username: "Alex", email: "alex@example.com" },
  { id: "00000000-0000-4000-8000-000000000002", username: "VanillaUser", email: "vanilla@example.com" },
  { id: "00000000-0000-4000-8000-000000000003", username: "SupportFox", email: "support@example.com" },
  { id: "00000000-0000-4000-8000-000000000004", username: "BugHunter", email: "bugs@example.com" },
];

const selectOptions = [
  { label: "Vanilla", value: "vanilla" },
  { label: "Fabric", value: "fabric" },
  { label: "Quilt", value: "quilt" },
  { label: "NeoForge", value: "neoforge" },
  { label: "Forge", value: "forge" },
  { label: "Paper", value: "paper" },
  { label: "Spigot", value: "spigot" },
  { label: "Bukkit", value: "bukkit" },
  { label: "Sponge", value: "sponge" },
  { label: "Purpur", value: "purpur" },
  { label: "Velocity", value: "velocity" },
  { label: "BungeeCord", value: "bungeecord" },
  { label: "LiteLoader", value: "liteloader" },
  { label: "Rift", value: "rift" },
];

const categoryItems = [
  { id: "welcome", label: "Welcome", icon: "👋" },
  { id: "quick-start", label: "Quick start", icon: "⚡" },
  {
    id: "workspace",
    label: "Workspace",
    icon: "🧰",
    children: [
      {
        id: "projects",
        label: "Projects",
        icon: "📁",
        children: [
          {
            id: "metadata",
            label: "Metadata",
            icon: "🏷️",
            children: [
              { id: "overview", label: "Overview", icon: "📋" },
              { id: "validation", label: "Validation", icon: "✅" },
            ],
          },
          { id: "publishing", label: "Publishing", icon: "🚀" },
          { id: "permissions", label: "Permissions", icon: "🔐" },
          { id: "history", label: "History", icon: "🕘" },
        ],
      },
      { id: "automation", label: "Automation", icon: "⚙️" },
      { id: "notifications", label: "Notifications", icon: "🔔" },
    ],
  },
  { id: "team", label: "Team", icon: "👥", children: [{ id: "members", label: "Members", icon: "🪪" }] },
  { id: "integrations", label: "Integrations", icon: "🔌", children: [{ id: "webhooks", label: "Webhooks", icon: "🪝" }] },
  { id: "reference", label: "Reference", icon: "📚", children: [{ id: "schema", label: "Schema", icon: "🧱" }] },
];

const fileTreeNodes = [
  {
    id: "workspace-folder",
    label: "workspace",
    children: [
      {
        id: "settings-folder",
        label: "settings",
        children: [
          {
            id: "profiles-folder",
            label: "profiles",
            children: [
              { id: "desktop-file", label: "desktop.json", type: "file" },
              { id: "server-file", label: "server.json", type: "file" },
            ],
          },
          { id: "defaults-file", label: "defaults.json", type: "file" },
        ],
      },
    ],
  },
];

const initialMarkdown = [
  "# Release notes",
  "## Highlights",
  "The dashboard is now *faster*, **more reliable**, ~~limited~~, and __fully configurable__.",
  "Deploy with the `production/eu-west` target when the release is ready.",
  "",
  "**This important note continues",
  "on the next real line.**",
  "",
  "### Configuration sample",
  "```**Formatting remains plain inside this block.**",
  "refresh_interval: 30```",
  "",
  "A wrapped sentence never becomes a heading without a newline character.",
  "## # Stacked header markers remain regular text",
].join("\n");

const groupedSelectOptions = [
  {
    label: "Permissions",
    options: [
      { label: "manage_roles", value: "manage_roles" },
      { label: "user_management", value: "user_management" },
      { label: "audit_log", value: "audit_log" },
    ],
  },
  {
    label: "Roles",
    options: [
      { label: "support", value: "role:support" },
      { label: "moderator", value: "role:moderator" },
    ],
  },
];

export default function ComponentPreviewContent({ embedded = false } = {}) {
  const [designTab, setDesignTab] = useState("buttons");
  const [markdownTab, setMarkdownTab] = useState("editor");
  const [markdownValue, setMarkdownValue] = useState(initialMarkdown);
  const [previewColor, setPreviewColor] = useState("#c269c2");
  const [selectedCategory, setSelectedCategory] = useState("publishing");

  return (
    <>
      <section className={embedded ? "bg-transparent p-0" : "bg-background px-6 py-16"}>
        <div className={`${embedded ? "" : "mx-auto"} flex max-w-5xl flex-col gap-12`}>
          {!embedded ? (
            <div>
              <Tag>Dev</Tag>
              <h1 className="mt-4 text-4xl font-bold text-heading">Component Preview</h1>
              <p className="mt-3 max-w-2xl text-muted">
                A DefaultTemplate-derived page showcasing reusable components and their variants.
              </p>
            </div>
          ) : null}

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Tabbed design samples</h2>
            <Tabs
              tabs={[
                { label: "Buttons", value: "buttons" },
                { label: "Inputs", value: "inputs" },
                { label: "Controls", value: "controls" },
              ]}
              value={designTab}
              onChange={setDesignTab}
              line="full"
            />
            <Card title={designTab === "buttons" ? "Button palette" : designTab === "inputs" ? "Input states" : "Control states"} size="md" className="overflow-visible">
              {designTab === "buttons" ? (
                <div className="flex flex-wrap gap-3"><Button>Primary</Button><Button variant="green">Save</Button><Button variant="red">Delete</Button><Button variant="locked">Locked</Button></div>
              ) : null}
              {designTab === "inputs" ? (
                <div className="grid gap-3 md:grid-cols-2"><TextInput label="Editable" sampleText="Type here" /><TextInput locked label="Locked" defaultValue="Unavailable" /><ColorPicker label="Color" value={previewColor} onChange={setPreviewColor} /><ColorPicker locked label="Locked color" value="#6b7280" /></div>
              ) : null}
              {designTab === "controls" ? (
                <div className="grid gap-3 md:grid-cols-2"><Toggle label="Enabled" defaultChecked /><MultiSelect label="Multi select" options={selectOptions} defaultValue={["vanilla"]} /></div>
              ) : null}
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Documentation navigation</h2>
            <p className="text-sm text-muted">Build navigation of any depth and expand each branch independently.</p>
            <CategoryNavigation items={categoryItems} selectedId={selectedCategory} onSelect={(item) => setSelectedCategory(item.id)} />
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">File tree</h2>
            <FileTree nodes={fileTreeNodes} />
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Code block</h2>
            <p className="text-sm text-muted">Hover or keyboard-focus the block to reveal its copy button.</p>
            <CodeBlock language="yaml">{"release:\n  channel: stable\n  automatic_updates: true"}</CodeBlock>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Rich markdown</h2>
            <Tabs
              tabs={[{ label: "Write", value: "editor" }, { label: "Preview", value: "preview" }]}
              value={markdownTab}
              onChange={setMarkdownTab}
              line="full"
            />
            <Card title={markdownTab === "editor" ? "Markdown text" : "Rendered markdown"} size="md" hoverAccent={false}>
              {markdownTab === "editor" ? (
                <TextInput
                  aria-label="Markdown text"
                  lines={12}
                  maxLines={18}
                  value={markdownValue}
                  onChange={(event) => setMarkdownValue(event.target.value)}
                  inputClassName="font-mono"
                />
              ) : <Markdown value={markdownValue} />}
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Collapsible categories</h2>
            <div className="space-y-4">
              <CollapsibleCategory id="cache-policy" title="cache_policy" icon="🗄️">
                <p className="pt-3 text-soft">Controls how long generated responses remain available locally.</p>
              </CollapsibleCategory>
              <CollapsibleCategory id="deployment-target" title="deployment_target" icon="🌐" defaultOpen>
                <p className="py-3 text-soft">Choose the environment and region used for the next deployment, such as <code className="rounded bg-category-label px-1.5 py-0.5 font-mono">production/eu-west</code>.</p>
                <CodeBlock language="yaml">{"deployment:\n  target: production\n  region: eu-west"}</CodeBlock>
              </CollapsibleCategory>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Buttons</h2>
            <div className="flex flex-wrap items-center gap-3">
              {buttonVariants.map((variant) => (
                <Button
                  key={variant}
                  href="#"
                  variant={variant}
                  icon={variant === "iconButton" ? settingsIcon : null}
                  aria-label={variant === "iconButton" ? "iconButton" : undefined}
                >
                  {variant === "iconButton" ? null : variant}
                </Button>
              ))}
              <Button variant="locked">locked</Button>
              <Button locked>locked prop</Button>
              <Button chatbox={{ title: "hehe", description: "Click to learn more" }}>Chatbox above</Button>
              <Button chatbox={{ title: "hehe", description: "Displayed below", placement: "below" }}>Chatbox below</Button>
              <Button locked chatbox={{ title: "Locked", description: "Try again in 5m" }}>Locked chatbox</Button>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {buttonSizes.map((size) => (
                <Button key={size} href="#" size={size} icon={size === "icon" || size === "iconButton" ? settingsIcon : null} aria-label={`Button ${size}`}>
                  {size === "icon" || size === "iconButton" ? null : size}
                </Button>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Save confirmation</h2>
            <SaveConfirmation onReset={() => {}} onSave={() => {}} />
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Auth button</h2>
            <div className="flex flex-wrap items-center gap-3">
              <HeaderAuthButton />
              <HeaderAuthButton initialLoggedIn />
            </div>
            <p className="text-sm text-muted">
              Shows the login state and the settings state used in the header.
            </p>
          </section>

          <ModalShowcase />

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Comments</h2>
            <Card title="Comment message" size="md">
              <ThreadRow
                message={{ creatorUsername: "BugHunter", content: "Hover this message to reveal its reaction, edit, and delete actions.", createdAt: previewCommentCreatedAt, reactions: [{ emoji: "🐛", count: 12, reacted: true }, { emoji: "👍", count: 4, reacted: false }] }}
                canChange
                canReact
                onReact={() => {}}
                onEdit={() => {}}
                onDelete={() => {}}
              />
            </Card>
            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Comment input" size="md">
                <MessageComposer onSubmit={async () => {}} />
              </Card>
              <Card title="Locked comment inputs" size="md" className="space-y-3">
                <MessageComposer disabled disabledMessage="Comments are disabled for this bug report." />
                <MessageComposer disabled disabledMessage="Log in to comment." disabledHref="/login?returnTo=/components" />
              </Card>
            </div>
            <Card title="Emoji picker" size="md" className="flex justify-end">
              <EmojiPicker onSelect={() => {}} />
            </Card>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Profile pictures</h2>
            <div className="flex flex-wrap items-center gap-4">
              <ProfilePicture username="Alex" email="alex@example.com" />
              <ProfilePicture size="sm" username="Vanilla User" email="user@example.com" />
              <ProfilePicture
                username="Image User"
                src="https://github.com/vercel.png"
                alt="Example profile picture"
              />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Cards</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Homepage preset" preset="homepage">
                <p className="text-sm text-muted">Default homepage card with hover accent.</p>
              </Card>
              <Card
                title="Auth preset"
                preset="auth"
                description="Popup-sized card with auth styling."
                footer="Footer content"
              >
                <TextInput label="Username" name="preview-username" sampleText="Steve" />
              </Card>
              <Card
                title="Enchanting Table"
                preset="info"
                media={<Image src={enchantingTableImage} alt="Vanilla Squared enchanting table" className="h-auto w-full object-contain" />}
                description="A recipe-driven replacement for random enchanting."
                details={[
                  { label: "System", value: "Recipe based" },
                  { label: "Materials", value: "Lapis and four ingredients" },
                  { label: "Result", value: "One selected enchantment" },
                ]}
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {cardSizes.map((size) => (
                <Card key={size} title={`${size} size`} size={size}>
                  <p className="text-sm text-muted">Card size variant.</p>
                </Card>
              ))}
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Search bars</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <SearchBar placeholder="Default search..." />
              <SearchBar defaultValue="Vanilla²" placeholder="Filled search..." />
              <SearchBar locked defaultValue="Locked search" placeholder="Locked search..." />
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Inputs and tags</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <TextInput label="Text input" name="preview-text" sampleText="Sample text" />
              <TextInput label="Password input" name="preview-password" type="password" sampleText="Secret" />
              <TextInput locked label="Locked text input" name="preview-locked-text" defaultValue="Cannot edit this" />
              <TextInput
                label="Three-line input"
                name="preview-three-line"
                sampleText="Write a short message..."
                lines={3}
              />
              <TextInput
                label="Scrolling input"
                name="preview-scrolling"
                sampleText="This grows up to five lines, then scrolls."
                lines={3}
                maxLines={5}
                maxCharacters={240}
              />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ColorPicker label="Role color" value={previewColor} onChange={setPreviewColor} />
              <div className="flex items-end gap-2 pb-2">
                <Tag color={previewColor}>Custom role</Tag>
                <Tag>Minecraft 26.2</Tag>
                <Tag>Fabric</Tag>
                <Tag>Java 25</Tag>
              </div>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">Controls</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <Card title="Toggle" size="md">
                <Toggle label="Automatic updates" description="Apple-like switch styling." defaultChecked />
              </Card>
              <Card title="Locked toggle" size="md">
                <Toggle locked label="Locked updates" description="This control cannot be changed." defaultChecked />
              </Card>
              <Card title="Checkmark" size="md">
                <div className="space-y-4 text-sm text-soft">
                  <div className="flex flex-wrap items-center gap-3">
                    <Checkmark defaultChecked interactive />
                    <Checkmark defaultChecked={false} interactive />
                    <span>Default true/false toggle.</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Checkmark checked variant="green" />
                    <Checkmark checked={false} variant="red" icon="x" />
                    <Checkmark checked={false} variant="unconfirmed" icon="dash" />
                    <Checkmark checked variant="red" icon="check" />
                    <Checkmark checked={false} variant="green" icon="x" />
                    <span>Variants and icons can be mixed independently.</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Checkmark defaultChecked={false} cycle cycleStates={checkmarkCycleStates} />
                    <Checkmark defaultChecked={false} cycle={customCheckmarkCycleStates} />
                    <span>Click to cycle through status states or a custom sequence.</span>
                  </div>
                </div>
              </Card>
              <Card title="Multi select" size="md" className="overflow-visible">
                <MultiSelect label="Targets" options={selectOptions} defaultValue={["vanilla", "fabric"]} min={1} max={4} />
              </Card>
              <Card title="Grouped multi select" size="md" className="overflow-visible">
                <MultiSelect label="Permissions" options={groupedSelectOptions} defaultValue={["manage_roles", "role:support"]} />
              </Card>
              <Card title="Limited multi select" size="md" className="overflow-visible">
                <MultiSelect label="Server software" options={selectOptions} defaultValue={["paper"]} max={2} />
              </Card>
              <Card title="User multi select" size="md" className="overflow-visible">
                <UserMultiSelect users={previewUsers} defaultValue={[previewUsers[0].id, previewUsers[2].id]} max={3} placeholder="Select users" />
              </Card>
              <Card title="Locked multi select" size="md" className="overflow-visible">
                <MultiSelect locked label="Locked targets" options={selectOptions} defaultValue={["vanilla", "fabric"]} />
              </Card>
            </div>
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-semibold text-heading">File upload</h2>
            <FileUpload
              label="Mod pack"
              description="Drop up to 3 zip or jar files here, or browse from your computer."
              fileTypes={[".zip", ".jar"]}
              maxFiles={3}
              maxFileSize={10 * 1024 * 1024}
              multiple
            />
            <FileUpload
              locked
              label="Locked upload"
              description="Uploads are locked for this example."
              fileTypes={[".zip", ".jar"]}
              maxFiles={1}
            />
          </section>
        </div>
      </section>
    </>
  );
}
