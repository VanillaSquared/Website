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
    button: "Default + animation + background",
    variant: "default",
    background: "dim",
    popupAnimation: true,
    content: "default",
  },
  {
    id: "compactNoAnimation",
    title: "Compact modal",
    button: "Compact + no animation + background",
    variant: "compact",
    background: "dim",
    popupAnimation: false,
    content: "form",
  },
  {
    id: "wideNoBackground",
    title: "Wide modal",
    button: "Wide + animation + no background",
    variant: "wide",
    background: "none",
    popupAnimation: true,
    content: "cards",
  },
  {
    id: "drawerNoBackground",
    title: "Drawer modal",
    button: "Drawer + animation + no background",
    variant: "drawer",
    background: "none",
    popupAnimation: true,
    content: "drawer",
  },
  {
    id: "bottomSheet",
    title: "Bottom sheet modal",
    button: "Bottom sheet + animation + background",
    variant: "bottomSheet",
    background: "dim",
    popupAnimation: true,
    content: "bottomSheet",
  },
  {
    id: "fullscreenNoAnimation",
    title: "Fullscreen modal",
    button: "Fullscreen + no animation + background",
    variant: "fullscreen",
    background: "dim",
    popupAnimation: false,
    content: "fullscreen",
  },
];

function ModalContent({ type, title, onClose }) {
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
          <Tag>No background</Tag>
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
          <Tag>Drawer</Tag>
          <h3 className="mt-3 text-2xl font-bold text-heading">{title}</h3>
          <p className="mt-2 text-sm text-muted">A side panel variant with a transparent page background.</p>
        </div>
        <SearchBar placeholder="Search from a drawer..." className="max-w-none" />
        <div className="grid gap-3">
          {['Profile tools', 'Project settings', 'Quick actions'].map((item) => (
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

  if (type === "fullscreen") {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-4xl flex-col gap-6">
        <div>
          <Tag>Fullscreen</Tag>
          <h3 className="mt-3 text-3xl font-bold text-heading">{title}</h3>
          <p className="mt-2 text-muted">A large modal without popup animation for full-page workflows.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {['Plan', 'Build', 'Ship'].map((item) => (
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
        <p className="mt-2 text-sm text-muted">The default modal uses a backdrop and popup animation.</p>
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
        Modal variants with and without animations/backgrounds, each containing other reusable components.
      </p>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {modalExamples.map((example) => (
          <Button key={example.id} variant="secondary" onClick={() => setOpenModal(example.id)}>
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
          popupAnimation={example.popupAnimation}
        >
          <ModalContent type={example.content} title={example.title} onClose={() => setOpenModal(null)} />
        </Modal>
      ))}
    </section>
  );
}
