begin;
create extension if not exists pgtap with schema extensions;
select extensions.no_plan();

-- Transaction-scoped fixtures; this test rolls them back at the end.
insert into auth.users (id, email) values
  ('00000000-0000-4000-8000-000000000501', 'stage5-nonadmin@example.invalid'),
  ('00000000-0000-4000-8000-000000000502', 'stage5-active-admin@example.invalid'),
  ('00000000-0000-4000-8000-000000000503', 'stage5-inactive-admin@example.invalid');

insert into public.admin_users (user_id, role, is_active) values
  ('00000000-0000-4000-8000-000000000502', 'admin', true),
  ('00000000-0000-4000-8000-000000000503', 'admin', false);

insert into public.profiles (full_name) values ('Stage 5 RLS fixture');
insert into public.projects (slug, title, is_published) values
  ('stage5-rls-published', 'Published fixture', true),
  ('stage5-rls-unpublished', 'Unpublished fixture', false);
insert into public.technologies (name, is_visible) values
  ('Stage 5 visible technology', true),
  ('Stage 5 hidden technology', false);
insert into public.project_technologies (project_id, technology_id)
select p.id, t.id from public.projects p cross join public.technologies t
where p.slug = 'stage5-rls-published'
  and t.name in ('Stage 5 visible technology', 'Stage 5 hidden technology');
insert into public.skills (name, is_visible) values
  ('Stage 5 visible skill', true), ('Stage 5 hidden skill', false);
insert into public.experiences (organization, position, is_published) values
  ('Stage 5 Public Org', 'Public Role', true), ('Stage 5 Draft Org', 'Draft Role', false);
insert into public.history_entries (title, event_date, is_published) values
  ('Stage 5 public event', date '2025-01-01', true), ('Stage 5 private event', date '2025-01-02', false);
insert into public.social_links (platform, url, is_visible) values
  ('Stage 5 public social', 'https://example.invalid/public', true),
  ('Stage 5 hidden social', 'https://example.invalid/hidden', false);
insert into public.site_settings (setting_key, setting_value) values
  ('hero.text', '"Stage 5 public title"'::jsonb), ('glow_cursor.intensity', '1.5'::jsonb);
insert into public.contact_messages (name, email, subject, message) values
  ('Stage 5 Sender', 'sender@example.invalid', 'Stage 5 inbox fixture', 'Private message fixture');
insert into public.media_assets (bucket_id, object_path, original_name, mime_type, size_bytes, is_public) values
  ('portfolio-public', 'stage5-test/public.png', 'public.png', 'image/png', 68, true),
  ('admin-private', 'stage5-test/private.pdf', 'private.pdf', 'application/pdf', 68, false);
insert into public.admin_activity_logs (actor_user_id, action, entity_type, entity_id)
values ('00000000-0000-4000-8000-000000000502', 'stage5-test', 'project', 'fixture');

