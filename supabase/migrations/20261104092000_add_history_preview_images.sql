alter table public.history_entries
  add column if not exists preview_paths text[] not null default '{}'::text[];
