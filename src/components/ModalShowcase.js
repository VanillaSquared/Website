"use client";

import { useState } from "react";

import Button from "@/components/Button";
import Card from "@/components/Card";
import Modal from "@/components/Modal";
import SearchBar from "@/components/SearchBar";
import Tag from "@/components/Tag";
import TextInput from "@/components/TextInput";

const modalExamples = [
  {
    id: "defaultAnimated",
    title: "Default modal",
    button: "Default · fade+pop in/out · backdrop",
    variant: "default",
    background: "dim",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
    content: "default",
  },
  {
    id: "compactNoAnimation",
    title: "Compact modal",
    button: "Compact · no animations · backdrop",
    variant: "compact",
    background: "dim",
    openAnimation: "none",
    closeAnimation: "none",
    content: "form",
  },
  {
    id: "wideNoBackground",
    title: "Wide modal",
    button: "Wide · fade+pop in · instant close",
    variant: "wide",
    background: "none",
    openAnimation: "fade+pop",
    closeAnimation: "none",
    content: "cards",
  },
  {
    id: "drawerNoBackground",
    title: "Drawer modal",
    button: "Drawer · instant open · fade+pop out",
    variant: "drawer",
    background: "none",
    openAnimation: "none",
    closeAnimation: "fade+pop",
    content: "drawer",
  },
  {
    id: "bottomSheet",
    title: "Bottom sheet modal",
    button: "Bottom sheet · fade+pop in/out",
    variant: "bottomSheet",
    background: "dim",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
    content: "bottomSheet",
  },
  {
    id: "nestedModals",
    title: "Modal stack",
    button: "Default · contains child modals",
    variant: "default",
    background: "dim",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
    content: "nested",
  },
  {
    id: "fullscreenNoAnimation",
    title: "Fullscreen modal",
    button: "Fullscreen · no animations · backdrop",
    variant: "fullscreen",
    background: "dim",
    openAnimation: "none",
    closeAnimation: "none",
    content: "fullscreen",
  },
  {
    id: "settingsScrollTest",
    title: "Settings scroll test",
    button: "Settings · scrolling test",
    variant: "settings",
    background: "dim",
    openAnimation: "fade+pop",
    closeAnimation: "fade+pop",
    content: "settingsScroll",
  },
];

