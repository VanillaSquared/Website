import Button from "@/components/Button";

export default function SaveConfirmation({
  show = true,
  message = "Careful — you have unsaved changes!",
  resetLabel = "Reset",
  saveLabel = "Save Changes",
  savingLabel = "Saving...",
  busy = false,
  onReset,
  onSave,
  className = "",
}) {
  if (!show) return null;

  return (
    <div className={`save-confirmation-enter flex flex-wrap items-center justify-between gap-2 rounded-lg bg-card px-4 py-2 ${className}`}>
      <p className="text-sm font-semibold text-heading">{message}</p>
      <div className="flex items-center gap-2">
        <button type="button" className="px-2 py-1 text-sm font-semibold text-accent transition hover:text-control-focus disabled:cursor-not-allowed disabled:opacity-60" disabled={busy} onClick={onReset}>{resetLabel}</button>
        <Button size="sm" variant="green" disabled={busy} onClick={onSave}>{busy ? savingLabel : saveLabel}</Button>
      </div>
    </div>
  );
}