-- RLS and grant baselines.
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.admin_users'::regclass), 'admin_users RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.profiles'::regclass), 'profiles RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.projects'::regclass), 'projects RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.technologies'::regclass), 'technologies RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.project_technologies'::regclass), 'project_technologies RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.skills'::regclass), 'skills RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.experiences'::regclass), 'experiences RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.history_entries'::regclass), 'history_entries RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.social_links'::regclass), 'social_links RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.site_settings'::regclass), 'site_settings RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.contact_messages'::regclass), 'contact_messages RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.media_assets'::regclass), 'media_assets RLS enabled');
select extensions.ok((select relrowsecurity from pg_class where oid = 'public.admin_activity_logs'::regclass), 'admin_activity_logs RLS enabled');
select extensions.is(has_table_privilege('anon', 'public.projects', 'select'), true, 'anon has public read grant');
select extensions.is(has_table_privilege('anon', 'public.projects', 'insert'), false, 'anon has no content write grant');
select extensions.is(has_table_privilege('authenticated', 'public.projects', 'insert'), true, 'authenticated writes remain subject to RLS');
select extensions.is(has_table_privilege('authenticated', 'public.admin_users', 'update'), false, 'authenticated cannot update admin membership');
select extensions.is(has_table_privilege('authenticated', 'public.admin_activity_logs', 'insert'), false, 'authenticated cannot forge logs');
select extensions.is(has_table_privilege('authenticated', 'public.admin_activity_logs', 'update'), false, 'authenticated cannot update logs');
select extensions.is(has_table_privilege('authenticated', 'public.admin_activity_logs', 'delete'), false, 'authenticated cannot delete logs');
select extensions.is(has_table_privilege('service_role', 'public.contact_messages', 'insert'), true, 'service_role can insert messages server-side');
select extensions.is(has_table_privilege('service_role', 'public.contact_messages', 'select'), false, 'service_role has no inbox read grant');
select extensions.is(has_table_privilege('service_role', 'public.contact_messages', 'update'), false, 'service_role cannot change inbox rows directly');
select extensions.is(has_table_privilege('service_role', 'public.contact_messages', 'delete'), false, 'service_role cannot delete inbox rows directly');
select extensions.is(has_table_privilege('service_role', 'public.admin_activity_logs', 'insert'), true, 'service_role can append logs');
select extensions.is(has_table_privilege('service_role', 'public.admin_activity_logs', 'select'), false, 'service_role has no log read grant');
select extensions.is(has_table_privilege('service_role', 'public.admin_activity_logs', 'update'), false, 'service_role cannot alter logs');
select extensions.is(has_table_privilege('service_role', 'public.admin_activity_logs', 'delete'), false, 'service_role cannot delete logs');
select extensions.is(has_sequence_privilege('anon', 'public.admin_activity_logs_id_seq', 'usage'), false, 'anon has no audit sequence usage');
select extensions.is(has_sequence_privilege('authenticated', 'public.admin_activity_logs_id_seq', 'usage'), false, 'authenticated has no audit sequence usage');
select extensions.is(has_sequence_privilege('service_role', 'public.admin_activity_logs_id_seq', 'usage'), true, 'server logger has required sequence usage');
select extensions.is(has_sequence_privilege('service_role', 'public.admin_activity_logs_id_seq', 'select'), false, 'server logger cannot read sequence state');
select extensions.is(has_sequence_privilege('service_role', 'public.admin_activity_logs_id_seq', 'update'), false, 'server logger cannot arbitrarily advance sequence');

select extensions.throws_ok(
  $$insert into public.site_settings (setting_key, setting_value) values ('private.smtp_password', '"not-public"'::jsonb)$$,
  '23514', null, 'unlisted private setting keys are rejected'
);
select extensions.ok(not exists (
  select 1 from information_schema.columns where table_schema = 'public'
  and table_name = 'site_settings' and column_name = 'is_public'
), 'site_settings has no visibility toggle');

-- PostgreSQL can verify bucket configuration and RLS predicates. Actual byte access is covered by a local Storage API test.
select extensions.ok((select relrowsecurity from pg_class where oid = 'storage.objects'::regclass), 'storage.objects RLS enabled');
select extensions.is((select public from storage.buckets where id = 'portfolio-public'), true, 'portfolio bucket is public');
select extensions.is((select public from storage.buckets where id = 'admin-private'), false, 'private bucket is not public');
select extensions.is((select count(*) from pg_policies where schemaname = 'storage' and tablename = 'objects'
  and policyname in ('admins can list portfolio media', 'admins can upload portfolio media',
    'admins can update portfolio media', 'admins can delete portfolio media',
    'admins can read private media', 'admins can upload private media',
    'admins can update private media', 'admins can delete private media')), 8::bigint,
  'each storage operation has a bucket-specific admin policy');
select extensions.ok(not exists (
  select 1 from pg_policies where schemaname = 'storage' and tablename = 'objects'
  and 'anon' = any(roles) and cmd in ('SELECT', 'INSERT', 'UPDATE', 'DELETE', 'ALL')
), 'storage objects have no anonymous policies');

