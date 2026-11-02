-- Allow admins to choose between page-scroll and component-scroll progress.
alter table public.site_settings
  drop constraint site_settings_setting_key_check,
  add constraint site_settings_setting_key_check check (setting_key = any (array[
    'appearance.primary_accent', 'appearance.secondary_accent',
    'hero.text', 'hero.tech_loop', 'scroll_velocity.texts',
    'profile_card.name', 'profile_card.title', 'profile_card.status', 'profile_card.handle',
    'profile_card.icon_pattern', 'profile_card.contact_text', 'profile_card.status_color',
    'profile_card.theme', 'profile_card.radius', 'profile_card.holo', 'profile_card.glare',
    'profile_card.enable_tilt', 'profile_card.tilt_strength', 'profile_card.parallax',
    'profile_card.enable_mobile_tilt', 'profile_card.mobile_tilt_sensitivity',
    'profile_card.intro', 'profile_card.show_user_info',
    'scroll_expand.title', 'scroll_expand.scroll_hint', 'scroll_expand.media_path', 'scroll_expand.alt',
    'scroll_expand.kicker', 'scroll_expand.name', 'scroll_expand.subtitle', 'scroll_expand.description',
    'scroll_expand.start_width', 'scroll_expand.start_height', 'scroll_expand.start_radius',
    'scroll_expand.end_radius', 'scroll_expand.media_zoom', 'scroll_expand.scroll_distance',
    'scroll_expand.hold_distance', 'scroll_expand.smoothing', 'scroll_expand.overlay_scrim',
    'scroll_expand.use_window_scroll',
    'lanyard.front_image', 'lanyard.back_image', 'lanyard.strap_image',
    'lanyard.card_color', 'lanyard.strap_color', 'lanyard.size', 'lanyard.orientation',
    'lanyard.finish', 'lanyard.anchor', 'lanyard.image_fit', 'lanyard.corner_radius', 'lanyard.strap_length',
    'lanyard.strap_width', 'lanyard.metal', 'lanyard.gravity', 'lanyard.damping',
    'lanyard.elasticity', 'lanyard.breeze', 'lanyard.interactive', 'lanyard.intro',
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
        'lanyard.card_color', 'lanyard.strap_color', 'profile_card.status_color'
      ) then jsonb_typeof(setting_value) = 'string'
        and setting_value #>> '{}' ~ '^#[0-9A-Fa-f]{6}$'
      when setting_key in (
        'glow_cursor.intensity', 'lanyard.size', 'lanyard.strap_length', 'lanyard.strap_width',
        'lanyard.gravity', 'lanyard.damping', 'lanyard.elasticity', 'lanyard.breeze',
        'lanyard.corner_radius', 'profile_card.radius', 'profile_card.holo', 'profile_card.glare',
        'profile_card.tilt_strength', 'profile_card.parallax', 'profile_card.mobile_tilt_sensitivity',
        'scroll_expand.start_width', 'scroll_expand.start_height', 'scroll_expand.start_radius',
        'scroll_expand.end_radius', 'scroll_expand.media_zoom', 'scroll_expand.scroll_distance',
        'scroll_expand.hold_distance', 'scroll_expand.smoothing', 'scroll_expand.overlay_scrim'
      ) then case when jsonb_typeof(setting_value) = 'number' then
        case setting_key
          when 'glow_cursor.intensity' then (setting_value #>> '{}')::numeric between 0 and 3
          when 'lanyard.size' then (setting_value #>> '{}')::numeric between 0.35 and 1.25
          when 'lanyard.strap_length' then (setting_value #>> '{}')::numeric between 0.2 and 1.2
          when 'lanyard.strap_width' then (setting_value #>> '{}')::numeric between 0.4 and 2
          when 'lanyard.gravity' then (setting_value #>> '{}')::numeric between 0 and 3
          when 'lanyard.damping' then (setting_value #>> '{}')::numeric between 0 and 1
          when 'lanyard.elasticity' then (setting_value #>> '{}')::numeric between 0 and 1
          when 'lanyard.breeze' then (setting_value #>> '{}')::numeric between 0 and 1
          when 'lanyard.corner_radius' then (setting_value #>> '{}')::numeric between 0 and 0.5
          when 'profile_card.radius' then (setting_value #>> '{}')::numeric between 0 and 40
          when 'profile_card.holo' then (setting_value #>> '{}')::numeric between 0 and 1
          when 'profile_card.glare' then (setting_value #>> '{}')::numeric between 0 and 1
          when 'profile_card.tilt_strength' then (setting_value #>> '{}')::numeric between 0 and 30
          when 'profile_card.parallax' then (setting_value #>> '{}')::numeric between 0 and 24
          when 'profile_card.mobile_tilt_sensitivity' then (setting_value #>> '{}')::numeric between 0 and 15
          when 'scroll_expand.start_width' then (setting_value #>> '{}')::numeric between 10 and 100
          when 'scroll_expand.start_height' then (setting_value #>> '{}')::numeric between 10 and 100
          when 'scroll_expand.start_radius' then (setting_value #>> '{}')::numeric between 0 and 80
          when 'scroll_expand.end_radius' then (setting_value #>> '{}')::numeric between 0 and 80
          when 'scroll_expand.media_zoom' then (setting_value #>> '{}')::numeric between 1 and 2
          when 'scroll_expand.scroll_distance' then (setting_value #>> '{}')::numeric between 0.5 and 3
          when 'scroll_expand.hold_distance' then (setting_value #>> '{}')::numeric between 0 and 1
          when 'scroll_expand.smoothing' then (setting_value #>> '{}')::numeric between 0.01 and 0.5
          when 'scroll_expand.overlay_scrim' then (setting_value #>> '{}')::numeric between 0 and 1
          else false
        end
        else false end
      when setting_key in (
        'profile_card.enable_tilt', 'profile_card.enable_mobile_tilt', 'profile_card.intro',
        'profile_card.show_user_info', 'lanyard.interactive', 'lanyard.intro', 'scroll_expand.use_window_scroll'
      ) or setting_key like 'components.%.enabled'
        then jsonb_typeof(setting_value) = 'boolean'
      when setting_key in ('hero.tech_loop', 'scroll_velocity.texts')
        then case when jsonb_typeof(setting_value) = 'array'
          then jsonb_array_length(setting_value) between 1 and 12 else false end
      when setting_key = 'profile_card.theme'
        then setting_value in ('"dark"'::jsonb, '"light"'::jsonb)
      when setting_key = 'lanyard.orientation'
        then setting_value in ('"portrait"'::jsonb, '"landscape"'::jsonb)
      when setting_key = 'lanyard.finish'
        then setting_value in ('"glossy"'::jsonb, '"matte"'::jsonb, '"holographic"'::jsonb, '"metallic"'::jsonb)
      when setting_key = 'lanyard.anchor'
        then setting_value in ('"left"'::jsonb, '"center"'::jsonb, '"right"'::jsonb)
      when setting_key = 'lanyard.metal'
        then setting_value in ('"silver"'::jsonb, '"gold"'::jsonb, '"graphite"'::jsonb)
      when setting_key = 'lanyard.image_fit'
        then setting_value in ('"cover"'::jsonb, '"contain"'::jsonb)
      else jsonb_typeof(setting_value) = 'string'
        and char_length(setting_value #>> '{}') between 1 and 500
    end
  );

insert into public.site_settings (setting_key, setting_value)
values ('scroll_expand.use_window_scroll', 'true'::jsonb)
on conflict (setting_key) do nothing;
