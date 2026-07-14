"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import Button from "@/components/Button";
import Modal from "@/components/Modal";
import MultiSelect from "@/components/MultiSelect";
import ProfilePicture from "@/components/ProfilePicture";
import SaveConfirmation from "@/components/SaveConfirmation";
import Separator from "@/components/Separator";
import Tabs from "@/components/Tabs";
import TextInput from "@/components/TextInput";
import Toggle from "@/components/Toggle";
import UserMultiSelect from "@/components/UserMultiSelect";
import useRetainedModalValue from "@/settings/useRetainedModalValue";
import { formatEuropeanDateTime } from "@/utils/dateTime";

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

function ErrorText({ children }) {
  return children ? <p className="rounded-lg border border-error px-3 py-2 text-sm text-error">{children}</p> : null;
}

function typeLabel(type, options) {
  return options.find((option) => option.value === type)?.label ?? type;
}

function formatStatus(record) {
  if (record.status === "revoked") return `Revoked ${formatEuropeanDateTime(record.revokedAt)}`;
  if (record.status === "expired") return `Expired ${formatEuropeanDateTime(record.expiresAt)}`;
  if (record.permanent) return "Active · Permanent";
  return `Active until ${formatEuropeanDateTime(record.expiresAt)}`;
}

function configState(value = {}) {
  return {
    amount: String(value.amount ?? 1),
    duration: String(value.duration ?? "1d"),
    reactionCountLimit: String(value.reactionCountLimit ?? 3200),
    reactionTypeLimit: String(value.reactionTypeLimit ?? 20),
    automodEnabled: value.automodEnabled ?? true,
    blockedPhrases: Array.isArray(value.blockedPhrases) ? value.blockedPhrases.join("\n") : String(value.blockedPhrases ?? ""),
    allowedLinkHosts: Array.isArray(value.allowedLinkHosts) ? value.allowedLinkHosts.join("\n") : String(value.allowedLinkHosts ?? ""),
  };
}

