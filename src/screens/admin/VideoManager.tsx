import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { ACard, Field } from "./ui";
import { uid, useCms } from "@/lib/store";
import type { VideoItem } from "@/lib/store";

export default function VideoManager() {
  const { videos, media, patch, log } = useCms();
  const [edit, setEdit] = useState<string | null>(null);
  const vids = media.filter((m) => m.kind.startsWith("video"));
  const imgs = media.filter((m) => m.kind.startsWith("image"));

  const upd = (id: string, p: Partial<VideoItem>) =>
    patch(
      "videos",
      videos.map((v) => (v.id === id ? { ...v, ...p } : v)),
    );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-medium sm:text-3xl">
            Video Manager
          </h1>
          <p className="mt-1 text-sm text-[var(--ink-soft)]">
            Manage the Videos page — titles, posters, durations and uploaded
            video files.
          </p>
        </div>
        <button
          onClick={() =>
            patch("videos", [
              ...videos,
              {
                id: uid("v"),
                title: "New Video",
                poster:
                  "/__l5e/assets-v1/4fe1787a-c65b-4ea0-8a11-0fb4e226dbfc/gallery-3.jpg",
                src: "",
                duration: "0:30",
              },
            ])
          }
          className="btn-gold flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-semibold"
        >
          <Plus size={14} /> Add Video
        </button>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {videos.map((v) => (
          <ACard key={v.id}>
            <img
              src={v.poster}
              alt=""
              className="aspect-video w-full rounded-xl object-cover"
            />
            {edit === v.id ? (
              <div className="mt-4 space-y-3">
                <Field label="Title">
                  <input
                    className="input-lux"
                    value={v.title}
                    onChange={(e) => upd(v.id, { title: e.target.value })}
                  />
                </Field>
                <Field label="Duration">
                  <input
                    className="input-lux"
                    value={v.duration}
                    onChange={(e) => upd(v.id, { duration: e.target.value })}
                  />
                </Field>
                <Field label="Poster (Media Library)">
                  <select
                    className="input-lux"
                    value=""
                    onChange={(e) =>
                      e.target.value && upd(v.id, { poster: e.target.value })
                    }
                  >
                    <option value="">Choose image…</option>
                    {imgs.map((m) => (
                      <option key={m.id} value={m.dataUrl}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Video file (Media Library)">
                  <select
                    className="input-lux"
                    value=""
                    onChange={(e) =>
                      e.target.value && upd(v.id, { src: e.target.value })
                    }
                  >
                    <option value="">Choose video…</option>
                    {vids.map((m) => (
                      <option key={m.id} value={m.dataUrl}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </Field>
                <button
                  onClick={() => {
                    setEdit(null);
                    log("Updated video");
                  }}
                  className="btn-gold w-full rounded-full py-2.5 text-xs font-semibold"
                >
                  Done
                </button>
              </div>
            ) : (
              <div className="mt-4 flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">{v.title}</div>
                  <div className="text-xs text-[var(--ink-soft)]">
                    {v.duration} {v.src ? "· file attached" : "· poster only"}
                  </div>
                </div>
                <div className="flex gap-1.5">
                  <button
                    onClick={() => setEdit(v.id)}
                    className="rounded-lg border border-[var(--line)] p-2 hover:border-[var(--gold)]"
                  >
                    <Pencil size={12} />
                  </button>
                  <button
                    onClick={() => {
                      patch(
                        "videos",
                        videos.filter((x) => x.id !== v.id),
                      );
                      log("Deleted video");
                    }}
                    className="rounded-lg border border-[var(--line)] p-2 hover:border-red-400 hover:text-red-500"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            )}
          </ACard>
        ))}
      </div>
    </div>
  );
}
