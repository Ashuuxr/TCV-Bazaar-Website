import { useEffect, useMemo, useState } from "react";
import { Check, Mail, MailOpen, Phone, RefreshCw, Trash2 } from "lucide-react";
import {
  listContactMessages,
  markContactMessageRead,
  deleteContactMessage,
  type ContactMessage,
} from "@/lib/contactMessages.functions";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function readableContactError(error: unknown, fallback: string) {
  if (typeof error === "string" && error.trim()) return error.trim();
  if (error instanceof Error && error.message.trim()) return error.message;
  if (error && typeof error === "object") {
    const value = error as {
      message?: unknown;
      error?: unknown;
      details?: unknown;
    };
    for (const candidate of [value.message, value.error, value.details]) {
      if (typeof candidate === "string" && candidate.trim())
        return candidate.trim();
    }
    try {
      const serialized = JSON.stringify(error);
      if (serialized && serialized !== "{}") return serialized;
    } catch {
      // Use the readable fallback for non-serializable errors.
    }
  }
  return fallback;
}

export default function ContactMessages() {
  const [rows, setRows] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      setRows(await listContactMessages());
    } catch (err) {
      setError(readableContactError(err, "Could not load messages."));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) =>
      [r.name, r.phone, r.email ?? "", r.message].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [rows, query]);

  const toggleRead = async (row: ContactMessage) => {
    setBusy(row.id);
    try {
      await markContactMessageRead({
        data: { id: row.id, read: !row.read_at },
      });
      setRows((current) =>
        current.map((r) =>
          r.id === row.id
            ? { ...r, read_at: row.read_at ? null : new Date().toISOString() }
            : r,
        ),
      );
    } catch (err) {
      setError(readableContactError(err, "Could not update message."));
    } finally {
      setBusy(null);
    }
  };

  const remove = async (row: ContactMessage) => {
    const first = window.confirm(`Delete the message from ${row.name}?`);
    if (!first) return;
    const second = window.confirm(
      "This permanently deletes the contact message. Continue?",
    );
    if (!second) return;
    setBusy(row.id);
    try {
      await deleteContactMessage({ data: { id: row.id } });
      setRows((current) => current.filter((r) => r.id !== row.id));
    } catch (err) {
      setError(readableContactError(err, "Could not delete message."));
    } finally {
      setBusy(null);
    }
  };

  const unread = rows.filter((r) => !r.read_at).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.22em] text-gold">Inbox</p>
          <h1 className="mt-1 font-display text-3xl font-medium">
            Contact Messages
          </h1>
          <p className="mt-2 text-sm text-[var(--ink-soft)]">
            Messages submitted from the public Contact page.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-[var(--line)] px-3 py-2 text-xs text-[var(--ink-soft)]">
            {unread} unread
          </span>
          <button
            onClick={() => void load()}
            className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      <div className="card-lux p-4 sm:p-6">
        <input
          className="input-lux"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, phone, email or message…"
        />
        {error && (
          <p
            className="mt-4 rounded-xl bg-red-50 p-3 text-sm text-red-700"
            role="alert"
          >
            {error}
          </p>
        )}
        {loading ? (
          <p className="py-12 text-center text-sm text-[var(--ink-soft)]">
            Loading messages…
          </p>
        ) : visible.length === 0 ? (
          <div className="py-14 text-center">
            <Mail className="mx-auto text-[var(--ink-soft)]" size={28} />
            <p className="mt-3 text-sm text-[var(--ink-soft)]">
              No contact messages yet.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-3">
            {visible.map((row) => (
              <article
                key={row.id}
                className={`rounded-2xl border p-4 transition ${row.read_at ? "border-[var(--line)] bg-transparent" : "border-[var(--gold)] bg-[var(--bg-soft)]"}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h2 className="font-semibold">{row.name}</h2>
                      {!row.read_at && (
                        <span className="rounded-full bg-[var(--gold)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-[#17130c]">
                          New
                        </span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[var(--ink-soft)]">
                      <a
                        className="inline-flex items-center gap-1 hover:text-gold"
                        href={`tel:${row.phone}`}
                      >
                        <Phone size={12} /> {row.phone}
                      </a>
                      {row.email && (
                        <a
                          className="inline-flex items-center gap-1 hover:text-gold"
                          href={`mailto:${row.email}`}
                        >
                          <Mail size={12} /> {row.email}
                        </a>
                      )}
                    </div>
                    <p className="mt-4 whitespace-pre-wrap text-sm leading-relaxed">
                      {row.message}
                    </p>
                    <p className="mt-3 text-[11px] text-[var(--ink-soft)]">
                      Received {formatDate(row.created_at)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2 sm:flex-col">
                    <button
                      disabled={busy === row.id}
                      onClick={() => void toggleRead(row)}
                      className="btn-outline-gold flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold"
                    >
                      {row.read_at ? (
                        <>
                          <Mail size={13} /> Mark unread
                        </>
                      ) : (
                        <>
                          <MailOpen size={13} /> Mark read
                        </>
                      )}
                    </button>
                    <button
                      disabled={busy === row.id}
                      onClick={() => void remove(row)}
                      className="flex items-center justify-center gap-2 rounded-full border border-red-200 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50"
                    >
                      <Trash2 size={13} /> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
