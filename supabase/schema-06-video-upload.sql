-- ─────────────────────────────────────────────────────────────
-- MedWealth Circle — direct video upload (Supabase Storage).
-- Adds a video_url column and a public storage bucket. Run AFTER schema-05.
-- Idempotent.
-- ─────────────────────────────────────────────────────────────

-- Direct-file video URL on a lesson (in addition to the YouTube video_id).
alter table public.course_modules add column if not exists video_url text;

-- Storage bucket for uploaded course videos (public read).
insert into storage.buckets (id, name, public)
values ('course-videos', 'course-videos', true)
on conflict (id) do nothing;

-- Any signed-in user may upload into this bucket; anyone may read (play) them.
drop policy if exists "course videos insert" on storage.objects;
create policy "course videos insert" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'course-videos');

drop policy if exists "course videos read" on storage.objects;
create policy "course videos read" on storage.objects
  for select
  using (bucket_id = 'course-videos');

drop policy if exists "course videos delete own" on storage.objects;
create policy "course videos delete own" on storage.objects
  for delete to authenticated
  using (bucket_id = 'course-videos' and owner = auth.uid());