-- Anonymous visitors see only published/visible content.
set local role anon;
set local request.jwt.claim.sub = '';
set local request.jwt.claims = '{}';
select extensions.is((select count(*) from public.profiles), 1::bigint, 'anon can read the public profile');
select extensions.is((select count(*) from public.projects where slug like 'stage5-rls-%'), 1::bigint, 'anon sees published projects only');
select extensions.is((select count(*) from public.technologies where name like 'Stage 5 %'), 1::bigint, 'anon sees visible technologies only');
select extensions.is((select count(*) from public.project_technologies pt join public.projects p on p.id = pt.project_id
  where p.slug = 'stage5-rls-published'), 1::bigint, 'anon sees links to published projects and visible technologies only');
select extensions.is((select count(*) from public.skills where name like 'Stage 5 %'), 1::bigint, 'anon sees visible skills only');
select extensions.is((select count(*) from public.experiences where organization like 'Stage 5 %'), 1::bigint, 'anon sees published experience only');
select extensions.is((select count(*) from public.history_entries where title like 'Stage 5 %'), 1::bigint, 'anon sees published history only');
select extensions.is((select count(*) from public.social_links where platform like 'Stage 5 %'), 1::bigint, 'anon sees visible social links only');
select extensions.is((select count(*) from public.site_settings), 2::bigint, 'allowlisted presentation settings are public');
select extensions.is((select count(*) from public.media_assets), 1::bigint, 'anon sees public media metadata only');
select extensions.throws_ok('select * from public.contact_messages', '42501', null, 'anon cannot read contact inbox');
select extensions.throws_ok('select * from public.admin_activity_logs', '42501', null, 'anon cannot read activity logs');
select extensions.throws_ok($$insert into public.projects (slug, title) values ('stage5-anon-write', 'Denied')$$, '42501', null, 'anon cannot insert projects');
select extensions.throws_ok($$update public.projects set title = 'Denied' where slug = 'stage5-rls-published'$$, '42501', null, 'anon cannot update projects');
select extensions.throws_ok($$delete from public.projects where slug = 'stage5-rls-published'$$, '42501', null, 'anon cannot delete projects');
reset role;

-- Authenticated non-admin: public reads only; RLS denies writes and private inbox access.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000501';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000501","role":"authenticated"}';
select extensions.is((select count(*) from public.projects where slug like 'stage5-rls-%'), 1::bigint, 'non-admin sees published projects only');
select extensions.throws_ok($$insert into public.projects (slug, title) values ('stage5-nonadmin-write', 'Denied')$$, '42501', null, 'non-admin project insert is rejected');
select extensions.is((with changed as (update public.projects set title = 'Denied' where slug = 'stage5-rls-published' returning id) select count(*) from changed), 0::bigint, 'non-admin project update affects no rows');
select extensions.is((with removed as (delete from public.projects where slug = 'stage5-rls-published' returning id) select count(*) from removed), 0::bigint, 'non-admin project delete affects no rows');
select extensions.is((select count(*) from public.contact_messages), 0::bigint, 'non-admin cannot read inbox');
select extensions.throws_ok($$insert into public.contact_messages (name, email, subject, message) values ('Denied', 'denied@example.invalid', 'Denied', 'Denied')$$, '42501', null, 'non-admin cannot submit inbox rows directly');
select extensions.is((with changed as (update public.contact_messages set status = 'read' where subject = 'Stage 5 inbox fixture' returning id) select count(*) from changed), 0::bigint, 'non-admin cannot update inbox messages');
select extensions.is((with removed as (delete from public.contact_messages where subject = 'Stage 5 inbox fixture' returning id) select count(*) from removed), 0::bigint, 'non-admin cannot delete inbox messages');
select extensions.is((select count(*) from public.admin_activity_logs), 0::bigint, 'non-admin cannot read activity logs');
select extensions.throws_ok($$insert into public.admin_activity_logs (action, entity_type) values ('forged', 'project')$$, '42501', null, 'non-admin cannot forge activity logs');
select extensions.throws_ok($$insert into public.skills (name) values ('Stage 5 denied skill')$$, '42501', null, 'non-admin cannot insert skills');
select extensions.is((with changed as (update public.skills set description = 'Denied' where name = 'Stage 5 visible skill' returning id) select count(*) from changed), 0::bigint, 'non-admin cannot update skills');
select extensions.is((with removed as (delete from public.skills where name = 'Stage 5 visible skill' returning id) select count(*) from removed), 0::bigint, 'non-admin cannot delete skills');
select extensions.throws_ok($$insert into public.site_settings (setting_key, setting_value) values ('profile_card.name', '"Denied"'::jsonb)$$, '42501', null, 'non-admin cannot insert settings');
select extensions.is((with changed as (update public.site_settings set setting_value = '"Denied"'::jsonb where setting_key = 'hero.text' returning id) select count(*) from changed), 0::bigint, 'non-admin cannot update settings');
select extensions.is((with removed as (delete from public.site_settings where setting_key = 'hero.text' returning id) select count(*) from removed), 0::bigint, 'non-admin cannot delete settings');
select extensions.throws_ok($$insert into public.media_assets (bucket_id, object_path, original_name, mime_type, size_bytes) values ('portfolio-public', 'denied.png', 'denied.png', 'image/png', 68)$$, '42501', null, 'non-admin cannot insert media metadata');
select extensions.is((with changed as (update public.media_assets set original_name = 'Denied.png' where object_path = 'stage5-test/public.png' returning id) select count(*) from changed), 0::bigint, 'non-admin cannot update media metadata');
select extensions.is((with removed as (delete from public.media_assets where object_path = 'stage5-test/public.png' returning id) select count(*) from removed), 0::bigint, 'non-admin cannot delete media metadata');
select extensions.throws_ok($$update public.admin_users set is_active = true where user_id = auth.uid()$$, '42501', null, 'non-admin cannot activate or change own role');
reset role;