function PunishmentHistoryModal({ user, records, types, onClose, onChanged }) {
  const displayedUser = useRetainedModalValue(user);
  const [editingId, setEditingId] = useState(null);
  const [duration, setDuration] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!user) return;
    setEditingId(null);
    setDuration("");
    setError("");
  }, [user]);

  if (!displayedUser) return null;

  async function mutate(record, method, body) {
    setBusy(true);
    setError("");
    try {
      await api(`/api/bug-panel/punishments/${record.id}`, { method, ...(body ? { body: JSON.stringify(body) } : {}) });
      await onChanged();
      setEditingId(null);
      setDuration("");
    } catch (cause) {
      setError(cause.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={Boolean(user)} onClose={() => !busy && onClose()} variant="wide">
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-heading">Punishment history</h2>
          <p className="text-sm text-muted">{displayedUser.username} · {displayedUser.email}</p>
        </div>
        <ErrorText>{error}</ErrorText>
        <div className="divide-y divide-divider border-y border-divider">
          {records.map((record) => (
            <div key={record.id} className="py-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-heading">{typeLabel(record.type, types)}</p>
                  <p className="text-xs text-muted">{formatStatus(record)}</p>
                  <p className="mt-0.5 text-xs text-subtle">Created {formatEuropeanDateTime(record.createdAt)}</p>
                </div>
                {record.status === "active" ? (
                  <div className="flex gap-2">
                    <Button size="sm" variant="tertiary" disabled={busy} onClick={() => { setEditingId(record.id); setDuration(""); }}>Edit</Button>
                    <Button size="sm" variant="danger" disabled={busy} onClick={() => mutate(record, "DELETE")}>Revoke</Button>
                  </div>
                ) : null}
              </div>
              {editingId === record.id ? (
                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                  <TextInput label="New duration" sampleText="7d or -1" filter="timeLimit" value={duration} onChange={(event) => setDuration(event.target.value)} />
                  <Button size="sm" disabled={busy || !duration.trim()} onClick={() => mutate(record, "PATCH", { duration })}>{busy ? "Saving..." : "Save"}</Button>
                </div>
              ) : null}
            </div>
          ))}
        </div>
        {!records.length ? <p className="text-sm italic text-muted">No punishment history.</p> : null}
        <div className="flex justify-end"><Button size="sm" variant="tertiary" disabled={busy} onClick={onClose}>Close</Button></div>
      </div>
    </Modal>
  );
}

function UserPunishmentRow({ user, records, onOpen }) {
  const activeCount = records.filter((record) => record.status === "active").length;
  return (
    <article className="flex items-center gap-3 px-4 py-3">
      <ProfilePicture className="border-accent/40 bg-accent/15" size="sm" username={user.username} email={user.email} />
      <div className="min-w-0 flex-1">
        <h2 className="truncate text-sm font-semibold text-heading">{user.username || "Unnamed user"}</h2>
        <p className="truncate text-xs text-muted">{activeCount} active · {records.length} total</p>
      </div>
      <Button size="sm" variant="tertiary" onClick={onOpen}>View</Button>
    </article>
  );
}

export default function BugPanelSettings() {
  const [tab, setTab] = useState("config");
  const [config, setConfig] = useState(() => configState());
  const [savedConfig, setSavedConfig] = useState(() => configState());
  const [users, setUsers] = useState([]);
  const [punishments, setPunishments] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [duration, setDuration] = useState("");
  const [status, setStatus] = useState("Loading...");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [historyUser, setHistoryUser] = useState(null);

  const loadConfig = useCallback(async () => {
    const data = await api("/api/bug-panel/config");
    const next = configState(data.config);
    setConfig(next);
    setSavedConfig(next);
  }, []);

  const loadPunishments = useCallback(async () => {
    const data = await api("/api/bug-panel/punishments");
    setPunishments(Array.isArray(data.punishments) ? data.punishments : []);
    setUsers(Array.isArray(data.users) ? data.users : []);
    setTypes(Array.isArray(data.types) ? data.types : []);
  }, []);

  const load = useCallback(async () => {
    setStatus("Loading...");
    setError("");
    await Promise.all([loadConfig(), loadPunishments()]);
    setStatus("");
  }, [loadConfig, loadPunishments]);

  useEffect(() => { load().catch((cause) => { setStatus(""); setError(cause.message || "Could not load bug panel."); }); }, [load]);

  const usersWithHistory = useMemo(() => users
    .map((user) => ({ user, records: punishments.filter((record) => record.userId === user.id) }))
    .filter((entry) => entry.records.length), [users, punishments]);
  const historyRecords = historyUser ? punishments.filter((record) => record.userId === historyUser.id) : [];
  const configDirty = Object.keys(config).some((key) => config[key] !== savedConfig[key]);
  const moderationDirty = selectedUsers.length > 0 || selectedTypes.length > 0 || duration.trim().length > 0;

  async function saveConfig() {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/bug-panel/config", { method: "PUT", body: JSON.stringify(config) });
      const next = configState(data.config);
      setConfig(next);
      setSavedConfig(next);
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  async function saveModeration() {
    setBusy(true);
    setError("");
    try {
      await api("/api/bug-panel/punishments", { method: "POST", body: JSON.stringify({ userIds: selectedUsers, types: selectedTypes, duration }) });
      setSelectedUsers([]);
      setSelectedTypes([]);
      setDuration("");
      await loadPunishments();
      setTab("users");
    } catch (cause) { setError(cause.message); } finally { setBusy(false); }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <Tabs tabs={[{ label: "Config", value: "config" }, { label: "Moderation", value: "moderation" }, { label: "Punishments", value: "users" }]} value={tab} onChange={setTab} line="full" />
      {status ? <p className="text-sm text-muted">{status}</p> : null}
      <ErrorText>{error}</ErrorText>

      {!status && tab === "config" ? (
        <div className="max-w-2xl space-y-5">
          <h2 className="text-base font-semibold text-heading">Bug creation limit</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Bug count" sampleText="1" filter="integer" value={config.amount} onChange={(event) => setConfig({ ...config, amount: event.target.value })} />
            <TextInput label="Time window" sampleText="1d" filter="timeLimit" value={config.duration} onChange={(event) => setConfig({ ...config, duration: event.target.value })} />
          </div>
          <p className="text-sm text-muted">Default users can create this many reports during the configured window unless they have bypass_limits.</p>
          <h2 className="text-base font-semibold text-heading">Comment reaction limits</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <TextInput label="Users per reaction" sampleText="3200" filter="integer" value={config.reactionCountLimit} onChange={(event) => setConfig({ ...config, reactionCountLimit: event.target.value })} />
            <TextInput label="Different reactions per comment" sampleText="20" filter="integer" value={config.reactionTypeLimit} onChange={(event) => setConfig({ ...config, reactionTypeLimit: event.target.value })} />
          </div>
          <h2 className="text-base font-semibold text-heading">Comment automoderation</h2>
          <Toggle label="Enable automoderation" description="Block configured phrases and links before comments are created or edited." checked={config.automodEnabled} onChange={(automodEnabled) => setConfig({ ...config, automodEnabled })} />
          <TextInput label="Blocked words and phrases" sampleText="One word or phrase per line" lines={6} value={config.blockedPhrases} onChange={(event) => setConfig({ ...config, blockedPhrases: event.target.value })} />
          <TextInput label="Allowed link hosts" sampleText={"minecraft.wiki\nyoutube.com\nyoutu.be"} lines={5} value={config.allowedLinkHosts} onChange={(event) => setConfig({ ...config, allowedLinkHosts: event.target.value })} />
          <p className="text-sm text-muted">One hostname per line. Subdomains and links to this website are allowed automatically; other websites are blocked.</p>
          <SaveConfirmation show={configDirty} busy={busy} onReset={loadConfig} onSave={saveConfig} />
        </div>
      ) : null}

      {!status && tab === "moderation" ? (
        <div className="max-w-2xl space-y-5">
          <UserMultiSelect users={users} value={selectedUsers} onChange={setSelectedUsers} placeholder="Select users to punish" />
          <MultiSelect label="Punishment types" options={types} value={selectedTypes} onChange={setSelectedTypes} placeholder="Select punishment types" />
          <TextInput label="Punishment duration" sampleText="7d, 1(hours).30(minutes), or -1" filter="timeLimit" value={duration} onChange={(event) => setDuration(event.target.value)} />
          <p className="text-sm text-muted">Use -1 for permanent punishments.</p>
          <SaveConfirmation show={moderationDirty} busy={busy} onReset={() => { setSelectedUsers([]); setSelectedTypes([]); setDuration(""); }} onSave={saveModeration} />
        </div>
      ) : null}

      {!status && tab === "users" ? (
        <div className="relative min-h-64 flex-1 before:absolute before:top-0 before:-left-4 before:-right-4 before:h-px before:bg-separator after:absolute after:bottom-0 after:-left-4 after:-right-4 after:h-px after:bg-separator">
          <div className="h-full overflow-y-auto">
            {usersWithHistory.map((entry, index) => (
              <div key={entry.user.id}>
                {index > 0 ? <Separator /> : null}
                <UserPunishmentRow {...entry} onOpen={() => setHistoryUser(entry.user)} />
              </div>
            ))}
          </div>
          {!usersWithHistory.length ? <p className="absolute inset-0 flex items-center justify-center text-sm italic text-muted">No punishment history.</p> : null}
        </div>
      ) : null}

      <PunishmentHistoryModal user={historyUser} records={historyRecords} types={types} onClose={() => setHistoryUser(null)} onChanged={loadPunishments} />
    </div>
  );
}
