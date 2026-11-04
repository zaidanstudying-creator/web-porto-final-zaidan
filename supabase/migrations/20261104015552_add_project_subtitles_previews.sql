alter table public.projects
  add column if not exists subtitle text not null default '',
  add column if not exists preview_paths text[] not null default '{}'::text[];
