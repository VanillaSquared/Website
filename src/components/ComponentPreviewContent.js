"use client";

import { useState } from "react";

import settingsIcon from "@/assets/icons/settings.svg";
import HeaderAuthButton from "@/components/AuthButton";
import Button from "@/components/Button";
import Card from "@/components/Card";
import Checkmark from "@/components/Checkmark";
import FileUpload from "@/components/FileUpload";
import ModalShowcase from "@/components/ModalShowcase";
import MultiSelect from "@/components/MultiSelect";
import ProfilePicture from "@/components/ProfilePicture";
import SaveConfirmation from "@/components/SaveConfirmation";
import SearchBar from "@/components/SearchBar";
import Tag from "@/components/Tag";
import Tabs from "@/components/Tabs";
import TextInput from "@/components/TextInput";
import Toggle from "@/components/Toggle";

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

export default function ComponentPreviewContent({ embedded = false } = {}) {
  const [designTab, setDesignTab] = useState("buttons");

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
                <div className="grid gap-3 md:grid-cols-2"><TextInput label="Editable" sampleText="Type here" /><TextInput locked label="Locked" defaultValue="Unavailable" /></div>
              ) : null}
              {designTab === "controls" ? (
                <div className="grid gap-3 md:grid-cols-2"><Toggle label="Enabled" defaultChecked /><MultiSelect label="Multi select" options={selectOptions} defaultValue={["vanilla"]} /></div>
              ) : null}
            </Card>
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
            <h2 className="text-2xl font-semibold text-heading">Profile pictures</h2>
            <div className="flex flex-wrap items-center gap-4">
              <ProfilePicture username="PainterFlow11" email="painterflow11@example.com" />
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
            <div className="flex flex-wrap gap-2">
              <Tag>Minecraft 26.2</Tag>
              <Tag>Fabric</Tag>
              <Tag>Java 25</Tag>
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
              <Card title="Limited multi select" size="md" className="overflow-visible">
                <MultiSelect label="Server software" options={selectOptions} defaultValue={["paper"]} max={2} />
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
