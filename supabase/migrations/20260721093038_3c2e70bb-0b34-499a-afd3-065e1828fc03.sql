ALTER PUBLICATION supabase_realtime ADD TABLE public.site_content;
ALTER TABLE public.site_content REPLICA IDENTITY FULL;