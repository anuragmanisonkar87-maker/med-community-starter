-- ─────────────────────────────────────────────────────────────
-- MedWealth Circle — Bunny Stream video id on lessons. Run AFTER schema-05.
-- Idempotent.
-- ─────────────────────────────────────────────────────────────

-- Bunny Stream video GUID for a lesson (large-video hosting).
alter table public.course_modules add column if not exists bunny_video_id text;