-- Active admin can read drafts and perform permitted project/inbox CRUD.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000502';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000502","role":"authenticated"}';
select extensions.is((select count(*) from public.admin_users where user_id = auth.uid() and is_active), 1::bigint, 'active admin can read own membership');
select extensions.is((select count(*) from public.projects where slug like 'stage5-rls-%'), 2::bigint, 'active admin can read published and unpublished projects');
select extensions.is((select count(*) from public.contact_messages), 1::bigint, 'active admin can read inbox');
select extensions.is((select count(*) from public.admin_activity_logs), 1::bigint, 'active admin can read activity logs');
select extensions.lives_ok($$insert into public.projects (slug, title, is_published) values ('stage5-admin-created', 'Admin created', false)$$, 'active admin can insert a project');
select extensions.is((select count(*) from public.projects where slug = 'stage5-admin-created'), 1::bigint, 'admin insert persisted in transaction');
select extensions.lives_ok($$update public.projects set title = 'Admin updated' where slug = 'stage5-admin-created'$$, 'active admin can update a project');
select extensions.is((select title from public.projects where slug = 'stage5-admin-created'), 'Admin updated', 'admin update persisted');
select extensions.lives_ok($$delete from public.projects where slug = 'stage5-admin-created'$$, 'active admin can delete a project');
select extensions.is((select count(*) from public.projects where slug = 'stage5-admin-created'), 0::bigint, 'admin delete persisted');
select extensions.lives_ok($$update public.profiles set full_name = 'Admin updated profile'$$, 'active admin can update profile');
select extensions.is((select full_name from public.profiles), 'Admin updated profile', 'profile update persisted');
select extensions.lives_ok($$delete from public.profiles$$, 'active admin can delete profile');
select extensions.lives_ok($$insert into public.profiles (full_name) values ('Admin restored profile')$$, 'active admin can insert profile');
select extensions.lives_ok($$insert into public.technologies (name) values ('Stage 5 admin technology')$$, 'active admin can insert technology');
select extensions.lives_ok($$update public.technologies set category = 'Admin edited' where name = 'Stage 5 admin technology'$$, 'active admin can update technology');
select extensions.lives_ok($$delete from public.technologies where name = 'Stage 5 admin technology'$$, 'active admin can delete technology');
select extensions.lives_ok($$insert into public.skills (name) values ('Stage 5 admin skill')$$, 'active admin can insert skill');
select extensions.lives_ok($$update public.skills set description = 'Admin edited' where name = 'Stage 5 admin skill'$$, 'active admin can update skill');
select extensions.lives_ok($$delete from public.skills where name = 'Stage 5 admin skill'$$, 'active admin can delete skill');
select extensions.lives_ok($$insert into public.experiences (organization, position) values ('Admin Org', 'Admin Role')$$, 'active admin can insert experience');
select extensions.lives_ok($$update public.experiences set description = 'Admin edited' where organization = 'Admin Org'$$, 'active admin can update experience');
select extensions.lives_ok($$delete from public.experiences where organization = 'Admin Org'$$, 'active admin can delete experience');
select extensions.lives_ok($$insert into public.history_entries (title, event_date) values ('Admin event', date '2025-02-01')$$, 'active admin can insert history');
select extensions.lives_ok($$update public.history_entries set description = 'Admin edited' where title = 'Admin event'$$, 'active admin can update history');
select extensions.lives_ok($$delete from public.history_entries where title = 'Admin event'$$, 'active admin can delete history');
select extensions.lives_ok($$insert into public.social_links (platform, url) values ('Admin link', 'https://example.invalid/admin')$$, 'active admin can insert social link');
select extensions.lives_ok($$update public.social_links set label = 'Admin edited' where platform = 'Admin link'$$, 'active admin can update social link');
select extensions.lives_ok($$delete from public.social_links where platform = 'Admin link'$$, 'active admin can delete social link');
select extensions.lives_ok($$insert into public.site_settings (setting_key, setting_value) values ('profile_card.name', '"Admin name"'::jsonb)$$, 'active admin can insert allowlisted settings');
select extensions.lives_ok($$update public.site_settings set setting_value = '"Updated name"'::jsonb where setting_key = 'profile_card.name'$$, 'active admin can update settings');
select extensions.lives_ok($$delete from public.site_settings where setting_key = 'profile_card.name'$$, 'active admin can delete settings');
select extensions.lives_ok($$insert into public.media_assets (bucket_id, object_path, original_name, mime_type, size_bytes) values ('portfolio-public', 'stage5-test/admin.png', 'admin.png', 'image/png', 68)$$, 'active admin can insert media metadata');
select extensions.lives_ok($$update public.media_assets set original_name = 'edited.png' where object_path = 'stage5-test/admin.png'$$, 'active admin can update media metadata');
select extensions.lives_ok($$delete from public.media_assets where object_path = 'stage5-test/admin.png'$$, 'active admin can delete media metadata');
select extensions.lives_ok($$insert into public.projects (slug, title) values ('stage5-link-project', 'Link project')$$, 'active admin can create project for junction test');
select extensions.lives_ok($$insert into public.technologies (name) values ('Stage 5 junction technology')$$, 'active admin can create technology for junction test');
select extensions.lives_ok($$insert into public.project_technologies (project_id, technology_id)
  select p.id, t.id from public.projects p cross join public.technologies t
  where p.slug = 'stage5-link-project' and t.name = 'Stage 5 junction technology'$$, 'active admin can insert project technology link');
