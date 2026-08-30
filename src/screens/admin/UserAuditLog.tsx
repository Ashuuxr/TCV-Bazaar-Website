import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, RefreshCw } from "lucide-react";
import { ACard } from "./ui";
import { listAuditLog, type AuditRow } from "@/lib/users.functions";

const ACTIONS = [
  "",
  "login",
  "invite",
  "create",
  "promote",
  "demote",
  "role_change",
  "suspend",
  "reactivate",
  "remove",
  "password_reset",
  "ownership_transfer",
] as const;

export default function UserAuditLog() {
  const call = useServerFn(listAuditLog);
  const [rows, setRows] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string>("");
  const [err, setErr] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setErr("");
    try {
      setRows(await call({ data: { limit: 300, action } }));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [call, action]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">
            User Audit Log
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Every promotion, demotion, invite, suspension, removal, password
            reset and ownership transfer.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            className="input-lux"
            value={action}
            onChange={(e) => setAction(e.target.value)}
          >
            {ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a === "" ? "All actions" : a}
              </option>
            ))}
          </select>
          <button
            onClick={load}
            className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>
      </div>
      {err && (
        <div className="rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
          {err}
        </div>
      )}
      <ACard>
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-10 text-sm text-[var(--ink-soft)]">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <div className="py-10 text-center text-sm text-[var(--ink-soft)]">
            No entries.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-[11px] uppercase tracking-wider text-[var(--ink-soft)]">
                <tr>
                  <th className="py-2 pr-4">When</th>
                  <th className="pr-4">Action</th>
                  <th className="pr-4">Actor</th>
                  <th className="pr-4">Target</th>
                  <th className="pr-4">Role change</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-[var(--line)] align-top"
                  >
                    <td className="py-2 pr-4 text-xs text-[var(--ink-soft)]">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="pr-4">
                      <span className="rounded-full border border-[var(--line)] px-2 py-0.5 text-[10px] font-bold capitalize">
                        {r.action.replace("_", " ")}
                      </span>
                    </td>
                    <td className="pr-4 text-xs">
                      {r.actor_email ?? r.actor_id ?? "—"}
                    </td>
                    <td className="pr-4 text-xs">
                      {r.target_email ?? r.target_id ?? "—"}
                    </td>
                    <td className="pr-4 text-xs">
                      {r.from_role || r.to_role
                        ? `${r.from_role ?? "—"} → ${r.to_role ?? "—"}`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ACard>
    </div>
  );
}
