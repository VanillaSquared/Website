"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import plusIcon from "@/assets/icons/plus.svg";
import closeIcon from "@/assets/icons/x.svg";
import Button from "@/components/Button";
import ColorPicker from "@/components/ColorPicker";
import Modal from "@/components/Modal";
import MultiSelect from "@/components/MultiSelect";
import ProfilePicture from "@/components/ProfilePicture";
import SearchBar from "@/components/SearchBar";
import SaveConfirmation from "@/components/SaveConfirmation";
import Separator from "@/components/Separator";
import Tabs from "@/components/Tabs";
import Tag from "@/components/Tag";
import TextInput from "@/components/TextInput";
import useRetainedModalValue from "@/settings/useRetainedModalValue";

const ALL_PERMISSIONS = ["bug_panel", "design_test", "dev_options", "user_management", "audit_log", "manage_roles", "delete_user", "manage_user", "create_bugs", "view_bugs", "edit_bugs", "manage_bugs", "write_comments", "manage_comments", "bypass_limits"];
const PROTECTED_ROLE_NAMES = new Set(["not_signed_in", "owner", "developer", "support", "default"]);
const rolePriority = ["owner", "developer", "dev", "support", "default", "not_signed_in"];
const ROLE_OPTION_PREFIX = "role:";

function roleAuthorizationOptions(roles, excludedRole = null) {
  return [
    { label: "Permissions", options: ALL_PERMISSIONS.map((permission) => ({ label: permission, value: permission })) },
    {
      label: "Roles",
      options: sortRolesByHierarchy(roles)
        .filter((role) => role.name !== excludedRole)
        .map((role) => ({ label: formatRole(role.name), value: `${ROLE_OPTION_PREFIX}${role.name}` })),
    },
  ];
}

function roleAuthorizationSelection(permissions, includedRoles) {
  return [...permissions, ...includedRoles.map((role) => `${ROLE_OPTION_PREFIX}${role}`)];
}

function splitRoleAuthorization(selection) {
  return {
    permissions: selection.filter((value) => !value.startsWith(ROLE_OPTION_PREFIX)),
    includedRoles: selection.filter((value) => value.startsWith(ROLE_OPTION_PREFIX)).map((value) => value.slice(ROLE_OPTION_PREFIX.length)),
  };
}

function ModalSeparator({ bleed = false, className = "" }) {
  return <Separator className={`${bleed ? "-mx-6 w-[calc(100%+3rem)]" : "w-full"} ${className}`} />;
}

function getHighestRole(user, roleRanks = new Map()) {
  const roles = user.authorization?.roles ?? [];
  return [...roles].sort((a, b) => getRoleRank(a, roleRanks) - getRoleRank(b, roleRanks) || a.localeCompare(b))[0] ?? "default";
}

function formatRole(role) {
  if (role === "developer") return "dev";
  if (role === "not_signed_in") return "Not Signed in";
  return role;
}

function getRoleRank(role, roleRanks = new Map()) {
  if (roleRanks.has(role)) return roleRanks.get(role);
  const index = rolePriority.indexOf(role);
  return index === -1 ? rolePriority.length : index;
}

function sortRolesByHierarchy(roles) {
  return [...roles].sort((a, b) => Number(a.hierarchyOrder ?? getRoleRank(a.name)) - Number(b.hierarchyOrder ?? getRoleRank(b.name)) || a.name.localeCompare(b.name));
}

function moveItem(items, fromIndex, toIndex) {
  const next = [...items];
  const [item] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, item);
  return next;
}

