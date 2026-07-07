"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ProfilePicture from "@/components/ProfilePicture";
import SearchBar from "@/components/SearchBar";
import Separator from "@/components/Separator";
import Tag from "@/components/Tag";

const ALL_PERMISSIONS = ["bug_panel", "design_test", "dev_options", "user_management", "manage_roles", "delete_user", "manage_user"];
const rolePriority = ["owner", "developer", "dev", "support", "default"];

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

function ManagementPager({ page, setPage }) {
  return (
    <div className="flex gap-2">
      {["users", "roles"].map((item) => (
        <Button key={item} size="sm" variant={page === item ? "primary" : "secondary"} onClick={() => setPage(item)}>
          {item[0].toUpperCase() + item.slice(1)}
        </Button>
      ))}
    </div>
  );
}

function PermissionEditor({ selected, disabled, onToggle }) {
  return (
    <div className="grid gap-2 sm:grid-cols-2">
      {ALL_PERMISSIONS.map((permission) => (
        <label key={permission} className="flex items-center gap-2 rounded-lg border border-divider px-3 py-2 text-sm text-soft">
          <input type="checkbox" checked={selected.includes(permission)} disabled={disabled} onChange={() => onToggle(permission)} />
          {permission}
        </label>
      ))}
    </div>
  );
}

