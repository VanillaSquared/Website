"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import editIcon from "@/assets/icons/edit.svg";
import closeIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import MultiSelect from "@/components/MultiSelect";
import ProfilePicture from "@/components/ProfilePicture";
import SaveConfirmation from "@/components/SaveConfirmation";
import Separator from "@/components/Separator";
import Tabs from "@/components/Tabs";
import TextInput from "@/components/TextInput";

async function api(path, options = {}) {
  const response = await fetch(path, {
    cache: "no-store",
    credentials: "same-origin",
    headers: options.body ? { "Content-Type": "application/json" } : undefined,
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function formatExpiry(punishment) {
  if (punishment.permanent) return "Permanent";
  const date = punishment.expiresAt ? new Date(punishment.expiresAt) : null;
  if (!date || Number.isNaN(date.getTime())) return "Unknown expiry";
  return `Until ${date.toLocaleString()}`;
}

function ErrorText({ children }) {
  return children ? <p className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{children}</p> : null;
}

function EditPunishmentModal({ punishment, onClose, onChanged }) {
  const [duration, setDuration] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDuration("");
    setError("");
  }, [punishment]);

  if (!punishment) return null;

  async function save() {
    setBusy(true);
    setError("");
    try {
      await api(`/api/bug-panel/punishments/${punishment.userId}`, { method: "PATCH", body: JSON.stringify({ duration }) });
      await onChanged();
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={Boolean(punishment)} onClose={onClose} variant="compact">
      <div className="space-y-3 text-soft">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-heading">Edit punishment</h2>
            <p className="mt-0.5 truncate text-sm text-muted">{punishment.username || punishment.email || punishment.userId}</p>
          </div>
          <Button size="sm" variant="tertiary" icon={closeIcon} aria-label="Close" onClick={onClose} />
        </div>
        <ErrorText>{error}</ErrorText>
        <TextInput label="New duration" sampleText="7d or -1" filter="timeLimit" inputClassName="w-full" value={duration} onChange={(event) => setDuration(event.target.value)} />
        <div className="flex justify-end gap-2 pt-1">
          <Button size="sm" variant="tertiary" disabled={busy} onClick={onClose}>Close</Button>
          <Button size="sm" variant="green" disabled={busy} onClick={save}>{busy ? "Saving..." : "Save"}</Button>
        </div>
      </div>
    </Modal>
  );
}

function PunishmentRow({ punishment, onEdit, onRemove }) {
  return (
    <article className="px-4 py-3">
      <div className="flex items-center gap-3">
        <ProfilePicture className="border-accent/40 bg-accent/15" size="sm" username={punishment.username} email={punishment.email} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-base font-semibold text-heading">{punishment.username || "Unnamed user"}</h2>
          <p className="truncate text-sm text-muted">{punishment.email || punishment.userId}</p>
          <p className="mt-1 text-xs text-subtle">{formatExpiry(punishment)}</p>
        </div>
        <Button size="icon" variant="tertiary" icon={editIcon} aria-label="Edit punishment" onClick={onEdit} />
        <Button size="icon" variant="red" icon={closeIcon} aria-label="Remove punishment" onClick={onRemove} />
      </div>
    </article>
  );
}

export default function BugPanelSettings() {
  const [tab, setTab] = useState("config");
  const [config, setConfig] = useState({ amount: "1", duration: "1d" });
  const [savedConfig, setSavedConfig] = useState({ amount: "1", duration: "1d" });
  const [users, setUsers] = useState([]);
  const [punishments, setPunishments] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState("Loading...");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(null);

  const loadConfig = useCallback(async () => {
    const data = await api("/api/bug-panel/config");
    const next = { amount: String(data.config?.amount ?? 1), duration: String(data.config?.duration ?? "1d") };
    setConfig(next);
    setSavedConfig(next);
  }, []);

  const loadPunishments = useCallback(async () => {
    const data = await api("/api/bug-panel/punishments");
    setPunishments(Array.isArray(data.punishments) ? data.punishments : []);
    setUsers(Array.isArray(data.users) ? data.users : []);
  }, []);

  const load = useCallback(async () => {
    setStatus("Loading...");
    setError("");
    await Promise.all([loadConfig(), loadPunishments()]);
    setStatus("");
  }, [loadConfig, loadPunishments]);

  useEffect(() => { load().catch((err) => { setStatus(""); setError(err.message || "Could not load bug panel."); }); }, [load]);

  const configDirty = config.amount !== savedConfig.amount || config.duration !== savedConfig.duration;
  const moderationDirty = selectedUsers.length > 0 || duration.trim().length > 0;
  const userOptions = useMemo(() => users.map((user) => ({ label: `${user.username || "Unnamed user"} (${user.email || user.id})`, value: user.id })), [users]);

  async function saveConfig() {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/bug-panel/config", { method: "PUT", body: JSON.stringify({ amount: config.amount, duration: config.duration }) });
      const next = { amount: String(data.config?.amount ?? config.amount), duration: String(data.config?.duration ?? config.duration) };
      setConfig(next);
      setSavedConfig(next);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function saveModeration() {
    setBusy(true);
    setError("");
    try {
      await api("/api/bug-panel/punishments", { method: "POST", body: JSON.stringify({ userIds: selectedUsers, duration }) });
      setSelectedUsers([]);
      setDuration("");
      await loadPunishments();
      setTab("users");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function removePunishment(userId) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/bug-panel/punishments/${userId}`, { method: "DELETE" });
      await loadPunishments();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <Tabs tabs={[{ label: "Config", value: "config" }, { label: "Moderation", value: "moderation" }, { label: "Punishments", value: "users" }]} value={tab} onChange={setTab} line="full" />
      {status ? <p className="text-sm text-muted">{status}</p> : null}
      <ErrorText>{error}</ErrorText>

      {!status && tab === "config" ? (
        <div className="max-w-2xl space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Bug count" sampleText="1" filter="integer" value={config.amount} onChange={(event) => setConfig({ ...config, amount: event.target.value })} />
            <TextInput label="Time window" sampleText="1d" filter="timeLimit" value={config.duration} onChange={(event) => setConfig({ ...config, duration: event.target.value })} />
          </div>
          <p className="text-sm text-muted">Default users can create this many reports during the configured window unless they have bypass_limits.</p>
          <SaveConfirmation show={configDirty} busy={busy} onReset={loadConfig} onSave={saveConfig} />
        </div>
      ) : null}

      {!status && tab === "moderation" ? (
        <div className="max-w-2xl space-y-5">
          <MultiSelect label="Users" options={userOptions} value={selectedUsers} onChange={setSelectedUsers} placeholder="Select users to punish" />
          <TextInput label="Punishment duration" sampleText="7d, 1(hours).30(minutes), or -1" filter="timeLimit" value={duration} onChange={(event) => setDuration(event.target.value)} />
          <p className="text-sm text-muted">Use -1 for permanent punishments.</p>
          <SaveConfirmation show={moderationDirty} busy={busy} onReset={() => { setSelectedUsers([]); setDuration(""); }} onSave={saveModeration} />
        </div>
      ) : null}

      {!status && tab === "users" ? (
        <div className="relative min-h-64 flex-1 before:absolute before:top-0 before:-left-4 before:-right-4 before:h-px before:bg-separator after:absolute after:bottom-0 after:-left-4 after:-right-4 after:h-px after:bg-separator">
          <div className="h-full overflow-y-auto">
            {punishments.map((punishment, index) => (
              <div key={punishment.userId}>
                {index > 0 ? <Separator /> : null}
                <PunishmentRow punishment={punishment} onEdit={() => setEditing(punishment)} onRemove={() => removePunishment(punishment.userId)} />
              </div>
            ))}
          </div>
          {!punishments.length ? <p className="absolute inset-0 flex items-center justify-center text-sm italic text-muted">No active bug punishments.</p> : null}
        </div>
      ) : null}

      <EditPunishmentModal punishment={editing} onClose={() => setEditing(null)} onChanged={loadPunishments} />
    </div>
  );
}
