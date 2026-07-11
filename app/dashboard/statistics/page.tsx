"use client";

import { useState, useEffect, useRef } from "react";
import styles from "./statistics.module.css";

type Role = "all" | "student" | "instructor" | "manager" | "admin";

interface UserProfile {
  age?: number;
  gender?: string;
  courses?: string[];
  groups?: string[];
  courseProgress?: string[];
  specialization?: string;
  experienceYears?: string;
  status?: string;
  coursesCanTeach?: string;
}

interface User {
  _id: string;
  name: string;
  email?: string;
  phone: string;
  role: string;
  profileModel: string | null;
  createdAt: string;
  updatedAt: string;
  googleId?: string;
  avatar?: string;
  profileRef?: UserProfile | string | null;
}

interface Stats {
  total: number;
  students: number;
  instructors: number;
  managers: number;
  admins: number;
  users: number;
  googleSignups: number;
  duplicatePhones: number;
}

function useCountUp(target: number, duration = 1200) {
  const [count, setCount] = useState(0);
  const raf = useRef<number>(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const p = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setCount(Math.floor(ease * target));
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration]);
  return count;
}

function StatCard({
  label,
  value,
  icon,
  accent,
  sub,
}: {
  label: string;
  value: number;
  icon: string;
  accent: string;
  sub?: string;
}) {
  const display = useCountUp(value);
  return (
    <div className={styles.statCard} style={{ "--accent": accent } as React.CSSProperties}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statValue}>{display.toLocaleString()}</div>
      <div className={styles.statLabel}>{label}</div>
      {sub && <div className={styles.statSub}>{sub}</div>}
      <div className={styles.statGlow} />
    </div>
  );
}

function getRoleColor(role: string) {
  switch (role) {
    case "student": return "#22C55E";
    case "instructor": return "#3B82F6";
    case "manager": return "#F59E0B";
    case "admin": return "#EF4444";
    default: return "#8B5CF6";
  }
}

function getRoleIcon(role: string) {
  switch (role) {
    case "student": return "🎓";
    case "instructor": return "👨‍🏫";
    case "manager": return "🛡️";
    case "admin": return "⚙️";
    default: return "👤";
  }
}

function getInstructorStatus(user: User): string | null {
  if (user.role !== "instructor") return null;
  const ref = user.profileRef;
  if (ref && typeof ref === "object" && "status" in ref) return ref.status ?? null;
  return null;
}

function getStudentCourseCount(user: User): number {
  if (user.role !== "student") return 0;
  const ref = user.profileRef;
  if (ref && typeof ref === "object" && "courses" in ref) return ref.courses?.length ?? 0;
  return 0;
}

interface DeleteTarget {
  id: string;
  name: string;
  role: string;
}

