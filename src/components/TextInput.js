export default function TextInput({
  label,
  sampleText = "",
  className = "",
  inputClassName = "",
  id,
  name,
  type = "text",
  useOnePassword = false,
  ...props
}) {
  const inputId = id ?? name;

  return (
    <label className={`flex flex-col gap-2 text-sm font-semibold text-soft ${className}`}>
      {label}
      <input
        id={inputId}
        name={name}
        type={type}
        placeholder={sampleText}
        className={`rounded-lg border border-input-border bg-input px-3 py-2 text-heading outline-none transition-colors placeholder:text-input-sample placeholder:italic hover:border-input-border-hover hover:bg-input-hover focus:border-input-border-focus focus:bg-input-focus ${inputClassName}`}
        {...(!useOnePassword ? { "data-1p-ignore": "true" } : {})}
        {...props}
      />
    </label>
  );
}
