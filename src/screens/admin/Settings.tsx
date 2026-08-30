import { useEffect, useState } from "react";
import {
  KeyRound,
  ShieldCheck,
  Smartphone,
  Users,
  Loader2,
  RefreshCw,
  Power,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { ACard } from "./ui";
import {
  getMyRoles,
  listAuditLog,
  type AppRole,
  type AuditRow,
} from "@/lib/users.functions";
import { useCms } from "@/lib/store";

const ROLE_LABEL: Record<AppRole, string> = {
  super_admin: "Super Admin",
  admin: "Admin",
  finance: "Finance",
  manager: "Manager",
  editor: "Editor",
  customer: "Customer",
};

export default function Settings() {
  const rolesCall = useServerFn(getMyRoles);
  const auditCall = useServerFn(listAuditLog);
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState("");
  const bookingOpen = useCms((s) => s.bookingOpen);
  const patch = useCms((s) => s.patch);

  const load = async (background = false) => {
    if (background) setRefreshing(true);
    else setLoading(true);
    setErr("");
    try {
      const [{ data: userData, error: userError }, access, auditRows] =
        await Promise.all([
          supabase.auth.getUser(),
          rolesCall(),
          auditCall({ data: { limit: 60, action: "" } }),
        ]);
      if (userError) throw new Error(userError.message);
      setEmail(userData.user?.email ?? "");
      setRoles(access.roles);
      setAudit(auditRows);
    } catch (e) {
      setErr(
        e instanceof Error ? e.message : "Could not load security settings.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-[var(--ink-soft)]">
        <Loader2 className="mr-2 animate-spin" size={16} /> Loading real
        security settings…
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">
            Settings & Security
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Live Supabase account, roles, session guidance and database audit
            history.
          </p>
        </div>
        <button
          onClick={() => void load(true)}
          disabled={refreshing}
          className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold disabled:opacity-60"
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />{" "}
          Refresh
        </button>
      </div>

      {err && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}

      <ACard
        title="Booking Availability"
        sub="Control whether new public stall bookings are accepted"
      >
        <div
          className={`flex flex-col gap-5 rounded-2xl border p-5 sm:flex-row sm:items-center sm:justify-between ${bookingOpen ? "border-emerald-200 bg-emerald-50" : "border-red-200 bg-red-50"}`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${bookingOpen ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}
            >
              <Power size={18} />
            </span>
            <div>
              <div
                className={`text-sm font-semibold ${bookingOpen ? "text-emerald-900" : "text-red-900"}`}
              >
                Booking is {bookingOpen ? "ON" : "CLOSED"}
              </div>
              <p
                className={`mt-1 max-w-xl text-xs leading-relaxed ${bookingOpen ? "text-emerald-800" : "text-red-800"}`}
              >
                {bookingOpen
                  ? "Visitors can open the public booking portal and submit new stall bookings."
                  : "The public portal is closed, the booking form is hidden, and new submissions are blocked server-side."}
              </p>
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={bookingOpen}
            onClick={() => {
              if (
                bookingOpen &&
                !window.confirm(
                  "Close public booking now? New booking submissions will be blocked.",
                )
              )
                return;
              patch("bookingOpen", !bookingOpen);
            }}
            className={`relative inline-flex h-8 w-14 shrink-0 rounded-full border-2 transition-colors ${bookingOpen ? "border-emerald-600 bg-emerald-600" : "border-red-500 bg-red-500"}`}
          >
            <span
              className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${bookingOpen ? "translate-x-7" : "translate-x-1"}`}
            />
            <span className="sr-only">
              Turn booking {bookingOpen ? "off" : "on"}
            </span>
          </button>
        </div>
      </ACard>

      <div className="grid gap-6 xl:grid-cols-2">
        <ACard title="Admin login" sub="Managed by Supabase Auth">
          <div className="space-y-5">
            <div>
              <div className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--ink-soft)]">
                Signed-in email
              </div>
              <div className="rounded-xl border border-[var(--line)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium">
                {email || "Unavailable"}
              </div>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)] p-4 text-xs leading-relaxed text-[var(--ink-soft)]">
              Passwords are managed securely by Supabase Auth and are never
              stored in the browser CMS state. Use the password-reset flow from
              the admin login screen to change the password.
            </div>
            <a
              href="/admin/login"
              className="inline-flex items-center gap-2 rounded-full border border-[var(--gold)] px-5 py-2.5 text-xs font-semibold text-[var(--ink)]"
            >
              <KeyRound size={14} /> Open password-reset screen
            </a>
          </div>
        </ACard>

        <ACard
          title="Roles & sessions"
          sub="Read-only values from Supabase Auth and user_roles"
        >
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold">
                <ShieldCheck size={16} />
              </span>
              <div>
                <div className="text-sm font-semibold">Current account</div>
                <div className="text-xs text-[var(--ink-soft)]">
                  {email || "Authenticated admin"}
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {roles.length === 0 ? (
                <span className="text-xs text-[var(--ink-soft)]">
                  No roles returned
                </span>
              ) : (
                roles.map((role) => (
                  <span
                    key={role}
                    className="rounded-full border border-[var(--line)] bg-[var(--bg-soft)] px-3 py-1 text-xs font-semibold text-gold"
                  >
                    {ROLE_LABEL[role]}
                  </span>
                ))
              )}
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--bg-soft)] text-gold">
                <Users size={16} />
              </span>
              <div>
                <div className="text-sm font-semibold">Session</div>
                <div className="text-xs text-[var(--ink-soft)]">
                  This browser session is managed by Supabase Auth. Sign out
                  clears it immediately.
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
              <Smartphone size={16} />
              <div className="text-xs leading-relaxed">
                Two-factor authentication is not implemented as a local toggle.
                Do not enable a setting here that is not enforced by Supabase
                Auth.
              </div>
            </div>
          </div>
        </ACard>
      </div>

      <ACard
        title="Database Audit Log"
        sub="The latest real records from public.user_audit_log"
      >
        <div className="max-h-80 overflow-y-auto text-xs">
          {audit.length === 0 ? (
            <p className="py-6 text-center text-[var(--ink-soft)]">
              No database audit entries yet. A successful admin login or
              protected admin action will create one.
            </p>
          ) : (
            <div className="space-y-2">
              {audit.map((a) => (
                <div
                  key={a.id}
                  className="flex flex-wrap justify-between gap-4 border-b border-[var(--line)] pb-2"
                >
                  <span>
                    <strong className="capitalize">
                      {a.action.replaceAll("_", " ")}
                    </strong>{" "}
                    · {a.actor_email ?? a.actor_id ?? "Unknown actor"}
                  </span>
                  <span className="shrink-0 text-[var(--ink-soft)]">
                    {new Date(a.created_at).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </ACard>
    </div>
  );
}
