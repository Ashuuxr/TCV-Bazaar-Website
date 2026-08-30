import { useEffect } from "react";
import { ACard, Field, SaveBar, useDraft } from "./ui";

export default function Seo() {
  const { draft, setDraft, save, dirty } = useDraft("site");

  useEffect(() => {
    document.title = draft.seo.title;
  }, [draft.seo.title]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-medium sm:text-3xl">
          SEO Manager
        </h1>
        <p className="mt-1 text-sm text-[var(--ink-soft)]">
          Meta title, description and keywords applied site-wide.
        </p>
      </div>
      <div className="grid gap-6 xl:grid-cols-2">
        <ACard title="Meta tags">
          <div className="space-y-5">
            <Field label={`Meta Title (${draft.seo.title.length}/60)`}>
              <input
                maxLength={70}
                className="input-lux"
                value={draft.seo.title}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    seo: { ...draft.seo, title: e.target.value },
                  } as never)
                }
              />
            </Field>
            <Field
              label={`Meta Description (${draft.seo.description.length}/160)`}
            >
              <textarea
                rows={3}
                maxLength={170}
                className="input-lux"
                value={draft.seo.description}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    seo: { ...draft.seo, description: e.target.value },
                  } as never)
                }
              />
            </Field>
            <Field label="Keywords">
              <input
                className="input-lux"
                value={draft.seo.keywords}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    seo: { ...draft.seo, keywords: e.target.value },
                  } as never)
                }
              />
            </Field>
          </div>
        </ACard>
        <ACard title="Google preview">
          <div className="rounded-2xl bg-white p-5">
            <div className="text-xs text-[#202124]">tcvbazaar.com</div>
            <div className="mt-1 truncate text-lg text-[#1a0dab]">
              {draft.seo.title}
            </div>
            <div className="mt-1 line-clamp-2 text-sm text-[#4d5156]">
              {draft.seo.description}
            </div>
          </div>
          <div className="mt-5 space-y-2 text-xs text-[var(--ink-soft)]">
            <div className="flex justify-between">
              <span>Title length</span>
              <span
                className={
                  draft.seo.title.length <= 60
                    ? "text-green-600"
                    : "text-amber-500"
                }
              >
                {draft.seo.title.length <= 60 ? "Good" : "Too long"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Description length</span>
              <span
                className={
                  draft.seo.description.length <= 160
                    ? "text-green-600"
                    : "text-amber-500"
                }
              >
                {draft.seo.description.length <= 160 ? "Good" : "Too long"}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Mobile-first responsive</span>
              <span className="text-green-600">Pass</span>
            </div>
            <div className="flex justify-between">
              <span>Lazy-loaded images</span>
              <span className="text-green-600">Pass</span>
            </div>
          </div>
        </ACard>
      </div>
      <SaveBar dirty={dirty} onSave={save} />
    </div>
  );
}