function ModalContent({ type, title, onClose }) {
  const [nestedModal, setNestedModal] = useState(null);

  if (type === "form") {
    return (
      <div className="space-y-5">
        <div>
          <Tag>No animation</Tag>
          <h3 className="mt-3 text-2xl font-bold text-heading">{title}</h3>
          <p className="mt-2 text-sm text-muted">A small form using TextInput and Button components.</p>
        </div>
        <div className="space-y-3">
          <TextInput label="Display name" name="modal-display-name" sampleText="Vanilla" />
          <TextInput label="Email" name="modal-email" type="email" sampleText="player@example.com" />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="tertiary" onClick={onClose}>Cancel</Button>
          <Button onClick={onClose}>Save</Button>
        </div>
      </div>
    );
  }

  if (type === "cards") {
    return (
      <div className="space-y-5">
        <div>
          <Tag>No close animation</Tag>
          <h3 className="mt-3 text-2xl font-bold text-heading">{title}</h3>
          <p className="mt-2 text-sm text-muted">A wider modal with regular Card components inside it.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Card title="Nested card" size="sm">
            <p className="text-sm text-muted">Cards can be composed inside modals.</p>
          </Card>
          <Card title="Actions" size="sm" hoverAccent={false}>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" variant="blue">Blue</Button>
              <Button size="sm" variant="purple">Purple</Button>
            </div>
          </Card>
        </div>
        <Button variant="secondary" onClick={onClose}>Close wide modal</Button>
      </div>
    );
  }

  if (type === "drawer") {
    return (
      <div className="flex h-full flex-col gap-5">
        <div>
          <Tag>No open animation</Tag>
          <h3 className="mt-3 text-2xl font-bold text-heading">{title}</h3>
          <p className="mt-2 text-sm text-muted">A side panel variant with a transparent page background.</p>
        </div>
        <SearchBar placeholder="Search from a drawer..." className="max-w-none" />
        <div className="grid gap-3">
          {["Profile tools", "Project settings", "Quick actions"].map((item) => (
            <Card key={item} title={item} size="sm">
              <p className="text-sm text-muted">Reusable content inside a drawer modal.</p>
            </Card>
          ))}
        </div>
        <div className="mt-auto flex justify-end">
          <Button variant="tertiary" onClick={onClose}>Close drawer</Button>
        </div>
      </div>
    );
  }

  if (type === "bottomSheet") {
    return (
      <div className="space-y-5">
        <div>
          <Tag>Bottom sheet</Tag>
          <h3 className="mt-3 text-2xl font-bold text-heading">{title}</h3>
          <p className="mt-2 text-sm text-muted">A mobile-friendly modal variant anchored to the bottom.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Tag>Minecraft</Tag>
          <Tag>Fabric</Tag>
          <Tag>Java</Tag>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button variant="primary" onClick={onClose}>Continue</Button>
          <Button variant="tertiary" onClick={onClose}>Not now</Button>
        </div>
      </div>
    );
  }

  if (type === "nested") {
    return (
      <div className="space-y-5">
        <div>
          <Tag>Nested modals</Tag>
          <h3 className="mt-3 text-2xl font-bold text-heading">{title}</h3>
          <p className="mt-2 text-sm text-muted">This parent modal can open additional modal layers.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button size="sm" variant="blue" onClick={() => setNestedModal("details")}>Open details modal</Button>
          <Button size="sm" variant="purple" onClick={() => setNestedModal("confirm")}>Open confirm modal</Button>
        </div>
        <Card title="Parent modal content" size="sm">
          <p className="text-sm text-muted">The child modals render above this modal and can be closed independently.</p>
        </Card>
        <div className="flex justify-end">
          <Button variant="tertiary" onClick={onClose}>Close parent</Button>
        </div>

        <Modal
          open={nestedModal === "details"}
          onClose={() => setNestedModal(null)}
          variant="compact"
          background="dim"
          openAnimation="fade+pop"
          closeAnimation="fade+pop"
        >
          <div className="space-y-4">
            <div>
              <Tag>Child modal</Tag>
              <h4 className="mt-3 text-xl font-bold text-heading">Details inside a modal</h4>
              <p className="mt-2 text-sm text-muted">A compact child modal opened from the parent modal.</p>
            </div>
            <TextInput label="Nested note" name="nested-note" sampleText="Opened from the parent modal" />
            <Button size="sm" onClick={() => setNestedModal(null)}>Close details</Button>
          </div>
        </Modal>

        <Modal
          open={nestedModal === "confirm"}
          onClose={() => setNestedModal(null)}
          variant="settings"
          background="dim"
          openAnimation="none"
          closeAnimation="fade+pop"
        >
          <div className="space-y-4">
            <div>
              <Tag>Instant open</Tag>
              <h4 className="mt-3 text-xl font-bold text-heading">Confirm nested action</h4>
              <p className="mt-2 text-sm text-muted">This child modal opens instantly and fades/pops on close.</p>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <Button size="sm" variant="tertiary" onClick={() => setNestedModal(null)}>Cancel</Button>
              <Button size="sm" onClick={() => setNestedModal(null)}>Confirm</Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  if (type === "settingsScroll") {
    return (
      <div className="space-y-6">
        <div>
          <Tag>Settings variant</Tag>
          <h3 className="mt-3 text-2xl font-bold text-heading">{title}</h3>
          <p className="mt-2 text-sm text-muted">
            Lots of sample content for testing the settings modal scroll area while the profile and search stay locked.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {Array.from({ length: 24 }, (_, index) => (
            <Card key={index} title={`Settings test block ${index + 1}`} size="sm" hoverAccent={false}>
              <p className="text-sm text-muted">
                This is placeholder settings content for scroll testing. Open this modal and scroll the content area to verify the sidebar header remains in place.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Tag>Option {index + 1}</Tag>
                <Tag>Preview</Tag>
              </div>
            </Card>
          ))}
        </div>
        <div className="flex justify-end">
          <Button variant="tertiary" onClick={onClose}>Close settings test</Button>
        </div>
      </div>
    );
  }

  if (type === "fullscreen") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col gap-6">
        <div>
          <Tag>Fullscreen</Tag>
          <h3 className="mt-3 text-3xl font-bold text-heading">{title}</h3>
          <p className="mt-2 text-muted">A large modal without popup animation for full-page workflows.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {["Plan", "Build", "Ship"].map((item) => (
            <Card key={item} title={item}>
              <p className="text-sm text-muted">Example workflow card inside the fullscreen modal.</p>
            </Card>
          ))}
        </div>
        <SearchBar placeholder="Search fullscreen modal..." className="max-w-none" />
        <div className="mt-auto flex justify-end">
          <Button onClick={onClose}>Done</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Tag>Animated</Tag>
        <h3 className="mt-3 text-2xl font-bold text-heading">{title}</h3>
        <p className="mt-2 text-sm text-muted">The default modal uses a backdrop and fade+pop open/close animations.</p>
      </div>
      <Card title="Modal content card" size="sm">
        <p className="text-sm text-muted">This is a Card component rendered inside the modal.</p>
      </Card>
      <div className="flex flex-wrap gap-3">
        <Button variant="primary" onClick={onClose}>Confirm</Button>
        <Button variant="tertiary" onClick={onClose}>Close</Button>
      </div>
    </div>
  );
}

export default function ModalShowcase() {
  const [openModal, setOpenModal] = useState(null);

  return (
    <section className="space-y-4">
      <h2 className="text-2xl font-semibold text-heading">Modals</h2>
      <p className="max-w-2xl text-sm text-muted">
        Modal variants with separately selectable open and close animations/backgrounds, each containing other reusable components.
      </p>
      <div className="flex flex-wrap gap-2">
        {modalExamples.map((example) => (
          <Button
            key={example.id}
            variant="secondary"
            size="sm"
            className="justify-start text-left leading-tight"
            onClick={() => setOpenModal(example.id)}
          >
            {example.button}
          </Button>
        ))}
      </div>

      {modalExamples.map((example) => (
        <Modal
          key={example.id}
          open={openModal === example.id}
          onClose={() => setOpenModal(null)}
          variant={example.variant}
          background={example.background}
          openAnimation={example.openAnimation}
          closeAnimation={example.closeAnimation}
        >
          <ModalContent type={example.content} title={example.title} onClose={() => setOpenModal(null)} />
        </Modal>
      ))}
    </section>
  );
}
