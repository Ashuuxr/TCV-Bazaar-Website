import { supabase } from '@/integrations/supabase/client'
import type { GalleryItem, VideoItem } from '@/lib/store'

type StorageListItem = {
  name: string
  id?: string | null
  metadata?: { mimetype?: string | null; size?: number | string | null } | null
}

export type PublicStorageMedia = {
  gallery: GalleryItem[] | null
  videos: VideoItem[] | null
  heroVideoUrl: string | null
  heroPosterUrl: string | null
}

function publicUrl(bucket: string, path: string) {
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl
}

function publicImageUrl(bucket: string, path: string) {
  const original = publicUrl(bucket, path)
  // Keep using the real public Storage object, but let Supabase resize and
  // compress gallery/poster requests so 10–13 MB camera originals do not
  // overwhelm mobile browsers. The original remains untouched in Storage.
  return original
    .replace('/storage/v1/object/public/', '/storage/v1/render/image/public/')
    + '?width=1600&quality=75&resize=contain'
}

function isFile(item: StorageListItem) {
  return Boolean(item.id && item.metadata)
}

async function listBucketRecursive(bucket: string, prefix = ''): Promise<StorageListItem[]> {
  const { data, error } = await supabase.storage.from(bucket).list(prefix, {
    limit: 1000,
    sortBy: { column: 'name', order: 'asc' },
  })
  if (error) throw error
  const items = (data ?? []) as StorageListItem[]
  const files: StorageListItem[] = []
  for (const item of items) {
    const path = prefix ? `${prefix}/${item.name}` : item.name
    if (isFile(item)) files.push({ ...item, name: path })
    else files.push(...await listBucketRecursive(bucket, path))
  }
  return files
}

function titleFromPath(path: string) {
  return path.split('/').pop()?.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' ').trim() || 'TCV Bazaar media'
}

/**
 * Lists only the public production media buckets. Private buckets are not
 * queried from the browser and remain protected by their existing policies.
 */
export async function loadPublicStorageMedia(
  existingGallery: GalleryItem[] = [],
  existingVideos: VideoItem[] = [],
): Promise<PublicStorageMedia> {
  const [galleryResult, videoResult] = await Promise.allSettled([
    listBucketRecursive('gallery'),
    listBucketRecursive('hero-videos'),
  ])

  if (galleryResult.status === 'rejected') console.warn('[storage] gallery list failed', galleryResult.reason)
  if (videoResult.status === 'rejected') console.warn('[storage] hero-videos list failed', videoResult.reason)

  const galleryFiles = galleryResult.status === 'fulfilled' ? galleryResult.value : []
  const videoFiles = videoResult.status === 'fulfilled' ? videoResult.value : []

  const gallery = galleryFiles.length
    ? galleryFiles.map((file, index) => {
        const previous = existingGallery[index]
        return {
          id: `storage:gallery:${file.id ?? file.name}`,
          src: publicImageUrl('gallery', file.name),
          title: previous?.title || titleFromPath(file.name),
          category: previous?.category || 'Gallery',
        }
      })
    : null

  const firstGallery = gallery?.[0]?.src ?? null
  const videos = videoFiles.length
    ? videoFiles.map((file, index) => {
        const previous = existingVideos[index]
        return {
          id: `storage:hero-videos:${file.id ?? file.name}`,
          title: previous?.title || titleFromPath(file.name),
          poster: firstGallery || previous?.poster || '',
          src: publicUrl('hero-videos', file.name),
          duration: previous?.duration || '',
        }
      })
    : null

  return {
    gallery,
    videos,
    heroVideoUrl: videos?.[0]?.src ?? null,
    heroPosterUrl: firstGallery,
  }
}