function ConfirmModal({
  target,
  onConfirm,
  onCancel,
  deleting,
}: {
  target: DeleteTarget;
  onConfirm: () => void;
  onCancel: () => void;
  deleting: boolean;
}) {
  return (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalIcon}>🗑️</div>
        <h2 className={styles.modalTitle}>Delete User?</h2>
        <p className={styles.modalBody}>
          You're about to permanently delete{" "}
          <span className={styles.modalName}>{target.name}</span>{" "}
          <span
            className={styles.modalRole}
            style={{ "--badge-color": getRoleColor(target.role) } as React.CSSProperties}
          >
            {target.role}
          </span>
          . This action cannot be undone.
        </p>
        <div className={styles.modalActions}>
          <button className={styles.cancelBtn} onClick={onCancel} disabled={deleting}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm} disabled={deleting}>
            {deleting ? <span className={styles.btnSpinner} /> : null}
            {deleting ? "Deleting…" : "Yes, Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const [activeRole, setActiveRole] = useState<Role>("all");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState<{ msg: string; ok: boolean } | null>(null);
  const [stats, setStats] = useState<Stats>({
    total: 0, students: 0, instructors: 0, managers: 0, admins: 0, users: 0,
    googleSignups: 0, duplicatePhones: 0,
  });

//   const baseUrl = "http://localhost:4000/api/users";
  const baseUrl = "https://code-minds-website.vercel.app/";
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);
      try {
        const endpoint =
          activeRole === "all"
            ? `${baseUrl}api/users/all`
            : `${baseUrl}api/users/${activeRole}`;
        const res = await fetch(endpoint);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: User[] = data.users ?? [];
        setUsers(list);

        // Compute stats from "all" only when viewing all
        if (activeRole === "all") recalcStats(list);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to fetch");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [activeRole]);

  const recalcStats = (list: User[]) => {
    const phoneCounts: Record<string, number> = {};
    list.forEach((u) => {
      if (u.phone) phoneCounts[u.phone] = (phoneCounts[u.phone] ?? 0) + 1;
    });
    const dupPhones = Object.values(phoneCounts).filter((c) => c > 1).length;
    setStats({
      total: list.length,
      students: list.filter((u) => u.role === "student").length,
      instructors: list.filter((u) => u.role === "instructor").length,
      managers: list.filter((u) => u.role === "manager").length,
      admins: list.filter((u) => u.role === "admin").length,
      users: list.filter((u) => u.role === "user").length,
      googleSignups: list.filter((u) => !!u.googleId).length,
      duplicatePhones: dupPhones,
    });
  };

  const showToast = (msg: string, ok: boolean) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 3000);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${baseUrl}api/users/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const updated = users.filter((u) => u._id !== deleteTarget.id);
      setUsers(updated);
      if (activeRole === "all") recalcStats(updated);
      showToast(`"${deleteTarget.name}" deleted successfully.`, true);
    } catch (e: unknown) {
      showToast(e instanceof Error ? e.message : "Delete failed.", false);
    } finally {
      setDeleting(false);
      setDeleteTarget(null);
    }
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      (u.email ?? "").toLowerCase().includes(q) ||
      u.phone.includes(q) ||
      u._id.includes(q)
    );
  });

  const tabs: { role: Role; label: string; icon: string }[] = [
    { role: "all", label: "All Users", icon: "◉" },
    { role: "student", label: "Students", icon: "🎓" },
    { role: "instructor", label: "Instructors", icon: "👨‍🏫" },
    { role: "manager", label: "Managers", icon: "🛡️" },
    { role: "admin", label: "Admins", icon: "⚙️" },
  ];

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${toast.ok ? styles.toastOk : styles.toastErr}`}>
          {toast.ok ? "✓" : "✕"} {toast.msg}
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <ConfirmModal
          target={deleteTarget}
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteTarget(null)}
          deleting={deleting}
        />
      )}
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.logo}>
            <span className={styles.logoMark}>CM</span>
          </div>
          <div>
            <h1 className={styles.heading}>User Statistics</h1>
            <p className={styles.subheading}>CodeMinds Platform · Live Data</p>
          </div>
        </div>
        <div className={styles.headerRight}>
          <div className={styles.liveDot} />
          <span className={styles.liveLabel}>Live</span>
        </div>
      </header>

      {/* KPI Cards — only shown on "all" tab */}
      {activeRole === "all" && (
        <section className={styles.statsGrid}>
          <StatCard label="Total Users" value={stats.total} icon="◉" accent="#22C55E" />
          <StatCard label="Students" value={stats.students} icon="🎓" accent="#22C55E" sub={`${stats.total ? Math.round((stats.students / stats.total) * 100) : 0}% of total`} />
          <StatCard label="Instructors" value={stats.instructors} icon="👨‍🏫" accent="#3B82F6" />
          <StatCard label="Google Signups" value={stats.googleSignups} icon="G" accent="#F59E0B" sub="OAuth users" />
          <StatCard label="Duplicate Phones" value={stats.duplicatePhones} icon="⚠" accent="#EF4444" sub="unique numbers used 2×+" />
          <StatCard label="Unassigned (user)" value={stats.users} icon="👤" accent="#8B5CF6" sub="no role assigned" />
        </section>
      )}

      {/* Role Tabs */}
      <nav className={styles.tabs}>
        {tabs.map((t) => (
          <button
            key={t.role}
            className={`${styles.tab} ${activeRole === t.role ? styles.tabActive : ""}`}
            onClick={() => { setActiveRole(t.role); setSearch(""); }}
            style={{ "--tab-accent": t.role === "all" ? "#22C55E" : getRoleColor(t.role) } as React.CSSProperties}
          >
            <span className={styles.tabIcon}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      {/* Search + Count bar */}
      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <span className={styles.searchIcon}>⌕</span>
          <input
            className={styles.search}
            placeholder="Search by name, email, phone, or ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className={styles.clearSearch} onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        <div className={styles.countBadge}>
          {loading ? "Loading…" : `${filtered.length} result${filtered.length !== 1 ? "s" : ""}`}
        </div>
      </div>

      {/* Table */}
      <div className={styles.tableWrap}>
        {loading ? (
          <div className={styles.emptyState}>
            <div className={styles.spinner} />
            <p>Fetching data…</p>
          </div>
        ) : error ? (
          <div className={styles.emptyState}>
            <span className={styles.errorIcon}>⚠</span>
            <p className={styles.errorText}>{error}</p>
            <p className={styles.errorHint}>Make sure the API server is running at localhost:4000</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className={styles.emptyState}>
            <span style={{ fontSize: 40 }}>🔍</span>
            <p>No users match your search.</p>
          </div>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Contact</th>
                <th>Role</th>
                {activeRole === "all" || activeRole === "instructor" ? <th>Status / Info</th> : null}
                {activeRole === "student" ? <th>Courses</th> : null}
                <th>Joined</th>
                <th>Auth</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user, i) => {
                const instrStatus = getInstructorStatus(user);
                const courseCnt = getStudentCourseCount(user);
                const joined = new Date(user.createdAt);
                const joinStr = joined.toLocaleDateString("en-GB", {
                  day: "2-digit", month: "short", year: "numeric",
                });
                return (
                  <tr key={user._id} className={styles.row}>
                    <td className={styles.rowNum}>{i + 1}</td>
                    <td>
                      <div className={styles.nameCell}>
                        {user.avatar ? (
                          <img src={user.avatar} className={styles.avatar} alt="" />
                        ) : (
                          <div className={styles.avatarFallback} style={{ background: getRoleColor(user.role) }}>
                            {user.name[0].toUpperCase()}
                          </div>
                        )}
                        <div>
                          <div className={styles.userName}>{user.name}</div>
                          {user.email && <div className={styles.userEmail}>{user.email}</div>}
                        </div>
                      </div>
                    </td>
                    <td className={styles.phone}>{user.phone}</td>
                    <td>
                      <span
                        className={styles.roleBadge}
                        style={{ "--badge-color": getRoleColor(user.role) } as React.CSSProperties}
                      >
                        {getRoleIcon(user.role)} {user.role}
                      </span>
                    </td>
                    {(activeRole === "all" || activeRole === "instructor") && (
                      <td>
                        {instrStatus ? (
                          <span className={`${styles.statusBadge} ${styles[`status_${instrStatus}`]}`}>
                            {instrStatus}
                          </span>
                        ) : (
                          <span className={styles.dash}>—</span>
                        )}
                      </td>
                    )}
                    {activeRole === "student" && (
                      <td>
                        <span className={courseCnt > 0 ? styles.courseCount : styles.dash}>
                          {courseCnt > 0 ? `${courseCnt} course${courseCnt > 1 ? "s" : ""}` : "None"}
                        </span>
                      </td>
                    )}
                    <td className={styles.joinDate}>{joinStr}</td>
                    <td>
                      {user.googleId ? (
                        <span className={styles.googleBadge}>Google</span>
                      ) : (
                        <span className={styles.phoneBadge}>Phone</span>
                      )}
                    </td>
                    <td>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => setDeleteTarget({ id: user._id, name: user.name, role: user.role })}
                        title="Delete user"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}