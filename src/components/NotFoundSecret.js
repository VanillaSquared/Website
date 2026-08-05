"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

import houseImage from "@/assets/other/house.png";
import Modal from "@/components/Modal";
import TextInput from "@/components/TextInput";

const SECRET_PHRASE = "av house";
const SECRET_DIGITS = "1158";

export default function NotFoundSecret() {
  const typedPhrase = useRef("");
  const [open, setOpen] = useState(false);
  const [digits, setDigits] = useState("");
  const solved = digits.length === SECRET_DIGITS.length && [...digits].sort().join("") === SECRET_DIGITS;

  useEffect(() => {
    if (open) return undefined;

    function handleKeyDown(event) {
      if (event.ctrlKey || event.altKey || event.metaKey || event.key.length !== 1) return;

      const key = event.key.toLowerCase();
      if (key === "r") {
        typedPhrase.current = "";
        return;
      }

      typedPhrase.current += key;
      if (typedPhrase.current === SECRET_PHRASE) {
        typedPhrase.current = "";
        setDigits("");
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function closeModal() {
    setOpen(false);
    setDigits("");
  }

  return (
    <Modal open={open} onClose={closeModal} variant="wide" ariaLabelledBy="house-secret-title">
      <h2 id="house-secret-title" className="sr-only">House</h2>
      <div className="space-y-5">
        <Image
          src={houseImage}
          alt="A house"
          className="h-auto w-full rounded-lg"
          priority={false}
        />
        <TextInput
          label="Code"
          name="house-code"
          value={digits}
          filter="integer"
          inputMode="numeric"
          maxLength={4}
          autoComplete="off"
          onInput={(event) => setDigits(event.currentTarget.value)}
        />
        <p className="min-h-5 text-center text-sm font-semibold text-heading">
          {solved ? "In progress" : null}
        </p>
      </div>
    </Modal>
  );
}