function matchesQuery(values, query) {
  const normalizedQuery = query.trim().toLowerCase();
  return !normalizedQuery || values.filter(Boolean).some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function hasResolvedPermission(authorization, permission) {
  return Boolean(authorization?.permissionMap?.[permission] || authorization?.permissions?.includes?.(permission));
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
  const displayedUser = useRetainedModalValue(user);
  const [form, setForm] = useState({ username: displayedUser?.username ?? "", email: displayedUser?.email ?? "" });
  const [selectedRoles, setSelectedRoles] = useState(displayedUser?.authorization?.roles ?? []);
  const [selectedPermissions, setSelectedPermissions] = useState(displayedUser?.authorization?.individualPermissions ?? []);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const authorization = displayedUser?.authorization ?? {};
  const protectedUser = displayedUser?.isProtected;
  const canManageRoles = Boolean(actions.canManageRoles && !protectedUser);
  const canManageUser = Boolean(actions.canManageUser && !protectedUser);
  const canDeleteUser = Boolean(actions.canDeleteUser && !protectedUser);

  useEffect(() => {
    if (!user) return;

    setForm({ username: user.username ?? "", email: user.email ?? "" });
    setSelectedRoles(user.authorization?.roles ?? []);
    setSelectedPermissions(user.authorization?.individualPermissions ?? []);
    setError("");
  }, [user]);

  if (!displayedUser) return null;

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
        <ModalHeader title={displayedUser.username} subtitle={displayedUser.id} onClose={onClose} />
        <div className="space-y-5 p-6">
          {error ? <p className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p> : null}
          {protectedUser ? <p className="text-sm text-muted">This account is protected and cannot be changed.</p> : null}
          <div className="grid gap-3 sm:grid-cols-2">
            <TextInput label="Username" inputClassName="w-full" locked={!canManageUser || busy} value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} />
            <TextInput label="Email" type="email" inputClassName="w-full" locked={!canManageUser || busy} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <Button size="sm" variant={canManageUser ? "green" : "locked"} disabled={busy} locked={!canManageUser} onClick={() => mutate(() => api(`/api/users/${displayedUser.id}`, { method: "PATCH", body: JSON.stringify(form) }))}>Save user</Button>
          <ModalSeparator bleed />
          <MultiSelect label="Roles" options={sortRolesByHierarchy(roles).map((role) => ({ label: formatRole(role.name), value: role.name }))} value={selectedRoles} onChange={setSelectedRoles} locked={!canManageRoles || busy} placeholder="Select roles" />
          <MultiSelect label="Individual permissions" options={ALL_PERMISSIONS.map((permission) => ({ label: permission, value: permission }))} value={selectedPermissions} onChange={setSelectedPermissions} locked={!canManageRoles || busy} placeholder="Select permissions" />
          <Button size="sm" variant={canManageRoles ? "green" : "locked"} disabled={busy} locked={!canManageRoles} onClick={() => mutate(async () => {
            await syncUserRoles(displayedUser.id, authorization.roles ?? [], selectedRoles);
            await syncUserPermissions(displayedUser.id, authorization.individualPermissions ?? [], selectedPermissions);
          })}>Save perms</Button>
          <div><h3 className="font-semibold text-heading">Resolved permissions</h3><p className="mt-2 text-sm text-muted">{(authorization.permissions ?? []).join(", ") || "None"}</p></div>
          <ModalSeparator bleed />
          <Button size="sm" variant={canDeleteUser ? "red" : "locked"} disabled={busy} locked={!canDeleteUser} onClick={() => mutate(async () => { await api(`/api/users/${displayedUser.id}`, { method: "DELETE" }); onClose(); })}>Delete user</Button>
        </div>
      </div>
    </Modal>
  );
}

function RoleDetailsModal({ role, roles, actions, onClose, onChanged }) {
  const displayedRole = useRetainedModalValue(role);
  const [name, setName] = useState(displayedRole?.name ?? "");
  const [permissions, setPermissions] = useState(displayedRole?.permissions ?? []);
  const [includedRoles, setIncludedRoles] = useState(displayedRole?.includedRoles ?? []);
  const [color, setColor] = useState(displayedRole?.color ?? "#c269c2");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canEdit = Boolean(actions.canManageRoles && displayedRole?.manageable);
  const canDelete = Boolean(canEdit && !PROTECTED_ROLE_NAMES.has(displayedRole?.name));

  useEffect(() => {
    if (!role) return;

    setName(role.name ?? "");
    setPermissions(role.permissions ?? []);
    setIncludedRoles(role.includedRoles ?? []);
    setColor(role.color ?? "#c269c2");
    setError("");
  }, [role]);

  if (!displayedRole) return null;

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
        <ModalHeader title={`Role: ${displayedRole.name}`} onClose={onClose} />
        <div className="space-y-5 p-6">
          {error ? <p className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p> : null}
          {PROTECTED_ROLE_NAMES.has(displayedRole.name) ? <p className="text-sm text-muted">This built-in role cannot be deleted.</p> : null}
          <TextInput label="Role name" locked={!canEdit || busy || PROTECTED_ROLE_NAMES.has(displayedRole.name)} value={name} onChange={(e) => setName(e.target.value)} />
          <ColorPicker label="Role color" locked={!canEdit || busy} value={color} onChange={setColor} />
          <MultiSelect
            label="Permissions"
            options={roleAuthorizationOptions(roles, displayedRole.name)}
            value={roleAuthorizationSelection(permissions, includedRoles)}
            onChange={(selection) => {
              const authorization = splitRoleAuthorization(selection);
              setPermissions(authorization.permissions);
              setIncludedRoles(authorization.includedRoles);
            }}
            locked={!canEdit || busy}
            placeholder="Select permissions or roles"
          />
          <div className="flex gap-2">
            <Button size="sm" variant={canEdit ? "green" : "locked"} disabled={busy} locked={!canEdit} onClick={() => mutate(async () => {
              const target = (await api(`/api/roles/${encodeURIComponent(displayedRole.name)}`, { method: "PATCH", body: JSON.stringify({ name, color }) })).role.name;
              await api(`/api/roles/${encodeURIComponent(target)}/permissions`, { method: "PUT", body: JSON.stringify({ permissions, includedRoles }) });
            })}>Save role</Button>
            <Button size="sm" variant={canDelete ? "red" : "locked"} disabled={busy} locked={!canDelete} onClick={() => mutate(async () => { await api(`/api/roles/${encodeURIComponent(displayedRole.name)}`, { method: "DELETE" }); onClose(); })}>Delete role</Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}

