"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import plusIcon from "@/assets/icons/plus.svg";
import closeIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import MultiSelect from "@/components/MultiSelect";
import ProfilePicture from "@/components/ProfilePicture";
import SearchBar from "@/components/SearchBar";
import Separator from "@/components/Separator";
import Tabs from "@/components/Tabs";
import Tag from "@/components/Tag";

const ALL_PERMISSIONS = ["bug_panel", "design_test", "dev_options", "user_management", "manage_roles", "delete_user", "manage_user", "create_bugs", "view_bugs"];
const rolePriority = ["owner", "developer", "dev", "support", "default"];

function ModalSeparator({ bleed = false, className = "" }) {
  return <Separator className={`${bleed ? "-mx-6 w-[calc(100%+3rem)]" : "w-full"} ${className}`} />;
}

function getJoinedDate(user) {
  const date = user.createdAt ? new Date(user.createdAt) : null;
  if (!date || Number.isNaN(date.getTime())) return "Unknown join date";
  return `Joined ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function getHighestRole(user) {
  const roles = user.authorization?.roles ?? [];
  return rolePriority.find((role) => roles.includes(role)) ?? roles[0] ?? "default";
}

function formatRole(role) {
  return role === "developer" ? "dev" : role;
}

function matchesQuery(values, query) {
  const normalizedQuery = query.trim().toLowerCase();
  return !normalizedQuery || values.filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

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

function ModalHeader({ title, subtitle, onClose }) {
  return (
    <>
      <div className="flex items-start justify-between gap-4 px-6 pt-6">
        <div className="min-w-0">
          <h2 className="truncate text-xl font-semibold text-heading">{title}</h2>
          {subtitle ? <p className="mt-1 truncate text-sm text-muted">{subtitle}</p> : null}
        </div>
        <Button size="icon" variant="tertiary" icon={closeIcon} aria-label="Close" onClick={onClose} />
      </div>
      <ModalSeparator className="mt-5" />
    </>
  );
}

function lockedInputClass(locked) {
  return `mt-1 w-full rounded-lg border px-3 py-2 outline-none ${locked ? "cursor-not-allowed border-locked-input-border bg-locked-input text-locked-text" : "border-divider bg-card text-heading"}`;
}

async function syncUserRoles(userId, before, after) {
  const previous = new Set(before);
  const next = new Set(after);
  await Promise.all([
    ...after.filter((role) => !previous.has(role)).map((role) => api(`/api/users/${userId}/roles`, { method: "POST", body: JSON.stringify({ role }) })),
    ...before.filter((role) => !next.has(role)).map((role) => api(`/api/users/${userId}/roles/${encodeURIComponent(role)}`, { method: "DELETE" })),
  ]);
}

async function syncUserPermissions(userId, before, after) {
  const previous = new Set(before);
  const next = new Set(after);
  await Promise.all([
    ...after.filter((permission) => !previous.has(permission)).map((permission) => api(`/api/users/${userId}/permissions`, { method: "POST", body: JSON.stringify({ permission }) })),
    ...before.filter((permission) => !next.has(permission)).map((permission) => api(`/api/users/${userId}/permissions/${encodeURIComponent(permission)}`, { method: "DELETE" })),
  ]);
}

function UserDetailsModal({ user, roles, actions, onClose, onChanged }) {
  const [form, setForm] = useState({ username: user?.username ?? "", email: user?.email ?? "" });
  const [selectedRoles, setSelectedRoles] = useState(user?.authorization?.roles ?? []);
  const [selectedPermissions, setSelectedPermissions] = useState(user?.authorization?.individualPermissions ?? []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const authorization = user?.authorization ?? {};
  const protectedUser = user?.isProtected;
  const canManageRoles = Boolean(actions.canManageRoles && !protectedUser);
  const canManageUser = Boolean(actions.canManageUser && !protectedUser);
  const canDeleteUser = Boolean(actions.canDeleteUser && !protectedUser);

  useEffect(() => {
    setForm({ username: user?.username ?? "", email: user?.email ?? "" });
    setSelectedRoles(user?.authorization?.roles ?? []);
    setSelectedPermissions(user?.authorization?.individualPermissions ?? []);
  }, [user]);

  if (!user) return null;

  async function mutate(work) {
    setBusy(true);
    setError("");
    try {
      await work();
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={Boolean(user)} onClose={onClose} variant="wide">
      <div className="text-soft">
        <ModalHeader title={user.username} subtitle={user.id} onClose={onClose} />
        <div className="space-y-5 p-6">
          {error ? <p className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p> : null}
          {protectedUser ? <p className="text-sm text-muted">This account is protected and cannot be changed.</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Username<input className={lockedInputClass(!canManageUser || busy)} disabled={!canManageUser || busy} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
            <label className="text-sm">Email<input className={lockedInputClass(!canManageUser || busy)} disabled={!canManageUser || busy} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
          </div>
          <Button size="sm" variant={canManageUser ? "green" : "locked"} disabled={busy} locked={!canManageUser} onClick={() => mutate(() => api(`/api/users/${user.id}`, { method: "PATCH", body: JSON.stringify(form) }))}>Save user</Button>
          <ModalSeparator bleed />
          <MultiSelect label="Roles" options={roles.map((role) => ({ label: role.name, value: role.name }))} value={selectedRoles} onChange={setSelectedRoles} locked={!canManageRoles || busy} placeholder="Select roles" />
          <MultiSelect label="Individual permissions" options={ALL_PERMISSIONS.map((permission) => ({ label: permission, value: permission }))} value={selectedPermissions} onChange={setSelectedPermissions} locked={!canManageRoles || busy} placeholder="Select permissions" />
          <Button size="sm" variant={canManageRoles ? "green" : "locked"} disabled={busy} locked={!canManageRoles} onClick={() => mutate(async () => {
            await syncUserRoles(user.id, authorization.roles ?? [], selectedRoles);
            await syncUserPermissions(user.id, authorization.individualPermissions ?? [], selectedPermissions);
          })}>Save authorization</Button>
          <div><h3 className="font-semibold text-heading">Resolved permissions</h3><p className="mt-2 text-sm text-muted">{(authorization.permissions ?? []).join(", ") || "None"}</p></div>
          <ModalSeparator bleed />
          <Button size="sm" variant={canDeleteUser ? "red" : "locked"} disabled={busy} locked={!canDeleteUser} onClick={() => mutate(async () => { await api(`/api/users/${user.id}`, { method: "DELETE" }); onClose(); })}>Delete user</Button>
        </div>
      </div>
    </Modal>
  );
}

function RoleDetailsModal({ role, actions, onClose, onChanged }) {
  const [name, setName] = useState(role?.name ?? "");
  const [permissions, setPermissions] = useState(role?.permissions ?? []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canEdit = Boolean(actions.canManageRoles);

  useEffect(() => {
    setName(role?.name ?? "");
    setPermissions(role?.permissions ?? []);
  }, [role]);

  if (!role) return null;

  async function mutate(work) {
    setBusy(true);
    setError("");
    try {
      await work();
      await onChanged();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={Boolean(role)} onClose={onClose} variant="wide">
      <div className="text-soft">
        <ModalHeader title={`Role: ${role.name}`} onClose={onClose} />
        <div className="space-y-5 p-6">
          {error ? <p className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p> : null}
          <label className="block text-sm">Role name<input className={lockedInputClass(!canEdit || busy)} disabled={!canEdit || busy} value={name} onChange={(e) => setName(e.target.value)} /></label>
          <MultiSelect label="Permissions" options={ALL_PERMISSIONS.map((permission) => ({ label: permission, value: permission }))} value={permissions} onChange={setPermissions} locked={!canEdit || busy} placeholder="Select permissions" />
          <div className="flex gap-2">
            <Button size="sm" variant={canEdit ? "green" : "locked"} disabled={busy} locked={!canEdit} onClick={() => mutate(async () => {
              const target = name !== role.name ? (await api(`/api/roles/${encodeURIComponent(role.name)}`, { method: "PATCH", body: JSON.stringify({ name }) })).role.name : role.name;
              await api(`/api/roles/${encodeURIComponent(target)}/permissions`, { method: "PUT", body: JSON.stringify({ permissions }) });
            })}>Save role</Button>
            <Button size="sm" variant={canEdit ? "red" : "locked"} disabled={busy} locked={!canEdit} onClick={() => mutate(async () => { await api(`/api/roles/${encodeURIComponent(role.name)}`, { method: "DELETE" }); onClose(); })}>Delete role</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CreateRoleModal({ open, actions, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canCreate = Boolean(actions.canManageRoles);

  useEffect(() => {
    if (open) {
      setName("");
      setPermissions([]);
      setError("");
    }
  }, [open]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/roles", { method: "POST", body: JSON.stringify({ name, permissions }) });
      await onCreated(data.role.name);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} variant="wide">
      <div className="text-soft">
        <ModalHeader title="Create role" onClose={onClose} />
        <div className="space-y-5 p-6">
          {error ? <p className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p> : null}
          <label className="block text-sm">Role name<input className={lockedInputClass(!canCreate || busy)} disabled={!canCreate || busy} value={name} onChange={(event) => setName(event.target.value)} placeholder="moderator" /></label>
          <MultiSelect label="Initial permissions" options={ALL_PERMISSIONS.map((permission) => ({ label: permission, value: permission }))} value={permissions} onChange={setPermissions} locked={!canCreate || busy} placeholder="Select permissions" />
          <Button size="sm" variant={canCreate ? "green" : "locked"} disabled={busy} locked={!canCreate} onClick={submit}>Create role</Button>
        </div>
      </div>
    </Modal>
  );
}

function UserRow({ user, onClick }) {
  return <article className="cursor-pointer px-4 py-3 hover:bg-card/50" onClick={onClick}><div className="flex gap-3"><ProfilePicture className="mt-0.5 border-accent/40 bg-accent/15" size="sm" username={user.username} email={user.email} /><div className="min-w-0 flex-1"><Tag variant={getHighestRole(user) === "default" ? "subtle" : "accent"}>{formatRole(getHighestRole(user))}</Tag><h2 className="mt-2 text-base font-semibold text-heading">{user.username || "Unnamed user"}</h2><p className="truncate text-sm text-muted">{user.email || "No email"}</p><p className="mt-2 truncate text-xs text-subtle">{getJoinedDate(user)}</p></div></div></article>;
}

export default function UserManagementSettings() {
  const [page, setPage] = useState("users");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [actions, setActions] = useState({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading...");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRoleName, setSelectedRoleName] = useState(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const scrollTimeoutRef = useRef(null);
  const [isScrolling, setIsScrolling] = useState(false);

  const load = useCallback(async () => {
    const [userData, roleData] = await Promise.all([api("/api/users"), api("/api/roles")]);
    setUsers(Array.isArray(userData.users) ? userData.users : []);
    setRoles(Array.isArray(roleData.roles) ? roleData.roles : []);
    setActions(userData.viewer?.actions ?? {});
    setStatus("");
  }, []);

  useEffect(() => { load().catch(() => setStatus("Could not load user management.")); }, [load]);
  useEffect(() => () => scrollTimeoutRef.current && clearTimeout(scrollTimeoutRef.current), []);
  const handleScroll = () => { setIsScrolling(true); if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current); scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 700); };
  const visibleUsers = useMemo(() => users.filter((u) => matchesQuery([u.username, u.email, u.id, getHighestRole(u)], query)), [users, query]);
  const visibleRoles = useMemo(() => roles.filter((r) => matchesQuery([r.name, ...(r.permissions ?? [])], query)), [roles, query]);
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const selectedRole = roles.find((role) => role.name === selectedRoleName);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <Tabs tabs={[{ label: "Users", value: "users" }, { label: "Roles", value: "roles" }]} value={page} onChange={setPage} line="full" className="min-w-0 flex-1" />
        {page === "roles" ? <Button size="icon" variant={actions.canManageRoles ? "green" : "locked"} locked={!actions.canManageRoles} icon={plusIcon} aria-label="Create role" onClick={() => setCreatingRole(true)} /> : null}
      </div>
      <SearchBar variant="settings" placeholder={`Search ${page}`} label={`Search ${page}`} value={query} onChange={setQuery} showPreview={false} />
      {status ? <p className="text-sm text-muted">{status}</p> : null}
      {!status ? <div className="relative min-h-64 flex-1 before:absolute before:top-0 before:-left-4 before:-right-4 before:h-px before:bg-separator after:absolute after:bottom-0 after:-left-4 after:-right-4 after:h-px after:bg-separator"><div className={`scrollbar-while-scrolling h-full overflow-y-auto ${isScrolling ? "is-scrolling" : ""}`} onScroll={handleScroll}>{page === "users" ? visibleUsers.map((user, index) => <div key={user.id}>{index > 0 ? <Separator /> : null}<UserRow user={user} onClick={() => setSelectedUserId(user.id)} /></div>) : visibleRoles.map((role, index) => <div key={role.name}>{index > 0 ? <Separator /> : null}<article className="cursor-pointer px-4 py-3 hover:bg-card/50" onClick={() => setSelectedRoleName(role.name)}><h2 className="font-semibold text-heading">{role.name}</h2><p className="mt-1 text-sm text-muted">{(role.permissions ?? []).length} permissions</p></article></div>)}</div></div> : null}
      {!status && ((page === "users" && !visibleUsers.length) || (page === "roles" && !visibleRoles.length)) ? <p className="text-center text-sm text-muted">No {page} found.</p> : null}
      <UserDetailsModal user={selectedUser} roles={roles} actions={actions} onClose={() => setSelectedUserId(null)} onChanged={load} />
      <RoleDetailsModal role={selectedRole} actions={actions} onClose={() => setSelectedRoleName(null)} onChanged={load} />
      <CreateRoleModal open={creatingRole} actions={actions} onClose={() => setCreatingRole(false)} onCreated={async (roleName) => { await load(); setSelectedRoleName(roleName); }} />
    </div>
  );
}
