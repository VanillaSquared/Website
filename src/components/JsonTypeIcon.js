const labels = {
  array: "≡",
  boolean: "B",
  number: "I",
  object: "{}",
  string: "T",
};

export default function JsonTypeIcon({ type = "object", className = "", title }) {
  const normalizedType = labels[type] ? type : "object";

  return (
    <span
      className={`json-type-icon json-type-icon-${normalizedType} ${className}`}
      title={title ?? `${normalizedType} value`}
      aria-label={title ?? `${normalizedType} value`}
    >
      {labels[normalizedType]}
    </span>
  );
}
