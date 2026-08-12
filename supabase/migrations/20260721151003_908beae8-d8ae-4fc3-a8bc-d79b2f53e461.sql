
UPDATE public.site_content
SET data = jsonb_set(
  COALESCE(data, '{}'::jsonb),
  '{hero,videoDataUrl}',
  '"https://crketizxwrbxalvtpklt.supabase.co/storage/v1/object/public/hero-videos/hero-drone-3.mp4"'::jsonb,
  true
)
WHERE id = 'main';
