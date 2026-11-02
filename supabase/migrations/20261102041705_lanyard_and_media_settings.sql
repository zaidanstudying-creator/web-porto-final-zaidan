-- Extend the public presentation allowlist for editable Lanyard artwork and colors.
-- Existing rows and their values remain unchanged.
alter table public.site_settings
  drop constraint site_settings_setting_key_check,
  add constraint site_settings_setting_key_check check (setting_key = any (array[
    'appearance.primary_accent', 'appearance.secondary_accent',
    'hero.text', 'hero.tech_loop', 'scroll_velocity.texts',
    'profile_card.name', 'profile_card.title', 'profile_card.status',
    'profile_card.handle', 'profile_card.icon_pattern',
    'scroll_expand.title', 'scroll_expand.scroll_hint', 'scroll_expand.media_path',
    'lanyard.front_image', 'lanyard.back_image', 'lanyard.strap_image',
    'lanyard.card_color', 'lanyard.strap_color', 'lanyard.size',
    'glow_cursor.color', 'glow_cursor.intensity',
    'components.pill_nav.enabled', 'components.tech_text.enabled',
    'components.text_loop.enabled', 'components.scroll_velocity.enabled',
    'components.profile_card.enabled', 'components.lanyard.enabled',
    'components.card_swap.enabled', 'components.scroll_expand.enabled',
    'components.glow_cursor.enabled'
  ]));

alter table public.site_settings
  drop constraint site_settings_public_value_shape,
  add constraint site_settings_public_value_shape check (
    case
      when setting_key in (
        'appearance.primary_accent', 'appearance.secondary_accent', 'glow_cursor.color',
        'lanyard.card_color', 'lanyard.strap_color'
      ) then jsonb_typeof(setting_value) = 'string'
        and setting_value #>> '{}' ~ '^#[0-9A-Fa-f]{6}$'
      when setting_key = 'glow_cursor.intensity'
        then case when jsonb_typeof(setting_value) = 'number'
          then (setting_value #>> '{}')::numeric between 0 and 3 else false end
      when setting_key = 'lanyard.size'
        then case when jsonb_typeof(setting_value) = 'number'
          then (setting_value #>> '{}')::numeric between 0.35 and 1.25 else false end
      when setting_key in ('hero.tech_loop', 'scroll_velocity.texts')
        then case when jsonb_typeof(setting_value) = 'array'
          then jsonb_array_length(setting_value) between 1 and 12 else false end
      when setting_key like 'components.%.enabled'
        then jsonb_typeof(setting_value) = 'boolean'
      else jsonb_typeof(setting_value) = 'string'
        and char_length(setting_value #>> '{}') between 1 and 500
    end
  );
