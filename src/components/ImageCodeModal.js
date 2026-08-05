"use client";

import Image from "next/image";

import Modal from "@/components/Modal";
import TextInput from "@/components/TextInput";

export default function ImageCodeModal({
  open,
  onClose,
  image,
  imageAlt,
  title,
  name,
  value,
  onValueChange,
  maxLength,
  showCharacterLimit = true,
  successMessage,
}) {
  const titleId = `${name}-title`;

  return (
    <Modal open={open} onClose={onClose} variant="wide" ariaLabelledBy={titleId}>
      <h2 id={titleId} className="sr-only">{title}</h2>
      <div className="space-y-5">
        <Image
          src={image}
          alt={imageAlt}
          className="h-auto w-full rounded-lg"
          priority={false}
        />
        <TextInput
          label="Code"
          sampleText="Numbers only"
          name={name}
          value={value}
          filter="integer"
          inputMode="numeric"
          maxLength={maxLength}
          showCharacterLimit={showCharacterLimit}
          autoComplete="off"
          onInput={(event) => onValueChange(event.currentTarget.value)}
        />
        <p className="min-h-5 text-center text-sm font-semibold text-heading">
          {successMessage ?? null}
        </p>
      </div>
    </Modal>
  );
}
