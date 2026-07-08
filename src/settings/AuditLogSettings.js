"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import filterIcon from "@/assets/icons/filter.svg";
import Button from "@/components/Button";
import FilterSidebar from "@/components/FilterSidebar";
import MultiSelect from "@/components/MultiSelect";
import SearchBar from "@/components/SearchBar";
import Separator from "@/components/Separator";
import UserMultiSelect from "@/components/UserMultiSelect";

const TABS = [
  { label: "All", value: "all" },
  { label: "User Management", value: "user_management" },
  { label: "User Actions", value: "user_action" },
  { label: "Bug Reporter", value: "bug_reporter_action" },
  { label: "Bug Panel", value: "bug_panel_action" },
];

const TYPE_LABELS = Object.fromEntries(TABS.map((tab) => [tab.value, tab.label]));

function formatDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date.toLocaleString() : "Unknown time";
}

function JsonBlock({ title, value }) {
  if (value == null) return null;
  return (
    <div>
      <h4 className="mb-1 text-xs font-semibold uppercase tracking-wide text-subtle">{title}</h4>
      <pre className="max-h-56 overflow-auto rounded-lg border border-divider bg-black/20 p-3 text-xs text-soft [scrollbar-gutter:stable]">{JSON.stringify(value, null, 2)}</pre>
    </div>
  );
}

function LogRow({ log, expanded, onToggle }) {
  async function copyJson(event) {
    event.stopPropagation();
    await navigator.clipboard?.writeText(JSON.stringify(log, null, 2));
  }

  return (
    <article>
      <button type="button" className="grid w-full items-center gap-2 px-4 py-2 text-left transition-colors hover:bg-card/50 sm:grid-cols-[9rem_8rem_1fr_auto]" onClick={onToggle}>
        <div className="truncate text-xs text-muted">{formatDate(log.createdAt)}</div>
        <div className="truncate text-xs font-semibold text-accent">{TYPE_LABELS[log.type] ?? log.type}</div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-heading">{log.summary}</p>
          <p className="truncate text-xs text-subtle">{log.action} · {log.actor?.username ?? "System"}{log.target?.username ? ` → ${log.target.username}` : ""}</p>
        </div>
        <span
          aria-hidden="true"
          className={`h-2 w-2 justify-self-end border-r-2 border-b-2 border-muted transition-transform ${expanded ? "rotate-[225deg]" : "rotate-45"}`}
        />
      </button>
      {expanded ? (
        <div className="space-y-3 border-t border-divider/70 px-4 py-3">
          <div className="grid gap-2 text-xs sm:grid-cols-2">
            <p><span className="text-subtle">Actor:</span> <span className="text-heading">{log.actor?.username ?? log.actorUserId ?? "System"}</span></p>
            <p><span className="text-subtle">Target:</span> <span className="text-heading">{log.target?.username ?? log.targetUserId ?? "None"}</span></p>
            <p><span className="text-subtle">Type/action:</span> {log.type} / {log.action}</p>
            <p><span className="text-subtle">Timestamp:</span> {formatDate(log.createdAt)}</p>
          </div>
          <p className="text-sm text-soft">{log.summary}</p>
          <div className="grid gap-3 lg:grid-cols-2">
            <JsonBlock title="Before" value={log.beforeData} />
            <JsonBlock title="After" value={log.afterData} />
          </div>
          <JsonBlock title="Full audit log entry" value={log} />
          <Button size="sm" variant="tertiary" onClick={copyJson}>Copy JSON</Button>
        </div>
      ) : null}
    </article>
  );
}

export default function AuditLogSettings() {
  const tab = "all";
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState([]);
  const [users, setUsers] = useState([]);
  const [types, setTypes] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedTypes, setSelectedTypes] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const typeOptions = useMemo(() => (types.length ? types : TABS.slice(1).map((item) => item.value)).map((type) => ({ value: type, label: TYPE_LABELS[type] ?? type })), [types]);

  const loadUsers = useCallback(async () => {
    const response = await fetch("/api/audit-log/users", { cache: "no-store", credentials: "same-origin" });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.error || "Could not load users.");
    setUsers(Array.isArray(data.users) ? data.users : []);
  }, []);

  const loadLogs = useCallback(async ({ append = false, cursor = null } = {}) => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ tab, limit: "30" });
      if (search.trim()) params.set("search", search.trim());
      if (cursor) params.set("cursor", cursor);
      selectedUsers.forEach((user) => params.append("user", user));
      selectedTypes.forEach((type) => params.append("type", type));
      const response = await fetch(`/api/audit-log?${params.toString()}`, { cache: "no-store", credentials: "same-origin" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || "Could not load audit logs.");
      setLogs((current) => append ? [...current, ...(data.logs ?? [])] : (data.logs ?? []));
      if (Array.isArray(data.users)) setUsers(data.users);
      if (Array.isArray(data.types)) setTypes(data.types);
      setNextCursor(data.nextCursor ?? null);
      setHasMore(Boolean(data.hasMore));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [search, selectedTypes, selectedUsers, tab]);

  useEffect(() => {
    const timeout = window.setTimeout(() => loadLogs(), 200);
    return () => window.clearTimeout(timeout);
  }, [loadLogs]);

  useEffect(() => {
    loadUsers().catch((err) => setError(err.message || "Could not load users."));
  }, [loadUsers]);

  useEffect(() => {
    if (!filtersOpen || users.length) return;

    loadUsers().catch((err) => setError(err.message || "Could not load users."));
  }, [filtersOpen, loadUsers, users.length]);

  return (
    <div className="flex h-full min-h-0 flex-col text-soft">
      <div className="flex shrink-0 flex-col gap-3 pb-4 sm:flex-row sm:items-center">
        <SearchBar variant="settings" className="flex-1" placeholder="Search audit logs" value={search} onChange={setSearch} showPreview={false} />
        <Button variant="iconButton" size="iconButton" icon={filterIcon} iconClassName="h-5 w-5" aria-label="Filters" title="Filters" onClick={() => setFiltersOpen((open) => !open)} />
      </div>
      {error ? <p className="mb-3 rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p> : null}
      <div className="relative min-h-64 flex-1 before:absolute before:top-0 before:-left-4 before:-right-4 before:h-px before:bg-separator after:absolute after:bottom-0 after:-left-4 after:-right-4 after:h-px after:bg-separator">
        <div className="h-full overflow-y-auto pb-6 [scrollbar-gutter:stable]">
          {logs.map((log, index) => (
            <div key={log.id}>
              {index > 0 ? <Separator /> : null}
              <LogRow log={log} expanded={expandedId === log.id} onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)} />
            </div>
          ))}
          {!logs.length && !loading ? <p className="py-10 text-center text-sm text-muted">No audit logs found.</p> : null}
          {hasMore ? <Button className="mx-auto mt-4 flex" variant="tertiary" disabled={loading} onClick={() => loadLogs({ append: true, cursor: nextCursor })}>{loading ? "Loading..." : "Load more"}</Button> : null}
        </div>
      </div>

      <FilterSidebar
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        title="Audit filters"
        subtitle="Filter by users and log types."
        footer={<Button className="w-full" variant="tertiary" onClick={() => { setSelectedUsers([]); setSelectedTypes([]); }}>Clear filters</Button>}
      >
        <div className="space-y-4">
          <UserMultiSelect users={users} value={selectedUsers} onChange={setSelectedUsers} max={10} placeholder="Select up to 10 users" emptyText="No users available." />
          <MultiSelect label="Types" options={typeOptions} value={selectedTypes} onChange={setSelectedTypes} placeholder="Select log types" />
        </div>
      </FilterSidebar>
    </div>
  );
}
