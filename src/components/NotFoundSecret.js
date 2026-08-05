"use client";

import { useState } from "react";

import caveImage from "@cdn/other/cave.png";
import houseImage from "@cdn/other/house.png";
import ImageCodeModal from "@/components/ImageCodeModal";
import useSecretSequence from "@/hooks/useSecretSequence";

const SECRET_PHRASE = "av house";
const HOUSE_CODE_DIGITS = "1158";
const CAVE_CODE = "17";

export default function NotFoundSecret() {
  const [open, setOpen] = useState(false);
  const [houseCode, setHouseCode] = useState("");
  const [caveCode, setCaveCode] = useState("");
  const houseSolved = houseCode.length === HOUSE_CODE_DIGITS.length
    && [...houseCode].sort().join("") === HOUSE_CODE_DIGITS;
  const caveSolved = caveCode === CAVE_CODE;

  useSecretSequence({
    sequence: SECRET_PHRASE,
    enabled: !open,
    onMatch: () => {
      setHouseCode("");
      setCaveCode("");
      setOpen(true);
    },
  });

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
