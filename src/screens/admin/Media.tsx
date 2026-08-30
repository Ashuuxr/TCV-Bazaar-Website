import { useMemo, useRef, useState } from "react";
import {
  Crop,
  FileText,
  Film,
  FolderPlus,
  Image as ImageIcon,
  Music,
  Pencil,
  Replace,
  Search,
  Trash2,
  UploadCloud,
  X,
} from "lucide-react";
import { ACard } from "./ui";
import { uid, useCms } from "@/lib/store";
import type { MediaItem } from "@/lib/store";
import {
  uploadToBucket,
  deleteFromBucket,
  parseStorageUrl,
} from "@/lib/uploads";

const kindIcon = (k: string) =>
  k.startsWith("image")
    ? ImageIcon
    : k.startsWith("video")
      ? Film
      : k.startsWith("audio")
        ? Music
        : FileText;

function compressFile(file: File, maxW = 1600): Promise<Blob> {
  return new Promise((resolve) => {
    if (!file.type.startsWith("image") || file.type === "image/svg+xml")
      return resolve(file);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxW / img.width);
      const c = document.createElement("canvas");
      c.width = img.width * scale;
      c.height = img.height * scale;
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      c.toBlob(
        (b) => {
          URL.revokeObjectURL(url);
          resolve(b ?? file);
        },
        "image/jpeg",
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };
    img.src = url;
  });
}

