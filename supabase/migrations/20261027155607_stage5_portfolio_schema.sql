-- Portfolio schema, access policies, and Storage buckets.
-- Apply only to a local Supabase stack or an explicitly approved project.

create schema portfolio_private;
revoke all on schema portfolio_private from public, anon, authenticated;

create function portfolio_private.set_updated_at()
returns trigger
language plpgsql
set search_path = pg_catalog
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;
revoke all on function portfolio_private.set_updated_at() from public, anon, authenticated;

create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'admin' check (role = 'admin'),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  is_primary boolean not null default true unique check (is_primary),
  full_name text not null,
  professional_title text not null default '',
  headline text not null default '',
  bio text not null default '',
  location text,
  availability_status text not null default '',
  avatar_path text,
  profile_icon_path text,
  handle text,
  updated_at timestamptz not null default now()
);

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  title text not null,
  summary text not null default '',
  description text not null default '',
  cover_path text,
  github_url text,
  demo_url text,
  featured boolean not null default false,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.technologies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  category text not null default '',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.project_technologies (
  project_id uuid not null references public.projects(id) on delete cascade,
  technology_id uuid not null references public.technologies(id) on delete cascade,
  primary key (project_id, technology_id)
);

create table public.skills (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null default '',
  icon text,
  description text not null default '',
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.experiences (
  id uuid primary key default gen_random_uuid(),
  organization text not null,
  position text not null,
  start_date date,
  end_date date,
  is_current boolean not null default false,
  description text not null default '',
  logo_path text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint experiences_date_order check (end_date is null or start_date is null or end_date >= start_date),
  constraint experiences_current_end_date check (not is_current or end_date is null)
);

create table public.history_entries (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  event_date date not null,
  category text not null default '',
  image_path text,
  sort_order integer not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.social_links (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  label text not null default '',
  url text not null,
  sort_order integer not null default 0,
  is_visible boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique check (setting_key = any (array[
    'appearance.primary_accent', 'appearance.secondary_accent',
    'hero.text', 'hero.tech_loop', 'scroll_velocity.texts',
    'profile_card.name', 'profile_card.title', 'profile_card.status',
    'profile_card.handle', 'profile_card.icon_pattern',
    'scroll_expand.title', 'scroll_expand.scroll_hint', 'scroll_expand.media_path',
    'glow_cursor.color', 'glow_cursor.intensity',
    'components.pill_nav.enabled', 'components.tech_text.enabled',
    'components.text_loop.enabled', 'components.scroll_velocity.enabled',
    'components.profile_card.enabled', 'components.lanyard.enabled',
    'components.card_swap.enabled', 'components.scroll_expand.enabled',
    'components.glow_cursor.enabled'
  ])),
  setting_value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  constraint site_settings_public_value_shape check (
    case
      when setting_key in ('appearance.primary_accent', 'appearance.secondary_accent', 'glow_cursor.color')
        then jsonb_typeof(setting_value) = 'string' and setting_value #>> '{}' ~ '^#[0-9A-Fa-f]{6}$'
      when setting_key = 'glow_cursor.intensity'
        then case when jsonb_typeof(setting_value) = 'number'
          then (setting_value #>> '{}')::numeric between 0 and 3 else false end
      when setting_key in ('hero.tech_loop', 'scroll_velocity.texts')
        then case when jsonb_typeof(setting_value) = 'array'
          then jsonb_array_length(setting_value) between 1 and 12 else false end
      when setting_key like 'components.%.enabled'
        then jsonb_typeof(setting_value) = 'boolean'
      else jsonb_typeof(setting_value) = 'string'
        and char_length(setting_value #>> '{}') between 1 and 500
    end
  )
);
comment on table public.site_settings is
  'Allowlisted public presentation settings only. Store secrets and private settings elsewhere.';

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  subject text not null,
  message text not null,
  status text not null default 'unread' check (status in ('unread', 'read', 'archived')),
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  bucket_id text not null check (bucket_id in ('portfolio-public', 'admin-private')),
  object_path text not null,
  original_name text not null,
  mime_type text not null,
  size_bytes bigint not null check (size_bytes > 0),
  is_public boolean not null default false,
  uploaded_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (bucket_id, object_path)
);

create table public.admin_activity_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index projects_public_order_idx on public.projects (sort_order, created_at desc) where is_published;
create index projects_featured_order_idx on public.projects (sort_order) where is_published and featured;
create index project_technologies_technology_idx on public.project_technologies (technology_id);
create index technologies_visible_order_idx on public.technologies (sort_order, name) where is_visible;
create index skills_visible_order_idx on public.skills (sort_order, name) where is_visible;
create index experiences_public_order_idx on public.experiences (sort_order, start_date desc) where is_published;
create index history_entries_public_order_idx on public.history_entries (sort_order, event_date desc) where is_published;
create index social_links_visible_order_idx on public.social_links (sort_order) where is_visible;
create index contact_messages_inbox_idx on public.contact_messages (status, created_at desc);
create index media_assets_public_idx on public.media_assets (created_at desc) where is_public;
create index admin_activity_logs_recent_idx on public.admin_activity_logs (created_at desc);

create trigger admin_users_updated_at before update on public.admin_users
for each row execute function portfolio_private.set_updated_at();
create trigger profiles_updated_at before update on public.profiles
for each row execute function portfolio_private.set_updated_at();
create trigger projects_updated_at before update on public.projects
for each row execute function portfolio_private.set_updated_at();
create trigger technologies_updated_at before update on public.technologies
for each row execute function portfolio_private.set_updated_at();
create trigger skills_updated_at before update on public.skills
for each row execute function portfolio_private.set_updated_at();
create trigger experiences_updated_at before update on public.experiences
for each row execute function portfolio_private.set_updated_at();
create trigger history_entries_updated_at before update on public.history_entries
for each row execute function portfolio_private.set_updated_at();
create trigger social_links_updated_at before update on public.social_links
for each row execute function portfolio_private.set_updated_at();
create trigger site_settings_updated_at before update on public.site_settings
for each row execute function portfolio_private.set_updated_at();

alter table public.admin_users enable row level security;
alter table public.profiles enable row level security;
alter table public.projects enable row level security;
alter table public.technologies enable row level security;
alter table public.project_technologies enable row level security;
alter table public.skills enable row level security;
alter table public.experiences enable row level security;
alter table public.history_entries enable row level security;
alter table public.social_links enable row level security;
alter table public.site_settings enable row level security;
alter table public.contact_messages enable row level security;
alter table public.media_assets enable row level security;
alter table public.admin_activity_logs enable row level security;

revoke all on table public.admin_users, public.profiles, public.projects, public.technologies,
  public.project_technologies, public.skills, public.experiences, public.history_entries,
  public.social_links, public.site_settings, public.contact_messages, public.media_assets,
  public.admin_activity_logs from anon, authenticated, service_role;
revoke all on sequence public.admin_activity_logs_id_seq from anon, authenticated, service_role;

grant select on table public.admin_users to authenticated;
grant select on table public.profiles, public.projects, public.technologies,
  public.project_technologies, public.skills, public.experiences, public.history_entries,
  public.social_links, public.site_settings, public.media_assets to anon, authenticated;
grant insert, update, delete on table public.profiles, public.projects, public.technologies,
  public.project_technologies, public.skills, public.experiences, public.history_entries,
  public.social_links, public.site_settings, public.media_assets to authenticated;
grant select, update, delete on table public.contact_messages to authenticated;
grant select on table public.admin_activity_logs to authenticated;
grant insert on table public.contact_messages to service_role;
grant insert on table public.admin_activity_logs to service_role;
grant usage on sequence public.admin_activity_logs_id_seq to service_role;

create policy "admins can read own membership" on public.admin_users
for select to authenticated
using ((select auth.uid()) = user_id);

create policy "published profile is public" on public.profiles
for select to anon, authenticated using (true);
create policy "admins can insert profiles" on public.profiles for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update profiles" on public.profiles for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete profiles" on public.profiles for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "published projects are public" on public.projects
for select to anon, authenticated using (is_published);
create policy "admins can read all projects" on public.projects for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can insert projects" on public.projects for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update projects" on public.projects for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete projects" on public.projects for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "visible technologies are public" on public.technologies
for select to anon, authenticated using (is_visible);
create policy "admins can read all technologies" on public.technologies for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can insert technologies" on public.technologies for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update technologies" on public.technologies for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete technologies" on public.technologies for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "published project technology links are public" on public.project_technologies
for select to anon, authenticated using (
  exists (select 1 from public.projects p where p.id = project_id and p.is_published)
  and exists (select 1 from public.technologies t where t.id = technology_id and t.is_visible)
);
create policy "admins can read all project technology links" on public.project_technologies for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can insert project technology links" on public.project_technologies for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update project technology links" on public.project_technologies for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete project technology links" on public.project_technologies for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "visible skills are public" on public.skills
for select to anon, authenticated using (is_visible);
create policy "admins can read all skills" on public.skills for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can insert skills" on public.skills for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update skills" on public.skills for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete skills" on public.skills for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "published experiences are public" on public.experiences
for select to anon, authenticated using (is_published);
create policy "admins can read all experiences" on public.experiences for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can insert experiences" on public.experiences for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update experiences" on public.experiences for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete experiences" on public.experiences for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "published history is public" on public.history_entries
for select to anon, authenticated using (is_published);
create policy "admins can read all history" on public.history_entries for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can insert history" on public.history_entries for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update history" on public.history_entries for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete history" on public.history_entries for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "visible social links are public" on public.social_links
for select to anon, authenticated using (is_visible);
create policy "admins can read all social links" on public.social_links for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can insert social links" on public.social_links for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update social links" on public.social_links for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete social links" on public.social_links for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "public settings are public" on public.site_settings
for select to anon, authenticated using (true);
create policy "admins can read all settings" on public.site_settings for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can insert settings" on public.site_settings for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update settings" on public.site_settings for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete settings" on public.site_settings for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "admins can read contact messages" on public.contact_messages for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update contact messages" on public.contact_messages for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete contact messages" on public.contact_messages for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "public media metadata is public" on public.media_assets
for select to anon, authenticated using (is_public and bucket_id = 'portfolio-public');
create policy "admins can read all media metadata" on public.media_assets for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can insert media metadata" on public.media_assets for insert to authenticated
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can update media metadata" on public.media_assets for update to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active))
with check (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
create policy "admins can delete media metadata" on public.media_assets for delete to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));

create policy "admins can read activity logs" on public.admin_activity_logs for select to authenticated
using (exists (select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active));
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('portfolio-public', 'portfolio-public', true, 15728640, array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('admin-private', 'admin-private', false, 20971520, array['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'application/pdf']);

create policy "admins can list portfolio media" on storage.objects for select to authenticated
using (bucket_id = 'portfolio-public' and exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active
));
create policy "admins can upload portfolio media" on storage.objects for insert to authenticated
with check (bucket_id = 'portfolio-public' and exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active
));
create policy "admins can update portfolio media" on storage.objects for update to authenticated
using (bucket_id = 'portfolio-public' and exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active
))
with check (bucket_id = 'portfolio-public' and exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active
));
create policy "admins can delete portfolio media" on storage.objects for delete to authenticated
using (bucket_id = 'portfolio-public' and exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active
));

create policy "admins can read private media" on storage.objects for select to authenticated
using (bucket_id = 'admin-private' and exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active
));
create policy "admins can upload private media" on storage.objects for insert to authenticated
with check (bucket_id = 'admin-private' and exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active
));
create policy "admins can update private media" on storage.objects for update to authenticated
using (bucket_id = 'admin-private' and exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active
))
with check (bucket_id = 'admin-private' and exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active
));
create policy "admins can delete private media" on storage.objects for delete to authenticated
using (bucket_id = 'admin-private' and exists (
  select 1 from public.admin_users a where a.user_id = (select auth.uid()) and a.is_active
));