function CreateRoleModal({ open, roles, actions, onClose, onCreated }) {
  const [name, setName] = useState("");
  const [permissions, setPermissions] = useState([]);
  const [includedRoles, setIncludedRoles] = useState([]);
  const [color, setColor] = useState("#c269c2");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const canCreate = Boolean(actions.canManageRoles);

  useEffect(() => {
    if (open) {
      setName("");
      setPermissions([]);
      setIncludedRoles([]);
      setColor("#c269c2");
      setError("");
    }
  }, [open]);

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const data = await api("/api/roles", { method: "POST", body: JSON.stringify({ name, permissions, includedRoles, color }) });
      await onCreated(data.role.name);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal open={open} onClose={onClose} variant="default">
      <div className="text-soft">
        <ModalHeader title="Create role" onClose={onClose} />
        <div className="space-y-4 p-5">
          {error ? <p className="rounded-lg border border-red-500/30 px-3 py-2 text-sm text-red-300">{error}</p> : null}
          <TextInput label="Role name" sampleText="moderator" locked={!canCreate || busy} value={name} onChange={(event) => setName(event.target.value)} />
          <ColorPicker label="Role color" locked={!canCreate || busy} value={color} onChange={setColor} />
          <MultiSelect
            label="Initial permissions"
            options={roleAuthorizationOptions(roles)}
            value={roleAuthorizationSelection(permissions, includedRoles)}
            onChange={(selection) => {
              const authorization = splitRoleAuthorization(selection);
              setPermissions(authorization.permissions);
              setIncludedRoles(authorization.includedRoles);
            }}
            locked={!canCreate || busy}
            placeholder="Select permissions or roles"
          />
          <Button size="sm" variant={canCreate ? "green" : "locked"} disabled={busy} locked={!canCreate} onClick={submit}>Create role</Button>
        </div>
      </div>
    </Modal>
  );
}

function UserRow({ user, roleRanks, roleColors, onClick }) {
  const highestRole = getHighestRole(user, roleRanks);
  return (
    <article className="cursor-pointer px-4 py-4 hover:bg-card/50" onClick={onClick}>
      <div className="flex items-start gap-4">
        <ProfilePicture className="mt-0.5 border-accent/40 bg-accent/15" size="sm" username={user.username} email={user.email} />
        <div className="min-w-0 flex-1">
          <Tag color={roleColors.get(highestRole)}>{formatRole(highestRole)}</Tag>
          <h2 className="mt-2 text-base font-semibold text-heading">{user.username || "Unnamed user"}</h2>
        </div>
      </div>
    </article>
  );
}

function RoleRow({ role, canDrag, dragging, onClick, onDragStart, onDragEnter, onDragEnd }) {
  return (
    <article
      className={`px-4 py-4 transition ${canDrag ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"} ${dragging ? "bg-card/70 opacity-70" : "hover:bg-card/50"}`}
      draggable={canDrag}
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnter={onDragEnter}
      onDragOver={canDrag ? (event) => event.preventDefault() : undefined}
      onDragEnd={onDragEnd}
      title={canDrag ? "Drag to change role hierarchy" : undefined}
    >
      <div className="flex items-center gap-4">
        {canDrag ? <span className="select-none text-lg leading-none text-muted" aria-hidden="true">⋮⋮</span> : null}
        <div className="min-w-0">
          <Tag color={role.color}>{formatRole(role.name)}</Tag>
          <p className="mt-2 text-sm text-muted">{(role.permissions ?? []).length} permissions{role.includedRoles?.length ? ` · ${role.includedRoles.length} roles` : ""}</p>
        </div>
      </div>
    </article>
  );
}