select extensions.lives_ok($$update public.project_technologies pt set technology_id = t.id
  from public.technologies t where pt.project_id = (select id from public.projects where slug = 'stage5-link-project')
  and t.name = 'Stage 5 visible technology'$$, 'active admin can update project technology link');
select extensions.lives_ok($$delete from public.project_technologies where project_id = (select id from public.projects where slug = 'stage5-link-project')$$, 'active admin can delete project technology link');
select extensions.lives_ok($$delete from public.projects where slug = 'stage5-link-project'$$, 'active admin can delete junction test project');
select extensions.lives_ok($$delete from public.technologies where name = 'Stage 5 junction technology'$$, 'active admin can delete junction test technology');
select extensions.lives_ok($$update public.contact_messages set status = 'read' where subject = 'Stage 5 inbox fixture'$$, 'active admin can update inbox status');
select extensions.is((select status from public.contact_messages where subject = 'Stage 5 inbox fixture'), 'read', 'admin inbox update persisted');
select extensions.lives_ok($$delete from public.contact_messages where subject = 'Stage 5 inbox fixture'$$, 'active admin can delete inbox message');
select extensions.is((select count(*) from public.contact_messages), 0::bigint, 'admin inbox delete persisted');
select extensions.throws_ok($$insert into public.admin_activity_logs (actor_user_id, action, entity_type) values (auth.uid(), 'forged', 'project')$$, '42501', null, 'admin cannot forge logs through authenticated client');
select extensions.throws_ok($$update public.admin_users set is_active = false where user_id = auth.uid()$$, '42501', null, 'admin cannot deactivate own membership');
select extensions.throws_ok($$update public.admin_users set role = 'owner' where user_id = auth.uid()$$, '42501', null, 'admin cannot escalate own role');
select extensions.throws_ok($$insert into public.admin_users (user_id, role) values ('00000000-0000-4000-8000-000000000501', 'admin')$$, '42501', null, 'admin cannot provision another admin');
reset role;

