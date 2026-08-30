import { supabase } from "@/integrations/supabase/client";

/** Private-file signed URL lifetime. Public buckets use stable public URLs. */
const SIGN_TTL = 60 * 60;

const PUBLIC_BUCKETS = new Set<BucketName>([
  "brand-assets",
  "gallery",
  "page-assets",
  "hero-videos",
  "brochures",
]);

export type BucketName =
  | "brand-assets"
  | "gallery"
  | "media-library"
  | "page-assets"
  | "bank-qr"
  | "payment-screenshots"
  | "hero-videos"
  | "brochures"
  | "company-assets";

export interface UploadResult {
  bucket: BucketName;
  path: string;
  url: string;
  name: string;
  size: number;
  type: string;
}

const slug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";

function makePath(folder: string | undefined, name: string) {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 8);
  const clean = slug(name);
  return `${folder ? folder + "/" : ""}${ts}-${rand}-${clean}`;
}

async function getAssetUrl(bucket: BucketName, path: string): Promise<string> {
  if (PUBLIC_BUCKETS.has(bucket)) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);
    if (!data.publicUrl) throw new Error("Failed to create public URL");
    return data.publicUrl;
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, SIGN_TTL);
  if (error || !data?.signedUrl)
    throw error ?? new Error("Failed to sign private URL");
  return data.signedUrl;
}

/** Upload a File/Blob and return metadata plus a public or short-lived private URL. */
export async function uploadToBucket(
  bucket: BucketName,
  file: File | Blob,
  opts?: { folder?: string; filename?: string; upsert?: boolean },
): Promise<UploadResult> {
  const name = opts?.filename ?? (file as File).name ?? "upload";
  const path = makePath(opts?.folder, name);
  const contentType = (file as File).type || "application/octet-stream";
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, file, { contentType, upsert: opts?.upsert ?? false });
  if (error) throw error;
  const url = await getAssetUrl(bucket, path);
  return {
    bucket,
    path,
    url,
    name,
    size: (file as File).size ?? 0,
    type: contentType,
  };
}

/** Best-effort delete; swallows "not found". */
export async function deleteFromBucket(
  bucket: BucketName,
  path: string | undefined | null,
) {
  if (!path) return;
  try {
    await supabase.storage.from(bucket).remove([path]);
  } catch {
    /* noop */
  }
}

/** Parse a signed or public storage URL back to `{bucket, path}` if it belongs to this project. */
export function parseStorageUrl(
  url: string | undefined | null,
): { bucket: BucketName; path: string } | null {
  if (!url) return null;
  const m = url.match(
    /\/storage\/v1\/object\/(?:public|sign)\/([^/]+)\/([^?]+)/,
  );
  if (!m) return null;
  return { bucket: m[1] as BucketName, path: decodeURIComponent(m[2]) };
}

/** Refresh a signed URL (call if the original expires). */
export async function refreshSignedUrl(bucket: BucketName, path: string) {
  return getAssetUrl(bucket, path);
}

export function isDataUrl(v: string | undefined | null): boolean {
  return !!v && v.startsWith("data:");
}