function UserDetailsModal({ user, roles, actions, onClose, onChanged }) {
  const [form, setForm] = useState({ username: user?.username ?? "", email: user?.email ?? "" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const authorization = user?.authorization ?? {};
  const protectedUser = user?.isProtected;
  const canManageRoles = actions.canManageRoles && !protectedUser;
  const canManageUser = actions.canManageUser && !protectedUser;
  const canDeleteUser = actions.canDeleteUser && !protectedUser;

  useEffect(() => setForm({ username: user?.username ?? "", email: user?.email ?? "" }), [user]);
  if (!user) return null;

  async function mutate(work) {
    setBusy(true); setError("");
    try { await work(); await onChanged(); } catch (err) { setError(err.message); } finally { setBusy(false); }
  }

  const toggleRole = (role) => mutate(() => authorization.roles?.includes(role)
    ? api(`/api/users/${user.id}/roles/${encodeURIComponent(role)}`, { method: "DELETE" })
    : api(`/api/users/${user.id}/roles`, { method: "POST", body: JSON.stringify({ role }) }));
  const togglePermission = (permission) => mutate(() => authorization.individualPermissions?.includes(permission)
    ? api(`/api/users/${user.id}/permissions/${encodeURIComponent(permission)}`, { method: "DELETE" })
    : api(`/api/users/${user.id}/permissions`, { method: "POST", body: JSON.stringify({ permission }) }));

  return (
    <Modal open={Boolean(user)} onClose={onClose} variant="wide">
      <div className="space-y-5 p-6 text-soft">
        <div className="flex items-start justify-between gap-4">
          <div><h2 className="text-xl font-semibold text-heading">{user.username}</h2><p className="text-sm text-muted">{user.id}</p></div>
          <Button size="sm" variant="tertiary" onClick={onClose}>Close</Button>
        </div>
        {error ? <p className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p> : null}
        {protectedUser ? <p className="text-sm text-muted">This account is protected and cannot be changed.</p> : null}
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm">Username<input className="mt-1 w-full rounded-lg border border-divider bg-card px-3 py-2" disabled={!canManageUser || busy} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} /></label>
          <label className="text-sm">Email<input className="mt-1 w-full rounded-lg border border-divider bg-card px-3 py-2" disabled={!canManageUser || busy} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
        </div>
        {canManageUser ? <Button size="sm" disabled={busy} onClick={() => mutate(() => api(`/api/users/${user.id}`, { method: "PATCH", body: JSON.stringify(form) }))}>Save user</Button> : null}
        <Separator />
        <div><h3 className="font-semibold text-heading">Roles</h3><div className="mt-2 flex flex-wrap gap-2">{roles.map((role) => <Button key={role.name} size="sm" variant={authorization.roles?.includes(role.name) ? "primary" : "secondary"} disabled={!canManageRoles || busy} onClick={() => toggleRole(role.name)}>{role.name}</Button>)}</div></div>
        <div><h3 className="font-semibold text-heading">Individual permissions</h3><div className="mt-2"><PermissionEditor selected={authorization.individualPermissions ?? []} disabled={!canManageRoles || busy} onToggle={togglePermission} /></div></div>
        <div><h3 className="font-semibold text-heading">Resolved permissions</h3><p className="mt-2 text-sm text-muted">{(authorization.permissions ?? []).join(", ") || "None"}</p></div>
        <p className="text-xs text-subtle">Created: {String(user.createdAt ?? "Unknown")} · Updated: {String(user.updatedAt ?? "Unknown")}</p>
        {canDeleteUser ? <Button size="sm" variant="danger" disabled={busy} onClick={() => mutate(async () => { await api(`/api/users/${user.id}`, { method: "DELETE" }); onClose(); })}>Delete user</Button> : null}
      </div>
    </Modal>
  );
}

function RoleDetailsModal({ role, actions, onClose, onChanged }) {
  const [name, setName] = useState(role?.name ?? "");
  const [permissions, setPermissions] = useState(role?.permissions ?? []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canEdit = actions.canManageRoles;
  useEffect(() => { setName(role?.name ?? ""); setPermissions(role?.permissions ?? []); }, [role]);
  if (!role) return null;
  async function mutate(work) { setBusy(true); setError(""); try { await work(); await onChanged(); } catch (err) { setError(err.message); } finally { setBusy(false); } }
  const toggle = (permission) => setPermissions((current) => current.includes(permission) ? current.filter((item) => item !== permission) : [...current, permission].sort());
  return (
    <Modal open={Boolean(role)} onClose={onClose} variant="wide">
      <div className="space-y-5 p-6 text-soft">
        <div className="flex justify-between gap-4"><h2 className="text-xl font-semibold text-heading">Role: {role.name}</h2><Button size="sm" variant="tertiary" onClick={onClose}>Close</Button></div>
        {error ? <p className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p> : null}
        <label className="block text-sm">Role name<input className="mt-1 w-full rounded-lg border border-divider bg-card px-3 py-2" disabled={!canEdit || busy} value={name} onChange={(e) => setName(e.target.value)} /></label>
        <PermissionEditor selected={permissions} disabled={!canEdit || busy} onToggle={toggle} />
        {canEdit ? <div className="flex gap-2"><Button size="sm" disabled={busy} onClick={() => mutate(async () => { const target = name !== role.name ? (await api(`/api/roles/${encodeURIComponent(role.name)}`, { method: "PATCH", body: JSON.stringify({ name }) })).role.name : role.name; await api(`/api/roles/${encodeURIComponent(target)}/permissions`, { method: "PUT", body: JSON.stringify({ permissions }) }); })}>Save role</Button><Button size="sm" variant="danger" disabled={busy} onClick={() => mutate(async () => { await api(`/api/roles/${encodeURIComponent(role.name)}`, { method: "DELETE" }); onClose(); })}>Delete role</Button></div> : null}
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

  async function createRole() {
    const name = window.prompt("Role name");
    if (!name) return;
    try { const data = await api("/api/roles", { method: "POST", body: JSON.stringify({ name, permissions: [] }) }); await load(); setSelectedRoleName(data.role.name); } catch (error) { window.alert(error.message); }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3"><ManagementPager page={page} setPage={setPage} />{page === "roles" && actions.canManageRoles ? <Button size="sm" onClick={createRole}>+ Role</Button> : null}</div>
      <SearchBar variant="settings" placeholder={`Search ${page}`} label={`Search ${page}`} value={query} onChange={setQuery} showPreview={false} />
      {status ? <p className="text-sm text-muted">{status}</p> : null}
      {!status ? <div className="relative min-h-64 flex-1 before:absolute before:top-0 before:-left-4 before:-right-4 before:h-px before:bg-separator after:absolute after:bottom-0 after:-left-4 after:-right-4 after:h-px after:bg-separator"><div className={`scrollbar-while-scrolling h-full overflow-y-auto ${isScrolling ? "is-scrolling" : ""}`} onScroll={handleScroll}>{page === "users" ? visibleUsers.map((user, index) => <div key={user.id}>{index > 0 ? <Separator /> : null}<UserRow user={user} onClick={() => setSelectedUserId(user.id)} /></div>) : visibleRoles.map((role, index) => <div key={role.name}>{index > 0 ? <Separator /> : null}<article className="cursor-pointer px-4 py-3 hover:bg-card/50" onClick={() => setSelectedRoleName(role.name)}><h2 className="font-semibold text-heading">{role.name}</h2><p className="mt-1 text-sm text-muted">{(role.permissions ?? []).length} permissions</p></article></div>)}</div></div> : null}
      {!status && ((page === "users" && !visibleUsers.length) || (page === "roles" && !visibleRoles.length)) ? <p className="text-center text-sm text-muted">No {page} found.</p> : null}
      <UserDetailsModal user={selectedUser} roles={roles} actions={actions} onClose={() => setSelectedUserId(null)} onChanged={load} />
      <RoleDetailsModal role={selectedRole} actions={actions} onClose={() => setSelectedRoleName(null)} onChanged={load} />
    </div>
  );
}