-- Inactive admin has no CMS privileges.
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-4000-8000-000000000503';
set local request.jwt.claims = '{"sub":"00000000-0000-4000-8000-000000000503","role":"authenticated"}';
select extensions.is((select count(*) from public.admin_users where user_id = auth.uid() and not is_active), 1::bigint, 'inactive admin can identify own inactive membership');
select extensions.is((select count(*) from public.projects where slug like 'stage5-rls-%'), 1::bigint, 'inactive admin sees published projects only');
select extensions.throws_ok($$insert into public.projects (slug, title) values ('stage5-inactive-write', 'Denied')$$, '42501', null, 'inactive admin cannot insert projects');
select extensions.is((with changed as (update public.projects set title = 'Denied' where slug = 'stage5-rls-published' returning id) select count(*) from changed), 0::bigint, 'inactive admin cannot update projects');
select extensions.is((with removed as (delete from public.projects where slug = 'stage5-rls-published' returning id) select count(*) from removed), 0::bigint, 'inactive admin cannot delete projects');
select extensions.is((select count(*) from public.contact_messages), 0::bigint, 'inactive admin cannot read inbox');
select extensions.is((with changed as (update public.contact_messages set status = 'read' where subject = 'Stage 5 inbox fixture' returning id) select count(*) from changed), 0::bigint, 'inactive admin cannot update inbox messages');
select extensions.is((with removed as (delete from public.contact_messages where subject = 'Stage 5 inbox fixture' returning id) select count(*) from removed), 0::bigint, 'inactive admin cannot delete inbox messages');
select extensions.is((select count(*) from public.admin_activity_logs), 0::bigint, 'inactive admin cannot read activity logs');
select extensions.throws_ok($$update public.admin_users set is_active = true where user_id = auth.uid()$$, '42501', null, 'inactive admin cannot reactivate self');
select extensions.throws_ok($$update public.admin_users set role = 'owner' where user_id = auth.uid()$$, '42501', null, 'inactive admin cannot change own role');
reset role;

-- service_role may append to these two server paths, but cannot read or mutate audit records.
set local role service_role;
select extensions.lives_ok($$insert into public.admin_activity_logs (actor_user_id, action, entity_type) values ('00000000-0000-4000-8000-000000000502', 'server-append', 'project')$$, 'service_role can append an audit event');
select extensions.throws_ok('select * from public.admin_activity_logs', '42501', null, 'service_role has no audit read grant');
select extensions.throws_ok($$update public.admin_activity_logs set action = 'tampered'$$, '42501', null, 'service_role cannot update audit events');
select extensions.throws_ok('delete from public.admin_activity_logs', '42501', null, 'service_role cannot delete audit events');
select extensions.lives_ok($$insert into public.contact_messages (name, email, subject, message) values ('Server route', 'route@example.invalid', 'Validated route', 'Server-only insert')$$, 'service_role can insert through trusted route');
select extensions.throws_ok('select * from public.contact_messages', '42501', null, 'service_role has no inbox read grant');
reset role;

select * from extensions.finish();
rollback;
