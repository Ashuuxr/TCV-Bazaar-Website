-- Cover the foreign keys identified by the production performance advisor.
-- These indexes do not change RLS or application behavior; they improve joins,
-- deletes, and admin list queries as data volume grows.
create index if not exists activity_log_actor_id_idx on public.activity_log (actor_id);
create index if not exists booking_files_booking_id_idx on public.booking_files (booking_id);
create index if not exists bookings_event_id_idx on public.bookings (event_id);
create index if not exists bookings_package_id_idx on public.bookings (package_id);
create index if not exists bookings_stall_id_idx on public.bookings (stall_id);
create index if not exists brochure_versions_replaced_by_idx on public.brochure_versions (replaced_by);
create index if not exists brochures_event_id_idx on public.brochures (event_id);
create index if not exists brochures_uploaded_by_idx on public.brochures (uploaded_by);
create index if not exists company_profile_updated_by_idx on public.company_profile (updated_by);
create index if not exists gst_settings_updated_by_idx on public.gst_settings (updated_by);
create index if not exists invoice_settings_updated_by_idx on public.invoice_settings (updated_by);
create index if not exists packages_event_id_idx on public.packages (event_id);
create index if not exists site_content_versions_restored_from_idx on public.site_content_versions (restored_from_version_id);
create index if not exists stalls_event_id_idx on public.stalls (event_id);
create index if not exists stalls_held_by_idx on public.stalls (held_by);
create index if not exists stalls_pkg_id_idx on public.stalls (pkg_id);
create index if not exists tracking_integrations_updated_by_idx on public.tracking_integrations (updated_by);
create index if not exists user_roles_assigned_by_idx on public.user_roles (assigned_by);
