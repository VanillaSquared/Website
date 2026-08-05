"use client";

import { useEffect, useRef, useState } from "react";

import caveImage from "@/assets/other/cave.png";
import houseImage from "@/assets/other/house.png";
import ImageCodeModal from "@/components/ImageCodeModal";

const SECRET_PHRASE = "av house";
const HOUSE_CODE_DIGITS = "1158";
const CAVE_CODE = "17";

export default function NotFoundSecret() {
  const typedPhrase = useRef("");
  const [open, setOpen] = useState(false);
  const [houseCode, setHouseCode] = useState("");
  const [caveCode, setCaveCode] = useState("");
  const houseSolved = houseCode.length === HOUSE_CODE_DIGITS.length
    && [...houseCode].sort().join("") === HOUSE_CODE_DIGITS;
  const caveSolved = caveCode === CAVE_CODE;

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
        setHouseCode("");
        setCaveCode("");
        setOpen(true);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open]);

  function closeModal() {
    setOpen(false);
    setHouseCode("");
    setCaveCode("");
  }

  if (houseSolved) {
    return (
      <ImageCodeModal
        key="cave"
        open={open}
        onClose={closeModal}
        image={caveImage}
        imageAlt="A cave"
        title="Cave"
        name="cave-code"
        value={caveCode}
        onValueChange={setCaveCode}
        maxLength={2}
        showCharacterLimit={false}
        successMessage={caveSolved ? "In progress" : null}
      />
    );
  }

  return (
    <ImageCodeModal
      key="house"
      open={open}
      onClose={closeModal}
      image={houseImage}
      imageAlt="A house"
      title="House"
      name="house-code"
      value={houseCode}
      onValueChange={setHouseCode}
      maxLength={4}
    />
  );
}