export default function UserManagementSettings({ permissions }) {
  const canViewUsers = hasResolvedPermission(permissions, "user_management");
  const canViewRoles = hasResolvedPermission(permissions, "manage_roles");
  const [page, setPage] = useState(canViewUsers ? "users" : "roles");
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [actions, setActions] = useState({});
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading...");
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedRoleName, setSelectedRoleName] = useState(null);
  const [creatingRole, setCreatingRole] = useState(false);
  const [draggingRoleName, setDraggingRoleName] = useState(null);
  const [roleHierarchyDirty, setRoleHierarchyDirty] = useState(false);
  const [roleHierarchySaving, setRoleHierarchySaving] = useState(false);
  const [roleHierarchyError, setRoleHierarchyError] = useState("");
  const scrollTimeoutRef = useRef(null);
  const draggedRoleNameRef = useRef(null);
  const currentRoleOrderRef = useRef([]);
  const roleOrderChangedRef = useRef(false);
  const suppressRoleClickRef = useRef(false);
  const [isScrolling, setIsScrolling] = useState(false);
  const tabs = useMemo(() => [
    ...(canViewUsers ? [{ label: "Users", value: "users" }] : []),
    ...(canViewRoles ? [{ label: "Roles", value: "roles" }] : []),
  ], [canViewRoles, canViewUsers]);

  const load = useCallback(async () => {
    const [userData, roleData] = await Promise.all([
      canViewUsers ? api("/api/users") : Promise.resolve(null),
      canViewRoles ? api("/api/roles") : Promise.resolve(null),
    ]);
    setUsers(Array.isArray(userData?.users) ? userData.users : []);
    setRoles(Array.isArray(roleData?.roles) ? roleData.roles : []);
    setActions({ ...(userData?.viewer?.actions ?? {}), canManageRoles: canViewRoles });
    setRoleHierarchyDirty(false);
    setRoleHierarchyError("");
    setStatus("");
  }, [canViewRoles, canViewUsers]);

  useEffect(() => {
    if (page === "users" && !canViewUsers) setPage("roles");
    if (page === "roles" && !canViewRoles) setPage("users");
  }, [canViewRoles, canViewUsers, page]);
  useEffect(() => { load().catch(() => setStatus("Could not load user management.")); }, [load]);
  useEffect(() => () => scrollTimeoutRef.current && clearTimeout(scrollTimeoutRef.current), []);
  const handleScroll = () => { setIsScrolling(true); if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current); scrollTimeoutRef.current = setTimeout(() => setIsScrolling(false), 700); };
  const sortedRoles = useMemo(() => sortRolesByHierarchy(roles), [roles]);
  const roleRanks = useMemo(() => new Map(sortedRoles.map((role, index) => [role.name, index])), [sortedRoles]);
  const roleColors = useMemo(() => new Map(sortedRoles.map((role) => [role.name, role.color])), [sortedRoles]);
  const visibleUsers = useMemo(() => users.filter((u) => matchesQuery([u.username, u.email, u.id, getHighestRole(u, roleRanks)], query)), [users, roleRanks, query]);
  const visibleRoles = useMemo(() => sortedRoles.filter((r) => matchesQuery([r.name, formatRole(r.name), ...(r.permissions ?? []), ...(r.includedRoles ?? [])], query)), [sortedRoles, query]);
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const selectedRole = roles.find((role) => role.name === selectedRoleName);
  currentRoleOrderRef.current = sortedRoles.map((role) => role.name);

  function handleRoleDragStart(roleName, event) {
    if (!actions.canManageRoles) return;
    draggedRoleNameRef.current = roleName;
    roleOrderChangedRef.current = false;
    suppressRoleClickRef.current = false;
    setDraggingRoleName(roleName);
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", roleName);
  }

  function handleRoleDragEnter(targetRoleName) {
    const draggedRoleName = draggedRoleNameRef.current;
    if (!actions.canManageRoles || !draggedRoleName || draggedRoleName === targetRoleName) return;
    setRoles((currentRoles) => {
      const ordered = sortRolesByHierarchy(currentRoles);
      if (!ordered.find((role) => role.name === targetRoleName)?.manageable) return currentRoles;
      const fromIndex = ordered.findIndex((role) => role.name === draggedRoleName);
      const toIndex = ordered.findIndex((role) => role.name === targetRoleName);
      if (fromIndex === -1 || toIndex === -1 || fromIndex === toIndex) return currentRoles;
      roleOrderChangedRef.current = true;
      suppressRoleClickRef.current = true;
      const nextRoles = moveItem(ordered, fromIndex, toIndex).map((role, index) => ({ ...role, hierarchyOrder: index }));
      currentRoleOrderRef.current = nextRoles.map((role) => role.name);
      return nextRoles;
    });
  }

  function handleRoleDragEnd() {
    const changed = roleOrderChangedRef.current;
    draggedRoleNameRef.current = null;
    roleOrderChangedRef.current = false;
    setDraggingRoleName(null);
    if (changed) {
      setRoleHierarchyDirty(true);
      setRoleHierarchyError("");
    }
  }

  async function saveRoleHierarchy() {
    setRoleHierarchySaving(true);
    setRoleHierarchyError("");
    try {
      const data = await api("/api/roles", { method: "PUT", body: JSON.stringify({ roles: currentRoleOrderRef.current }) });
      setRoles(Array.isArray(data.roles) ? data.roles : []);
      setRoleHierarchyDirty(false);
    } catch (err) {
      setRoleHierarchyError(err.message || "Could not update role hierarchy.");
    } finally {
      setRoleHierarchySaving(false);
    }
  }

  async function resetRoleHierarchy() {
    setRoleHierarchySaving(true);
    try {
      await load();
    } finally {
      setRoleHierarchySaving(false);
    }
  }

  function handleRoleClick(roleName) {
    if (suppressRoleClickRef.current) {
      suppressRoleClickRef.current = false;
      return;
    }
    setSelectedRoleName(roleName);
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3">
        <Tabs tabs={tabs} value={page} onChange={setPage} line="full" className="min-w-0 flex-1" />
        {page === "roles" ? <Button size="icon" variant={actions.canManageRoles ? "green" : "locked"} locked={!actions.canManageRoles} icon={plusIcon} aria-label="Create role" onClick={() => setCreatingRole(true)} /> : null}
      </div>
      <SearchBar variant="settings" placeholder={`Search ${page}`} label={`Search ${page}`} value={query} onChange={setQuery} showPreview={false} />
      {page === "roles" ? <SaveConfirmation show={roleHierarchyDirty} busy={roleHierarchySaving} onReset={resetRoleHierarchy} onSave={saveRoleHierarchy} /> : null}
      {roleHierarchyError ? <p className="text-sm text-red-300">{roleHierarchyError}</p> : null}
      {status ? <p className="text-sm text-muted">{status}</p> : null}
      {!status ? <div className="relative min-h-64 flex-1 before:absolute before:top-0 before:-left-4 before:-right-4 before:h-px before:bg-separator after:absolute after:bottom-0 after:-left-4 after:-right-4 after:h-px after:bg-separator"><div className={`scrollbar-while-scrolling h-full overflow-y-auto ${isScrolling ? "is-scrolling" : ""}`} onScroll={handleScroll}>{page === "users" ? visibleUsers.map((user, index) => <div key={user.id}>{index > 0 ? <Separator /> : null}<UserRow user={user} roleRanks={roleRanks} roleColors={roleColors} onClick={() => setSelectedUserId(user.id)} /></div>) : visibleRoles.map((role, index) => <div key={role.name}>{index > 0 ? <Separator /> : null}<RoleRow role={role} canDrag={Boolean(actions.canManageRoles && role.manageable)} dragging={draggingRoleName === role.name} onClick={() => handleRoleClick(role.name)} onDragStart={(event) => handleRoleDragStart(role.name, event)} onDragEnter={() => handleRoleDragEnter(role.name)} onDragEnd={handleRoleDragEnd} /></div>)}</div></div> : null}
      {!status && ((page === "users" && !visibleUsers.length) || (page === "roles" && !visibleRoles.length)) ? <p className="text-center text-sm text-muted">No {page} found.</p> : null}
      <UserDetailsModal user={selectedUser} roles={roles} actions={actions} onClose={() => setSelectedUserId(null)} onChanged={load} />
      <RoleDetailsModal role={selectedRole} roles={roles} actions={actions} onClose={() => setSelectedRoleName(null)} onChanged={load} />
      <CreateRoleModal open={creatingRole} roles={roles} actions={actions} onClose={() => setCreatingRole(false)} onCreated={async (roleName) => { await load(); setSelectedRoleName(roleName); }} />
    </div>
  );
}
