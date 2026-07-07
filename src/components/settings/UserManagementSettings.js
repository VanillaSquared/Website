"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import ProfilePicture from "@/components/ProfilePicture";
import SearchBar from "@/components/SearchBar";
import Separator from "@/components/Separator";
import Tag from "@/components/Tag";

function getJoinedDate(user) {
  if (!user.createdAt) {
    return "Unknown join date";
  }

  const date = new Date(user.createdAt);

  if (Number.isNaN(date.getTime())) {
    return "Unknown join date";
  }

  return `Joined ${date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
}

function userMatchesQuery(user, query) {
  const normalizedQuery = query.trim().toLowerCase();

  if (!normalizedQuery) {
    return true;
  }

  return [
    user.username,
    user.email,
    user.id,
    ...(user.authorization?.roles ?? []),
    ...(user.authorization?.permissions ?? []),
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalizedQuery));
}

function formatPermission(permission) {
  return String(permission)
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function UserManagementSettings() {
  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("Loading users...");
  const [isScrolling, setIsScrolling] = useState(false);
  const scrollTimeoutRef = useRef(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/users", { cache: "no-store", credentials: "same-origin" })
      .then((response) => response.ok ? response.json() : Promise.reject(response))
      .then((data) => {
        if (!cancelled) {
          setUsers(Array.isArray(data.users) ? data.users : []);
          setStatus("");
        }
      })
      .catch(() => {
        if (!cancelled) {
          setStatus("Could not load users.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const visibleUsers = useMemo(() => users.filter((user) => userMatchesQuery(user, query)), [users, query]);

  const handleScroll = useCallback(() => {
    setIsScrolling(true);

    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false);
      scrollTimeoutRef.current = null;
    }, 700);
  }, []);

  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex h-full min-h-0 flex-col gap-5">
      <div className="shrink-0 space-y-4">
        <div>
          <h3 className="text-2xl font-bold text-heading">User Management</h3>
        </div>

        <SearchBar
          variant="settings"
          placeholder="Search users"
          label="Search users"
          value={query}
          onChange={setQuery}
          showPreview={false}
        />
      </div>

      {status ? <p className="text-sm text-muted">{status}</p> : null}

      {!status && !visibleUsers.length ? (
        <div className="border-y border-divider px-4 py-8 text-center">
          <p className="text-lg font-semibold text-heading">No users found</p>
          <p className="mt-2 text-sm text-muted">Try adjusting your search.</p>
        </div>
      ) : null}

      {!status && visibleUsers.length ? (
        <div className="relative min-h-64 flex-1 before:absolute before:top-0 before:-left-4 before:-right-4 before:h-px before:bg-separator after:absolute after:bottom-0 after:-left-4 after:-right-4 after:h-px after:bg-separator">
          <div
            className={`scrollbar-while-scrolling h-full overflow-y-auto ${isScrolling ? "is-scrolling" : ""}`}
            onScroll={handleScroll}
          >
            {visibleUsers.map((user, index) => (
              <div key={user.id}>
                {index > 0 ? <Separator /> : null}
                <article className="px-4 py-3">
                  <div className="flex gap-3">
                    <ProfilePicture
                      className="mt-0.5 border-accent/40 bg-accent/15"
                      size="sm"
                      src={user.profilePicture ?? user.avatarUrl ?? user.image}
                      username={user.username}
                      email={user.email}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          {(user.authorization?.permissions?.length ? user.authorization.permissions : ["No permissions"]).map((permission) => (
                            <Tag key={permission} variant={permission === "No permissions" ? "subtle" : "accent"}>
                              {formatPermission(permission)}
                            </Tag>
                          ))}
                          {user.authorization?.roles?.map((role) => (
                            <Tag key={role} variant="subtle">{role}</Tag>
                          ))}
                        </div>
                        <div className="min-w-0">
                          <h2 className="text-base font-semibold text-heading">{user.username || "Unnamed user"}</h2>
                          <p className="mt-1 truncate text-sm leading-5 text-muted">{user.email || "No email"}</p>
                        </div>
                      </div>
                      <p className="mt-2 truncate text-xs text-subtle">{getJoinedDate(user)}</p>
                    </div>
                  </div>
                </article>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
