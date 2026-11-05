import { isSupabaseConfigured } from '@/lib/supabase/config';
import { createSupabaseServerClient } from '@/lib/supabase/server';

const imageSettingKeys = new Set([
  'profile_card.icon_pattern', 'scroll_expand.media_path',
  'lanyard.front_image', 'lanyard.back_image', 'lanyard.strap_image'
]);

function publicImageUrl(supabase, path) {
  if (!path) return null;
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('/')) return path;
  return supabase.storage.from('portfolio-public').getPublicUrl(path).data.publicUrl;
}

export async function getPublicPortfolioData() {
  if (!isSupabaseConfigured()) return null;

  try {
    const supabase = await createSupabaseServerClient();
    const [profiles, projects, technologies, projectTechnologies, skills, experiences, history, social, settings] = await Promise.all([
      supabase.from('profiles').select('*').eq('is_primary', true).maybeSingle(),
      supabase.from('projects').select('*').eq('is_published', true).order('featured', { ascending: false }).order('sort_order'),
      supabase.from('technologies').select('*').eq('is_visible', true).order('sort_order'),
      supabase.from('project_technologies').select('*'),
      supabase.from('skills').select('*').eq('is_visible', true).order('sort_order'),
      supabase.from('experiences').select('*').eq('is_published', true).order('sort_order'),
      supabase.from('history_entries').select('*').eq('is_published', true).order('sort_order'),
      supabase.from('social_links').select('*').eq('is_visible', true).order('sort_order'),
      supabase.from('site_settings').select('setting_key,setting_value')
    ]);

    const technologyNames = new Map((technologies.data ?? []).map((item) => [item.id, item.name]));
    const projectTechnologyNames = new Map();
    for (const link of projectTechnologies.data ?? []) {
      if (!projectTechnologyNames.has(link.project_id)) projectTechnologyNames.set(link.project_id, []);
      const name = technologyNames.get(link.technology_id);
      if (name) projectTechnologyNames.get(link.project_id).push(name);
    }

    return {
      profile: profiles.data ? {
        ...profiles.data,
        avatar_url: publicImageUrl(supabase, profiles.data.avatar_path),
        profile_icon_url: publicImageUrl(supabase, profiles.data.profile_icon_path)
      } : null,
      projects: (projects.data ?? []).map((item) => ({
        ...item,
        cover_url: publicImageUrl(supabase, item.cover_path),
        preview_urls: (Array.isArray(item.preview_paths) ? item.preview_paths : [])
          .map((path) => publicImageUrl(supabase, path)).filter(Boolean),
        technologies: projectTechnologyNames.get(item.id) ?? []
      })),
      technologies: technologies.data ?? [],
      skills: skills.data ?? [],
      experiences: (experiences.data ?? []).map((item) => ({ ...item, logo_url: publicImageUrl(supabase, item.logo_path) })),
      history: (history.data ?? []).map((item) => ({
        ...item,
        image_url: publicImageUrl(supabase, item.image_path),
        preview_urls: (Array.isArray(item.preview_paths) ? item.preview_paths : [])
          .map((path) => publicImageUrl(supabase, path)).filter(Boolean)
      })),
      social: social.data ?? [],
      settings: Object.fromEntries((settings.data ?? []).map(({ setting_key, setting_value }) => [
        setting_key,
        imageSettingKeys.has(setting_key) && typeof setting_value === 'string'
          ? publicImageUrl(supabase, setting_value)
          : setting_value
      ]))
    };
  } catch {
    return null;
  }
}