export default function Media() {
  const { media, patch, log } = useCms();
  const [folder, setFolder] = useState("All");
  const [q, setQ] = useState("");
  const [drag, setDrag] = useState(false);
  const [preview, setPreview] = useState<MediaItem | null>(null);
  const [renaming, setRenaming] = useState<string | null>(null);
  const [renameVal, setRenameVal] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const folders = useMemo(
    () => ["All", ...Array.from(new Set(media.map((m) => m.folder)))],
    [media],
  );
  const list = media.filter(
    (m) =>
      (folder === "All" || m.folder === folder) &&
      m.name.toLowerCase().includes(q.toLowerCase()),
  );

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const targetFolder = folder === "All" ? "Uploads" : folder;
    const items: MediaItem[] = [];
    try {
      for (const f of Array.from(files)) {
        const blob = await compressFile(f);
        const res = await uploadToBucket("media-library", blob, {
          folder: targetFolder,
          filename: f.name,
        });
        items.push({
          id: uid("m"),
          name: f.name,
          kind: f.type || "file",
          folder: targetFolder,
          dataUrl: res.url,
          size: blob.size,
          createdAt: new Date().toISOString(),
        });
      }
      patch("media", [...items, ...media]);
      log(`Uploaded ${items.length} file(s) to Media Library`);
    } catch (err) {
      console.error(err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const upd = (id: string, p: Partial<MediaItem>) =>
    patch(
      "media",
      media.map((m) => (m.id === id ? { ...m, ...p } : m)),
    );
  const del = async (id: string) => {
    const item = media.find((m) => m.id === id);
    const ref = parseStorageUrl(item?.dataUrl);
    patch(
      "media",
      media.filter((m) => m.id !== id),
    );
    log("Deleted media file");
    if (ref?.bucket === "media-library")
      await deleteFromBucket("media-library", ref.path);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">
            Media Library
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Drag & drop uploads — images, videos, PDFs and documents. Every
            hero, gallery and brochure asset is picked from here.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              const name = prompt("Folder name?");
              if (name) setFolder(name);
            }}
            className="btn-outline-gold flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold"
          >
            <FolderPlus size={14} /> New Folder
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            className="btn-gold flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"
          >
            <UploadCloud size={14} /> Upload
          </button>
        </div>
      </div>

      <input
        ref={fileRef}
        type="file"
        multiple
        accept="image/*,video/*,.pdf,.doc,.docx"
        className="hidden"
        onChange={(e) => addFiles(e.target.files)}
      />
      <input
        ref={replaceRef}
        type="file"
        accept="image/*,video/*,.pdf"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (f && replaceId) {
            setUploading(true);
            try {
              const prevItem = media.find((m) => m.id === replaceId);
              const prev = parseStorageUrl(prevItem?.dataUrl);
              const blob = await compressFile(f);
              const res = await uploadToBucket("media-library", blob, {
                folder: prevItem?.folder ?? "Uploads",
                filename: f.name,
              });
              upd(replaceId, {
                dataUrl: res.url,
                name: f.name,
                kind: f.type,
                size: blob.size,
              });
              if (prev?.bucket === "media-library")
                await deleteFromBucket("media-library", prev.path);
              log(`Replaced media file`);
            } catch (err) {
              console.error(err);
              alert("Replace failed.");
            } finally {
              setUploading(false);
            }
          }
          setReplaceId(null);
        }}
      />

      {/* drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed p-10 text-center transition ${drag ? "border-[var(--gold)] bg-[var(--bg-soft)]" : "border-[var(--line)]"}`}
      >
        <UploadCloud size={30} className="text-gold" />
        <div className="text-sm font-medium">
          {uploading ? "Uploading…" : "Drop files here to upload"}
        </div>
        <div className="text-xs text-[var(--ink-soft)]">
          Files are stored in secure cloud storage. Images auto-compressed.
        </div>
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        {folders.map((f) => (
          <button
            key={f}
            onClick={() => setFolder(f)}
            className={`rounded-full border px-4 py-2 text-xs font-semibold ${folder === f ? "border-[var(--gold)] bg-[var(--gold)] text-[#17130c]" : "border-[var(--line)]"}`}
          >
            {f}
          </button>
        ))}
        <div className="relative ml-auto">
          <Search
            size={14}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--ink-soft)]"
          />
          <input
            className="input-lux w-52 pl-9"
            placeholder="Search files…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>

      {/* built-in assets note */}
      <ACard
        title="Library"
        sub={`${list.length} uploaded file(s) — plus built-in brand assets (logos, gallery photos) under /assets.`}
      >
        {list.length === 0 ? (
          <p className="py-8 text-center text-sm text-[var(--ink-soft)]">
            Nothing uploaded yet. Drag files above to build your library.
          </p>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
            {list.map((m) => {
              const Icon = kindIcon(m.kind);
              return (
                <div
                  key={m.id}
                  className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--bg-soft)]"
                >
                  <button
                    onClick={() => setPreview(m)}
                    className="relative block aspect-square w-full"
                  >
                    {m.kind.startsWith("image") ? (
                      <img
                        src={m.dataUrl}
                        alt={m.name}
                        className="h-full w-full object-cover"
                      />
                    ) : m.kind.startsWith("video") ? (
                      <video
                        src={m.dataUrl}
                        className="h-full w-full object-cover"
                        muted
                      />
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-gold">
                        <Icon size={34} />
                      </span>
                    )}
                  </button>
                  <div className="p-3">
                    {renaming === m.id ? (
                      <div className="flex gap-1.5">
                        <input
                          autoFocus
                          className="input-lux px-2 py-1 text-xs"
                          value={renameVal}
                          onChange={(e) => setRenameVal(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              upd(m.id, { name: renameVal });
                              setRenaming(null);
                            }
                          }}
                        />
                        <button
                          onClick={() => {
                            upd(m.id, { name: renameVal });
                            setRenaming(null);
                          }}
                          className="text-gold"
                        >
                          <Pencil size={12} />
                        </button>
                      </div>
                    ) : (
                      <div
                        className="truncate text-xs font-medium"
                        title={m.name}
                      >
                        {m.name}
                      </div>
                    )}
                    <div className="mt-0.5 text-[10px] text-[var(--ink-soft)]">
                      {(m.size / 1024).toFixed(0)} KB · {m.folder}
                    </div>
                    <div className="mt-2 flex items-center gap-1.5">
                      <button
                        title="Rename"
                        onClick={() => {
                          setRenaming(m.id);
                          setRenameVal(m.name);
                        }}
                        className="rounded-lg border border-[var(--line)] p-1.5 hover:border-[var(--gold)]"
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        title="Replace"
                        onClick={() => {
                          setReplaceId(m.id);
                          replaceRef.current?.click();
                        }}
                        className="rounded-lg border border-[var(--line)] p-1.5 hover:border-[var(--gold)]"
                      >
                        <Replace size={11} />
                      </button>
                      {m.kind.startsWith("image") && (
                        <span className="hidden">
                          <Crop size={11} />
                        </span>
                      )}
                      <button
                        title="Delete"
                        onClick={() => del(m.id)}
                        className="rounded-lg border border-[var(--line)] p-1.5 hover:border-red-400 hover:text-red-500"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ACard>

      {preview && (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/85 p-4"
          onClick={() => setPreview(null)}
        >
          <button className="absolute right-5 top-5 rounded-full border border-white/30 p-2.5 text-white">
            <X size={18} />
          </button>
          <div className="max-w-3xl" onClick={(e) => e.stopPropagation()}>
            {preview.kind.startsWith("image") ? (
              <img
                src={preview.dataUrl}
                className="max-h-[75vh] rounded-2xl"
                alt=""
              />
            ) : preview.kind.startsWith("video") ? (
              <video
                src={preview.dataUrl}
                controls
                className="max-h-[75vh] rounded-2xl"
              />
            ) : (
              <div className="rounded-2xl bg-white p-10 text-center text-sm text-black">
                {preview.name} — document preview not available.
              </div>
            )}
            <div className="mt-3 text-center text-sm text-white">
              {preview.name}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
