import { useCallback, useEffect, useRef, useState } from "react";
import {
  Archive,
  ArchiveRestore,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCms } from "@/lib/store";
import {
  adminListBrochures,
  createBrochure,
  updateBrochureMeta,
  replaceBrochureFile,
  setActiveBrochure,
  setBrochureArchived,
  deleteBrochure,
  listBrochureVersions,
  restoreBrochureVersion,
  getBrochureAdminSignedUrl,
  type BrochureRow,
  type BrochureVersionRow,
} from "@/lib/brochures.functions";
import { ACard, Field } from "./ui";

const MAX_MB = 25;

function fmtSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}
function fmtDate(iso: string) {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

async function uploadPdf(
  file: File,
): Promise<{ file_path: string; file_name: string; file_size: number }> {
  if (file.type !== "application/pdf")
    throw new Error("Only PDF files are allowed.");
  if (file.size > MAX_MB * 1024 * 1024)
    throw new Error(`File too large (max ${MAX_MB} MB).`);
  const key = `${Date.now()}-${crypto.randomUUID()}.pdf`;
  const { error } = await supabase.storage.from("brochures").upload(key, file, {
    contentType: "application/pdf",
    upsert: false,
  });
  if (error) throw new Error(error.message);
  return { file_path: key, file_name: file.name, file_size: file.size };
}

export default function BrochureManager() {
  const [rows, setRows] = useState<BrochureRow[]>([]);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [showUpload, setShowUpload] = useState(false);
  const [editRow, setEditRow] = useState<BrochureRow | null>(null);
  const [versionsFor, setVersionsFor] = useState<BrochureRow | null>(null);

  const cms = useCms();
  const brochureSection = (
    cms as unknown as {
      brochureSection?: {
        enabled?: boolean;
        heading?: string;
        subheading?: string;
      };
    }
  ).brochureSection;
  const enabled = brochureSection?.enabled !== false; // default on
  const heading = brochureSection?.heading ?? "";
  const subheading = brochureSection?.subheading ?? "";

  const setBrochureSection = (
    patch: Partial<{ enabled: boolean; heading: string; subheading: string }>,
  ) => {
    const next = { enabled, heading, subheading, ...patch };
    (cms.patch as unknown as (k: string, v: unknown) => void)(
      "brochureSection",
      next,
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await adminListBrochures({ data: { includeArchived } });
      setRows(list as BrochureRow[]);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [includeArchived]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const ch = supabase
      .channel("admin:brochures")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brochures" },
        () => load(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(ch);
    };
  }, [load]);

  const preview = async (row: BrochureRow | BrochureVersionRow) => {
    try {
      const res = await getBrochureAdminSignedUrl({
        data: { file_path: row.file_path },
      });
      window.open(res.url, "_blank", "noopener");
    } catch (e) {
      alert((e as Error).message);
    }
  };

  const withBusy = async (id: string, fn: () => Promise<unknown>) => {
    setBusyId(id);
    try {
      await fn();
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-medium">
            Brochure Manager
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Upload, activate and version brochures. The active brochure appears
            on the public website when the section is enabled.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => load()}
            className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          >
            <RefreshCw size={13} /> Refresh
          </button>
          <button
            onClick={() => setShowUpload(true)}
            className="btn-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
          >
            <Plus size={14} /> Upload Brochure
          </button>
        </div>
      </div>

      <ACard
        title="Public Section"
        sub="Controls whether the brochure block is shown on the public website."
      >
        <div className="grid gap-4 md:grid-cols-3">
          <div className="flex items-center gap-3 rounded-2xl border border-[var(--line)] p-4">
            <button
              onClick={() => setBrochureSection({ enabled: !enabled })}
              className={`relative h-7 w-12 rounded-full transition ${enabled ? "bg-gold" : "bg-[var(--line)]"}`}
              aria-label="Toggle brochure visibility"
            >
              <span
                className={`absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition ${enabled ? "left-[22px]" : "left-0.5"}`}
              />
            </button>
            <div>
              <div className="text-sm font-semibold">
                {enabled ? "Visible on public site" : "Hidden from public site"}
              </div>
              <div className="text-xs text-[var(--ink-soft)]">
                Single toggle — hides the brochure section completely.
              </div>
            </div>
          </div>
          <Field label="Section heading">
            <input
              className="input-lux"
              value={heading}
              onChange={(e) => setBrochureSection({ heading: e.target.value })}
              placeholder="Download Brochure"
            />
          </Field>
          <Field label="Section subheading">
            <input
              className="input-lux"
              value={subheading}
              onChange={(e) =>
                setBrochureSection({ subheading: e.target.value })
              }
              placeholder="Get the full deck as a PDF"
            />
          </Field>
        </div>
      </ACard>

      <ACard
        title="Brochures"
        sub="Only one brochure per event can be active at a time. Public visitors see the active brochure via secure short-lived download links."
        action={
          <label className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
            <input
              type="checkbox"
              checked={includeArchived}
              onChange={(e) => setIncludeArchived(e.target.checked)}
            />{" "}
            Include archived
          </label>
        }
      >
        {loading ? (
          <div className="flex items-center gap-2 py-8 text-sm text-[var(--ink-soft)]">
            <Loader2 size={14} className="animate-spin" /> Loading…
          </div>
        ) : error ? (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        ) : rows.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[var(--line)] p-8 text-center text-sm text-[var(--ink-soft)]">
            No brochures yet. Click <b>Upload Brochure</b> to add one.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-[var(--ink-soft)]">
                  <th className="py-2 pr-4">Title</th>
                  <th className="py-2 pr-4">File</th>
                  <th className="py-2 pr-4">Status</th>
                  <th className="py-2 pr-4">Updated</th>
                  <th className="py-2 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.id}
                    className="border-t border-[var(--line)] align-top"
                  >
                    <td className="py-3 pr-4">
                      <div className="flex items-start gap-2">
                        <FileText size={16} className="mt-0.5 text-gold" />
                        <div>
                          <div className="font-semibold">{r.title}</div>
                          {r.description && (
                            <div className="text-xs text-[var(--ink-soft)]">
                              {r.description}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="text-xs">{r.file_name}</div>
                      <div className="text-xs text-[var(--ink-soft)]">
                        {fmtSize(r.file_size)}
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-1.5">
                        {r.is_active && (
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-700">
                            Active
                          </span>
                        )}
                        {r.is_archived && (
                          <span className="rounded-full bg-neutral-200 px-2 py-0.5 text-[10px] font-bold uppercase text-neutral-700">
                            Archived
                          </span>
                        )}
                        {!r.is_active && !r.is_archived && (
                          <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-800">
                            Inactive
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-xs text-[var(--ink-soft)]">
                      {fmtDate(r.updated_at)}
                    </td>
                    <td className="py-3 pr-0 text-right">
                      <div className="inline-flex flex-wrap justify-end gap-1.5">
                        <button
                          onClick={() => preview(r)}
                          title="Preview"
                          className="rounded-full border border-[var(--line)] p-1.5 hover:border-gold"
                        >
                          <Eye size={13} />
                        </button>
                        {!r.is_archived && (
                          <button
                            disabled={busyId === r.id}
                            onClick={() =>
                              withBusy(r.id, () =>
                                setActiveBrochure({
                                  data: { id: r.id, active: !r.is_active },
                                }),
                              )
                            }
                            title={r.is_active ? "Deactivate" : "Set active"}
                            className={`rounded-full border p-1.5 ${r.is_active ? "border-emerald-400 text-emerald-600" : "border-[var(--line)] hover:border-gold"}`}
                          >
                            <CheckCircle2 size={13} />
                          </button>
                        )}
                        <button
                          onClick={() => setEditRow(r)}
                          title="Edit / Replace"
                          className="rounded-full border border-[var(--line)] p-1.5 hover:border-gold"
                        >
                          <Pencil size={13} />
                        </button>
                        <button
                          onClick={() => setVersionsFor(r)}
                          title="Version history"
                          className="rounded-full border border-[var(--line)] p-1.5 hover:border-gold"
                        >
                          <History size={13} />
                        </button>
                        {r.is_archived ? (
                          <button
                            disabled={busyId === r.id}
                            onClick={() =>
                              withBusy(r.id, () =>
                                setBrochureArchived({
                                  data: { id: r.id, archived: false },
                                }),
                              )
                            }
                            title="Restore"
                            className="rounded-full border border-[var(--line)] p-1.5 hover:border-gold"
                          >
                            <ArchiveRestore size={13} />
                          </button>
                        ) : (
                          <button
                            disabled={busyId === r.id}
                            onClick={() =>
                              withBusy(r.id, () =>
                                setBrochureArchived({
                                  data: { id: r.id, archived: true },
                                }),
                              )
                            }
                            title="Archive"
                            className="rounded-full border border-[var(--line)] p-1.5 hover:border-gold"
                          >
                            <Archive size={13} />
                          </button>
                        )}
                        <button
                          disabled={busyId === r.id}
                          onClick={() => {
                            if (
                              confirm(
                                `Delete brochure "${r.title}"? Files and version history are removed permanently.`,
                              )
                            )
                              withBusy(r.id, () =>
                                deleteBrochure({ data: { id: r.id } }),
                              );
                          }}
                          title="Delete"
                          className="rounded-full border border-red-300 p-1.5 text-red-500 hover:border-red-500"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ACard>

      {showUpload && (
        <UploadDialog
          onClose={() => setShowUpload(false)}
          onDone={() => {
            setShowUpload(false);
            load();
          }}
        />
      )}
      {editRow && (
        <EditDialog
          row={editRow}
          onClose={() => setEditRow(null)}
          onDone={() => {
            setEditRow(null);
            load();
          }}
        />
      )}
      {versionsFor && (
        <VersionsDialog
          brochure={versionsFor}
          onClose={() => setVersionsFor(null)}
          onDone={load}
          onPreview={preview}
        />
      )}
    </div>
  );
}

function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-2xl bg-[var(--card-bg)] p-6 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-display text-lg font-medium">{title}</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 hover:bg-[var(--bg-soft)]"
          >
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function UploadDialog({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activate, setActivate] = useState(true);
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const inp = useRef<HTMLInputElement>(null);

  const submit = async () => {
    if (!title.trim()) return alert("Title is required");
    if (!file) return alert("Please choose a PDF file");
    setBusy(true);
    try {
      const up = await uploadPdf(file);
      await createBrochure({
        data: {
          title: title.trim(),
          description: description.trim() || null,
          event_id: null,
          ...up,
          activate,
        },
      });
      onDone();
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Dialog title="Upload brochure" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title *">
          <input
            className="input-lux"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="TCV Bazaar 2026 – Exhibitor Deck"
          />
        </Field>
        <Field label="Description">
          <textarea
            className="input-lux min-h-[70px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Short description shown as tooltip"
          />
        </Field>
        <Field label={`PDF file (max ${MAX_MB} MB) *`}>
          <div className="flex items-center gap-3">
            <input
              ref={inp}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inp.current?.click()}
              className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
            >
              <Upload size={13} /> Choose file
            </button>
            <span className="text-xs text-[var(--ink-soft)]">
              {file
                ? `${file.name} · ${fmtSize(file.size)}`
                : "No file selected"}
            </span>
          </div>
        </Field>
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={activate}
            onChange={(e) => setActivate(e.target.checked)}
          />{" "}
          Set as active brochure immediately
        </label>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={submit}
            className="btn-gold flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold"
          >
            {busy && <Loader2 size={13} className="animate-spin" />} Upload
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function EditDialog({
  row,
  onClose,
  onDone,
}: {
  row: BrochureRow;
  onClose: () => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState(row.title);
  const [description, setDescription] = useState(row.description ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const inp = useRef<HTMLInputElement>(null);

  const submit = async () => {
    setBusy(true);
    try {
      if (
        title !== row.title ||
        (description || null) !== (row.description || null)
      ) {
        await updateBrochureMeta({
          data: { id: row.id, title, description: description.trim() || null },
        });
      }
      if (file) {
        const up = await uploadPdf(file);
        await replaceBrochureFile({ data: { id: row.id, ...up } });
      }
      onDone();
    } catch (e) {
      alert((e as Error).message);
      setBusy(false);
    }
  };

  return (
    <Dialog title="Edit brochure" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Title">
          <input
            className="input-lux"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </Field>
        <Field label="Description">
          <textarea
            className="input-lux min-h-[70px]"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </Field>
        <Field label={`Replace file (optional, max ${MAX_MB} MB)`}>
          <div className="flex items-center gap-3">
            <input
              ref={inp}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => inp.current?.click()}
              className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold"
            >
              <Upload size={13} /> Choose new PDF
            </button>
            <span className="text-xs text-[var(--ink-soft)]">
              {file
                ? `${file.name} · ${fmtSize(file.size)}`
                : `Current: ${row.file_name}`}
            </span>
          </div>
          <div className="mt-1 text-[11px] text-[var(--ink-soft)]">
            Replacing pushes the current file to version history so it can be
            restored later.
          </div>
        </Field>
        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="rounded-full border border-[var(--line)] px-4 py-2 text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={submit}
            className="btn-gold flex items-center gap-2 rounded-full px-5 py-2 text-xs font-semibold"
          >
            {busy && <Loader2 size={13} className="animate-spin" />} Save
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function VersionsDialog({
  brochure,
  onClose,
  onDone,
  onPreview,
}: {
  brochure: BrochureRow;
  onClose: () => void;
  onDone: () => void;
  onPreview: (v: BrochureVersionRow) => void;
}) {
  const [versions, setVersions] = useState<BrochureVersionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await listBrochureVersions({
        data: { brochure_id: brochure.id },
      });
      setVersions(list as BrochureVersionRow[]);
    } finally {
      setLoading(false);
    }
  }, [brochure.id]);

  useEffect(() => {
    load();
  }, [load]);

  const restore = async (id: string) => {
    if (
      !confirm(
        "Restore this version? The current file will be saved to history first.",
      )
    )
      return;
    setBusy(id);
    try {
      await restoreBrochureVersion({ data: { version_id: id } });
      onDone();
      await load();
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog title={`Version history — ${brochure.title}`} onClose={onClose}>
      {loading ? (
        <div className="flex items-center gap-2 py-6 text-sm text-[var(--ink-soft)]">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : versions.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[var(--line)] p-6 text-center text-sm text-[var(--ink-soft)]">
          No previous versions yet.
        </div>
      ) : (
        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {versions.map((v) => (
            <div
              key={v.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-[var(--line)] p-3"
            >
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold">
                  {v.file_name}
                </div>
                <div className="text-xs text-[var(--ink-soft)]">
                  {fmtDate(v.created_at)} · {fmtSize(v.file_size)}
                </div>
              </div>
              <div className="flex gap-1.5">
                <button
                  onClick={() => onPreview(v)}
                  className="rounded-full border border-[var(--line)] p-1.5 hover:border-gold"
                  title="Preview"
                >
                  <Eye size={13} />
                </button>
                <button
                  disabled={busy === v.id}
                  onClick={() => restore(v.id)}
                  className="rounded-full border border-[var(--line)] p-1.5 hover:border-gold"
                  title="Restore"
                >
                  {busy === v.id ? (
                    <Loader2 size={13} className="animate-spin" />
                  ) : (
                    <Download size={13} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Dialog>
  );
}
