import Image from "next/image";

import arrayIcon from "@/assets/icons/json-types/array.svg";
import booleanIcon from "@/assets/icons/json-types/boolean.svg";
import byteIcon from "@/assets/icons/json-types/byte.svg";
import doubleIcon from "@/assets/icons/json-types/double.svg";
import floatIcon from "@/assets/icons/json-types/float.svg";
import integerIcon from "@/assets/icons/json-types/integer.svg";
import longIcon from "@/assets/icons/json-types/long.svg";
import numberIcon from "@/assets/icons/json-types/number.svg";
import objectIcon from "@/assets/icons/json-types/object.svg";
import shortIcon from "@/assets/icons/json-types/short.svg";
import stringIcon from "@/assets/icons/json-types/string.svg";

const typeDefinitions = {
  array: { icon: arrayIcon },
  boolean: { icon: booleanIcon },
  byte: { icon: byteIcon },
  double: { icon: doubleIcon },
  float: { icon: floatIcon },
  int: { icon: integerIcon, normalizedType: "integer" },
  integer: { icon: integerIcon },
  long: { icon: longIcon },
  number: { icon: numberIcon },
  object: { icon: objectIcon },
  short: { icon: shortIcon },
  string: { icon: stringIcon },
};

function TypeIcon({ requestedType, className = "", title }) {
  const definition = typeDefinitions[requestedType] ?? typeDefinitions.object;
  const normalizedType = definition.normalizedType ?? (typeDefinitions[requestedType] ? requestedType : "object");
  const accessibleLabel = title ?? `${normalizedType} value`;

  return (
    <span
      className={`json-type-icon json-type-icon-${normalizedType} ${className}`}
      title={accessibleLabel}
      aria-label={accessibleLabel}
    >
      <Image className="json-type-icon-image" src={definition.icon} alt="" width={16} height={16} aria-hidden="true" />
    </span>
  );
}

export default function JsonTypeIcon({ type = "object", className = "", title }) {
  const requestedTypes = String(type)
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  const types = requestedTypes.length ? requestedTypes : ["object"];

  if (types.length === 1) {
    return <TypeIcon requestedType={types[0]} className={className} title={title} />;
  }

  return (
    <span className={`json-type-icons ${className}`} title={title}>
      {types.map((requestedType, index) => (
        <TypeIcon key={`${requestedType}-${index}`} requestedType={requestedType} />
      ))}
    </span>
  );
}
