'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { logoutAdmin } from '../actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import styles from './admin-dashboard.module.css';

const nav = [
  ['overview', 'Overview'], ['profiles', 'Profile'], ['projects', 'Projects'],
  ['technologies', 'Technologies'], ['skills', 'Skills'], ['experiences', 'Experience'],
  ['history_entries', 'History'], ['certificates', 'Sertifikat'], ['social_links', 'Social links'], ['site_settings', 'Section editor'],
  ['contact_messages', 'Inbox'], ['media_assets', 'Media']
];

const fields = {
  profiles: [
    ['full_name', 'Full name', 'text', true], ['professional_title', 'Professional title', 'text', true],
    ['headline', 'Headline', 'text'], ['bio', 'Biography', 'textarea'], ['location', 'Location', 'text'],
    ['availability_status', 'Availability', 'text'], ['handle', 'Handle', 'text'],
    ['avatar_path', 'Profile / lanyard card photo', 'image'], ['profile_icon_path', 'Profile card image', 'image']
  ],
  projects: [
    ['title', 'Project title', 'text', true], ['slug', 'URL slug', 'text', true],
    ['subtitle', 'Subtitle', 'text'], ['summary', 'Short summary', 'textarea'], ['description', 'Description', 'textarea'],
    ['cover_path', 'Cover image', 'image'], ['preview_paths', 'Project preview images', 'images'],
    ['github_url', 'GitHub URL', 'url'], ['demo_url', 'Live demo URL', 'url'],
    ['technology_ids', 'Technologies used', 'multi'],
    ['sort_order', 'Display order', 'number'], ['featured', 'Featured project', 'boolean'], ['is_published', 'Published', 'boolean']
  ],
  technologies: [
    ['name', 'Technology', 'text', true], ['category', 'Category', 'text'], ['sort_order', 'Display order', 'number'], ['is_visible', 'Visible on site', 'boolean']
  ],
  skills: [
    ['name', 'Skill', 'text', true], ['category', 'Category', 'text'], ['icon', 'Icon name', 'text'],
    ['description', 'Description', 'textarea'], ['sort_order', 'Display order', 'number'], ['is_visible', 'Visible on site', 'boolean']
  ],
  experiences: [
    ['organization', 'Organization', 'text', true], ['position', 'Position', 'text', true],
    ['start_date', 'Start date', 'date'], ['end_date', 'End date', 'date'], ['is_current', 'Current role', 'boolean'],
    ['description', 'Description', 'textarea'], ['logo_path', 'Logo image', 'image'],
    ['sort_order', 'Display order', 'number'], ['is_published', 'Published', 'boolean']
  ],
  history_entries: [
    ['title', 'Milestone', 'text', true], ['event_date', 'Date', 'date', true], ['category', 'Category', 'text'],
    ['description', 'Description', 'textarea'], ['image_path', 'Milestone image', 'image'],
    ['preview_paths', 'Additional certificate preview images', 'images'],
    ['sort_order', 'Display order', 'number'], ['is_published', 'Published', 'boolean']
  ],
  certificates: [
    ['title', 'Certificate title', 'text', true], ['event_date', 'Issue date', 'date', true],
    ['description', 'Description', 'textarea'], ['image_path', 'Certificate cover image', 'image'],
    ['preview_paths', 'Additional certificate preview images', 'images'],
    ['sort_order', 'Display order', 'number'], ['is_published', 'Published', 'boolean']
  ],
  social_links: [
    ['platform', 'Platform', 'text', true], ['label', 'Link label', 'text'], ['url', 'URL', 'url', true],
    ['sort_order', 'Display order', 'number'], ['is_visible', 'Visible on site', 'boolean']
  ],
  site_settings: [
    ['setting_key', 'Setting key', 'text', true], ['setting_value', 'Value (JSON)', 'json', true]
  ]
};

const titleField = {
  profiles: 'full_name', projects: 'title', technologies: 'name', skills: 'name',
  experiences: 'position', history_entries: 'title', certificates: 'title', social_links: 'platform', site_settings: 'setting_key'
};

const tableForSection = (section) => section === 'certificates' ? 'history_entries' : section;
const rowsForSection = (data, section) => section === 'certificates'
  ? (data.history_entries ?? []).filter((row) => /sertifikat|certificate/i.test(row.category ?? ''))
  : data[section] ?? [];

const settingDefaults = [
  ['appearance.primary_accent', '#7FF3FF'], ['appearance.secondary_accent', '#FF5A36'],
  ['hero.text', 'Ihsan Fawwas Zaidan'], ['hero.tech_loop', ['HTML', 'CSS', 'JavaScript', 'Laravel', 'PHP']],
  ['scroll_velocity.texts', ['Full Stack Web Developer', 'AI Assistant']],
  ['profile_card.name', 'Ihsan Fawwas Zaidan'], ['profile_card.title', 'Full Stack Web Developer'],
  ['profile_card.status', 'Online'], ['profile_card.handle', '@ihsanfawwaszaidan'],
  ['profile_card.icon_pattern', '/images/profile-pattern.svg'], ['profile_card.contact_text', 'Contact Me'],
  ['profile_card.status_color', '#7FF3FF'], ['profile_card.theme', 'dark'], ['profile_card.radius', 16],
  ['profile_card.holo', 0.8], ['profile_card.glare', 0.5], ['profile_card.enable_tilt', true],
  ['profile_card.tilt_strength', 12], ['profile_card.parallax', 8], ['profile_card.enable_mobile_tilt', false],
  ['profile_card.mobile_tilt_sensitivity', 5], ['profile_card.intro', true], ['profile_card.show_user_info', true],
  ['scroll_expand.title', 'BEHIND THE CODE'], ['scroll_expand.scroll_hint', 'Scroll to explore'],
  ['scroll_expand.media_path', '/images/about-placeholder.svg'], ['scroll_expand.alt', 'Portfolio profile artwork'],
  ['scroll_expand.kicker', 'PROFILE / 01'], ['scroll_expand.name', 'Ihsan Fawwas Zaidan'],
  ['scroll_expand.subtitle', 'Full Stack Web Developer'],
  ['scroll_expand.description', 'A personal portfolio for selected work, skills, and professional background.'],
  ['scroll_expand.start_width', 42], ['scroll_expand.start_height', 58], ['scroll_expand.start_radius', 24],
  ['scroll_expand.end_radius', 0], ['scroll_expand.media_zoom', 1], ['scroll_expand.scroll_distance', 1.2],
  ['scroll_expand.hold_distance', 0.35], ['scroll_expand.smoothing', 0.1], ['scroll_expand.overlay_scrim', 0.45],
  ['scroll_expand.use_window_scroll', true],
  ['lanyard.front_image', '/images/lanyard-front.svg'], ['lanyard.back_image', '/images/lanyard-back.svg'],
  ['lanyard.strap_image', '/images/lanyard-strap.svg'], ['lanyard.card_color', '#ffffff'],
  ['lanyard.strap_color', '#eab308'], ['lanyard.size', 0.72], ['lanyard.orientation', 'portrait'],
  ['lanyard.finish', 'glossy'], ['lanyard.anchor', 'center'], ['lanyard.image_fit', 'cover'],
  ['lanyard.corner_radius', 0.3], ['lanyard.strap_length', 0.5],
  ['lanyard.strap_width', 0.65], ['lanyard.metal', 'graphite'], ['lanyard.gravity', 1],
  ['lanyard.damping', 0.5], ['lanyard.elasticity', 0.5], ['lanyard.breeze', 0.5],
  ['lanyard.interactive', true], ['lanyard.intro', true],
  ['glow_cursor.color', '#7FF3FF'], ['glow_cursor.intensity', 1],
  ...['pill_nav', 'tech_text', 'text_loop', 'scroll_velocity', 'profile_card', 'lanyard', 'card_swap', 'scroll_expand', 'glow_cursor']
    .map((name) => [`components.${name}.enabled`, true])
];

const imageSettingKeys = new Set([
  'profile_card.icon_pattern', 'scroll_expand.media_path',
  'lanyard.front_image', 'lanyard.back_image', 'lanyard.strap_image'
]);
const colorSettingKeys = new Set([
  'appearance.primary_accent', 'appearance.secondary_accent', 'glow_cursor.color',
  'lanyard.card_color', 'lanyard.strap_color', 'profile_card.status_color'
]);
const arraySettingKeys = new Set(['hero.tech_loop', 'scroll_velocity.texts']);
const booleanSettingKeys = new Set([
  'profile_card.enable_tilt', 'profile_card.enable_mobile_tilt', 'profile_card.intro', 'profile_card.show_user_info',
  'lanyard.interactive', 'lanyard.intro', 'scroll_expand.use_window_scroll'
]);
const numberSettingRanges = {
  'glow_cursor.intensity': [0, 3, 0.1], 'lanyard.size': [0.35, 1.25, 0.01],
  'lanyard.strap_length': [0.2, 1.2, 0.01], 'lanyard.strap_width': [0.4, 1, 0.01],
  'lanyard.corner_radius': [0, 0.5, 0.01],
  'lanyard.gravity': [0, 2, 0.05], 'lanyard.damping': [0, 1, 0.01], 'lanyard.elasticity': [0, 1, 0.01], 'lanyard.breeze': [0, 1, 0.01],
  'profile_card.radius': [0, 40, 1], 'profile_card.holo': [0, 1, 0.01], 'profile_card.glare': [0, 1, 0.01],
  'profile_card.tilt_strength': [0, 30, 1], 'profile_card.parallax': [0, 24, 1], 'profile_card.mobile_tilt_sensitivity': [0, 15, 1],
  'scroll_expand.start_width': [10, 100, 1], 'scroll_expand.start_height': [10, 100, 1],
  'scroll_expand.start_radius': [0, 80, 1], 'scroll_expand.end_radius': [0, 80, 1],
  'scroll_expand.media_zoom': [1, 2, 0.01], 'scroll_expand.scroll_distance': [0.5, 3, 0.05],
  'scroll_expand.hold_distance': [0, 1, 0.01], 'scroll_expand.smoothing': [0.01, 0.5, 0.01],
  'scroll_expand.overlay_scrim': [0, 1, 0.01]
};
const choiceSettingOptions = {
  'profile_card.theme': ['dark', 'light'],
  'lanyard.orientation': ['portrait', 'landscape'], 'lanyard.finish': ['glossy', 'matte', 'holographic', 'metallic'],
  'lanyard.image_fit': ['cover', 'contain'],
  'lanyard.anchor': ['left', 'center', 'right'], 'lanyard.metal': ['graphite', 'silver', 'gold']
};
const settingLabels = {
  'hero.text': 'Hero — name text', 'hero.tech_loop': 'Hero — technology words',
  'scroll_velocity.texts': 'Scroll velocity — text rows',
  'appearance.primary_accent': 'Appearance — primary accent', 'appearance.secondary_accent': 'Appearance — secondary accent',
  'profile_card.name': 'Profile card — name', 'profile_card.title': 'Profile card — title',
  'profile_card.status': 'Profile card — status text', 'profile_card.handle': 'Profile card — social handle',
  'profile_card.icon_pattern': 'Profile card — pattern image', 'profile_card.contact_text': 'Profile card — contact button',
  'profile_card.status_color': 'Profile card — status color', 'profile_card.theme': 'Profile card — theme',
  'profile_card.radius': 'Profile card — corner radius', 'profile_card.holo': 'Profile card — holographic intensity',
  'profile_card.glare': 'Profile card — glare intensity', 'profile_card.enable_tilt': 'Profile card — tilt effect',
  'profile_card.tilt_strength': 'Profile card — tilt strength', 'profile_card.parallax': 'Profile card — parallax depth',
  'profile_card.enable_mobile_tilt': 'Profile card — mobile tilt', 'profile_card.mobile_tilt_sensitivity': 'Profile card — mobile tilt sensitivity',
  'profile_card.intro': 'Profile card — entrance animation', 'profile_card.show_user_info': 'Profile card — show footer',
  'scroll_expand.title': 'Behind the Code — title', 'scroll_expand.scroll_hint': 'Behind the Code — scroll hint',
  'scroll_expand.media_path': 'Behind the Code — main image', 'scroll_expand.alt': 'Behind the Code — image description',
  'scroll_expand.kicker': 'Behind the Code — eyebrow', 'scroll_expand.name': 'Behind the Code — overlay name',
  'scroll_expand.subtitle': 'Behind the Code — subtitle', 'scroll_expand.description': 'Behind the Code — description',
  'scroll_expand.start_width': 'Behind the Code — start width (%)', 'scroll_expand.start_height': 'Behind the Code — start height (%)',
  'scroll_expand.start_radius': 'Behind the Code — start corner radius', 'scroll_expand.end_radius': 'Behind the Code — end corner radius',
  'scroll_expand.media_zoom': 'Behind the Code — image zoom', 'scroll_expand.scroll_distance': 'Behind the Code — scroll distance',
  'scroll_expand.hold_distance': 'Behind the Code — hold distance', 'scroll_expand.smoothing': 'Behind the Code — motion smoothing',
  'scroll_expand.overlay_scrim': 'Behind the Code — overlay darkness',
  'scroll_expand.use_window_scroll': 'Behind the Code — use page scroll',
  'lanyard.front_image': 'Lanyard — front artwork', 'lanyard.back_image': 'Lanyard — back image',
  'lanyard.strap_image': 'Lanyard — strap artwork', 'lanyard.card_color': 'Lanyard — card color',
  'lanyard.strap_color': 'Lanyard — strap color', 'lanyard.size': 'Lanyard — display size',
  'lanyard.orientation': 'Lanyard — card orientation', 'lanyard.finish': 'Lanyard — surface finish',
  'lanyard.image_fit': 'Lanyard — image fit',
  'lanyard.anchor': 'Lanyard — position', 'lanyard.strap_length': 'Lanyard — strap length',
  'lanyard.corner_radius': 'Lanyard — card corner radius',
  'lanyard.strap_width': 'Lanyard — strap width', 'lanyard.metal': 'Lanyard — metal hardware',
  'lanyard.gravity': 'Lanyard — gravity', 'lanyard.damping': 'Lanyard — motion damping',
  'lanyard.elasticity': 'Lanyard — elasticity', 'lanyard.breeze': 'Lanyard — breeze',
  'lanyard.interactive': 'Lanyard — interactive movement', 'lanyard.intro': 'Lanyard — entrance animation'
};
const settingGroups = [
  ['Profile card — photo, name, status and effects', 'profile_card.'],
  ['Lanyard — front, back, strap and motion', 'lanyard.'],
  ['Behind the Code — artwork, copy and scroll animation', 'scroll_expand.'],
  ['Hero, navigation and visual theme', null]
];

function blankRecord(section) {
  if (section === 'profiles') return { is_primary: true };
  if (section === 'projects') return { sort_order: 0, featured: false, is_published: false, technology_ids: [], preview_paths: [] };
  if (section === 'certificates') return { category: 'Sertifikat', sort_order: 0, is_published: false, preview_paths: [] };
  if (section === 'technologies' || section === 'skills' || section === 'social_links') return { sort_order: 0, is_visible: true };
  if (section === 'experiences' || section === 'history_entries') return { sort_order: 0, is_published: false };
  if (section === 'site_settings') return { setting_key: '', setting_value: '' };
  return {};
}

function recordName(section, row) {
  if (section === 'contact_messages') return row.subject || row.name;
  if (section === 'media_assets') return row.original_name;
  return row[titleField[section] || (section === 'certificates' ? 'title' : '')] || 'Untitled';
}

function sortedRows(section, rows) {
  return [...(rows ?? [])].sort((a, b) => {
    if (section === 'contact_messages' || section === 'media_assets') return new Date(b.created_at) - new Date(a.created_at);
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

export default function AdminDashboard({ initialData, initialError }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [data, setData] = useState(initialData);
  const [section, setSection] = useState('overview');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [activeSettingGroup, setActiveSettingGroup] = useState(settingGroups[0][0]);

  const rows = useMemo(() => sortedRows(section, rowsForSection(data, section)), [data, section]);
  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? rows.filter((row) => `${recordName(section, row)} ${row.category ?? ''}`.toLowerCase().includes(query)) : rows;
  }, [rows, search, section]);
  const pageTitle = nav.find(([id]) => id === section)?.[1] ?? 'Overview';

  function openSection(id) {
    setSection(id);
    setSelectedId(null);
    setForm(null);
    setSearch('');
    setNotice(null);
  }

  function editRow(row) {
    setSelectedId(row.id);
    setForm({ ...row,
      ...(section === 'projects' ? {
        technology_ids: data.project_technologies.filter((item) => item.project_id === row.id).map((item) => item.technology_id),
        preview_paths: Array.isArray(row.preview_paths) ? row.preview_paths : []
      } : {}),
      ...(section === 'certificates' ? { preview_paths: Array.isArray(row.preview_paths) ? row.preview_paths : [] } : {}),
      ...(section === 'site_settings' ? { setting_value: JSON.stringify(row.setting_value, null, 2) } : {})
    });
    setNotice(null);
  }

  function addRow() {
    setSelectedId(null);
    setForm(blankRecord(section));
    setNotice(null);
  }

  function changeField(name, value) {
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function saveRow(event) {
    event.preventDefault();
    const schema = fields[section];
    if (!schema || !form) return;
    setBusy(true);
    setNotice(null);
    const payload = {};
    const table = tableForSection(section);
    const selectedTechnologyIds = section === 'projects' ? form.technology_ids ?? [] : [];
    for (const [name, , type] of schema) {
      let value = form[name];
      if (type === 'multi') continue;
      if (type === 'number') value = value === '' || value == null ? 0 : Number(value);
      if (type === 'boolean') value = Boolean(value);
      if (type === 'date' && !value) value = null;
      if (section === 'site_settings' && name === 'setting_value') {
        try { value = JSON.parse(value); }
        catch { setBusy(false); setNotice({ kind: 'error', text: 'Value harus berupa JSON yang valid.' }); return; }
      }
      if (typeof value === 'string') value = value.trim();
      payload[name] = value;
    }
    if (section === 'profiles') payload.is_primary = true;
    if (section === 'certificates') payload.category = 'Sertifikat';
    const request = selectedId
      ? supabase.from(table).update(payload).eq('id', selectedId)
      : supabase.from(table).insert(payload);
    const { data: saved, error } = await request.select().single();
    if (error) { setBusy(false); setNotice({ kind: 'error', text: error.message }); return; }
    if (section === 'projects') {
      const currentLinks = data.project_technologies.filter((item) => item.project_id === saved.id);
      const selectedIds = new Set(selectedTechnologyIds);
      const removeIds = currentLinks.filter((item) => !selectedIds.has(item.technology_id)).map((item) => item.technology_id);
      const addIds = [...selectedIds].filter((technologyId) => !currentLinks.some((item) => item.technology_id === technologyId));
      if (removeIds.length) {
        const { error: linkDeleteError } = await supabase.from('project_technologies').delete().eq('project_id', saved.id).in('technology_id', removeIds);
        if (linkDeleteError) { setBusy(false); setNotice({ kind: 'error', text: `Project tersimpan, tetapi relasi teknologi gagal diperbarui: ${linkDeleteError.message}` }); return; }
      }
      if (addIds.length) {
        const { error: linkInsertError } = await supabase.from('project_technologies').insert(addIds.map((technology_id) => ({ project_id: saved.id, technology_id })));
        if (linkInsertError) { setBusy(false); setNotice({ kind: 'error', text: `Project tersimpan, tetapi relasi teknologi gagal diperbarui: ${linkInsertError.message}` }); return; }
      }
      setData((current) => ({ ...current, project_technologies: [
        ...current.project_technologies.filter((item) => item.project_id !== saved.id),
        ...[...selectedIds].map((technology_id) => ({ project_id: saved.id, technology_id }))
      ] }));
    }
    setBusy(false);
    setData((current) => ({ ...current, [table]: selectedId
      ? current[table].map((item) => item.id === selectedId ? saved : item)
      : [...current[table], saved] }));
    setSelectedId(saved.id);
    setForm({ ...saved,
      ...(section === 'projects' ? { technology_ids: selectedTechnologyIds } : {}),
      ...(section === 'site_settings' ? { setting_value: JSON.stringify(saved.setting_value, null, 2) } : {})
    });
    setNotice({ kind: 'success', text: 'Perubahan tersimpan.' });
  }

  async function deleteRow(row) {
    if (!window.confirm(`Hapus “${recordName(section, row)}”?`)) return;
    setBusy(true);
    setNotice(null);
    const table = tableForSection(section);
    const { error } = await supabase.from(table).delete().eq('id', row.id);
    setBusy(false);
    if (error) { setNotice({ kind: 'error', text: error.message }); return; }
    setData((current) => ({ ...current, [table]: current[table].filter((item) => item.id !== row.id) }));
    if (selectedId === row.id) { setSelectedId(null); setForm(null); }
    setNotice({ kind: 'success', text: 'Konten dihapus.' });
  }

  async function updateMessage(row, status) {
    setBusy(true);
    const { data: saved, error } = await supabase.from('contact_messages').update({ status, read_at: status === 'unread' ? null : new Date().toISOString() }).eq('id', row.id).select().single();
    setBusy(false);
    if (error) { setNotice({ kind: 'error', text: error.message }); return; }
    setData((current) => ({ ...current, contact_messages: current.contact_messages.map((item) => item.id === row.id ? saved : item) }));
    setNotice({ kind: 'success', text: `Pesan ditandai ${status}.` });
  }

  async function deleteMessage(row) {
    if (!window.confirm(`Hapus pesan dari ${row.name}?`)) return;
    setBusy(true);
    const { error } = await supabase.from('contact_messages').delete().eq('id', row.id);
    setBusy(false);
    if (error) { setNotice({ kind: 'error', text: error.message }); return; }
    setData((current) => ({ ...current, contact_messages: current.contact_messages.filter((item) => item.id !== row.id) }));
    setSelectedId(null);
    setNotice({ kind: 'success', text: 'Pesan dihapus.' });
  }

  async function saveImageFile(file) {
    if (!file) throw new Error('Pilih foto terlebih dahulu.');
    if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(file.type)) {
      throw new Error('Format foto belum didukung. Gunakan JPG, PNG, WebP, atau AVIF.');
    }
    if (file.size > 15 * 1024 * 1024) throw new Error('Ukuran maksimum foto adalah 15 MB.');

    const extension = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'img';
    const path = `${Date.now()}-${crypto.randomUUID()}.${extension}`;
    const { data: uploaded, error: uploadError } = await supabase.storage
      .from('portfolio-public')
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadError) throw uploadError;

    const { data: metadata, error: metadataError } = await supabase.from('media_assets').insert({
      bucket_id: 'portfolio-public', object_path: uploaded.path, original_name: file.name,
      mime_type: file.type, size_bytes: file.size, is_public: true
    }).select().single();
    if (metadataError) {
      await supabase.storage.from('portfolio-public').remove([uploaded.path]);
      throw metadataError;
    }
    return metadata;
  }

  function reportUploadError(error) {
    const message = error?.message || 'Terjadi gangguan jaringan saat mengunggah foto.';
    const authHint = /row-level security|permission|not authorized|unauthorized|jwt/i.test(message)
      ? ' Pastikan sesi login masih aktif dan akun terdaftar sebagai admin aktif.'
      : '';
    setNotice({ kind: 'error', text: `Upload gagal: ${message}.${authHint}` });
  }

  async function uploadImageToField(file, applyPath) {
    setBusy(true);
    setNotice(null);
    try {
      const metadata = await saveImageFile(file);
      setData((current) => ({ ...current, media_assets: [metadata, ...current.media_assets] }));
      applyPath(metadata.object_path);
      setNotice({ kind: 'success', text: `Foto ${metadata.original_name} diunggah dan dipilih.` });
    } catch (error) {
      reportUploadError(error);
    } finally {
      setBusy(false);
    }
  }

  async function uploadImagesToField(files, currentPaths) {
    setBusy(true);
    setNotice(null);
    const uploaded = [];
    try {
      for (const file of files) uploaded.push(await saveImageFile(file));
      const paths = [...currentPaths, ...uploaded.map((asset) => asset.object_path)];
      if (uploaded.length) {
        setData((current) => ({ ...current, media_assets: [...uploaded, ...current.media_assets] }));
        changeField('preview_paths', paths);
      }
      setNotice({ kind: 'success', text: `${uploaded.length} gambar ditambahkan.` });
    } catch (error) {
      if (uploaded.length) {
        setData((current) => ({ ...current, media_assets: [...uploaded, ...current.media_assets] }));
        changeField('preview_paths', [...currentPaths, ...uploaded.map((asset) => asset.object_path)]);
      }
      reportUploadError(error);
    } finally {
      setBusy(false);
    }
  }

  async function uploadMedia(event) {
    event.preventDefault();
    const uploadForm = event.currentTarget;
    const file = uploadFile ?? uploadForm.querySelector('input[type="file"]')?.files?.[0];
    setBusy(true);
    setNotice(null);
    try {
      const metadata = await saveImageFile(file);
      setUploadFile(null);
      uploadForm.reset();
      setData((current) => ({ ...current, media_assets: [metadata, ...current.media_assets] }));
      setNotice({ kind: 'success', text: 'Foto berhasil diunggah ke Media.' });
    } catch (error) {
      reportUploadError(error);
    } finally {
      setBusy(false);
    }
  }

  async function deleteMedia(row) {
    if (!window.confirm(`Hapus file “${row.original_name}” dari media library?`)) return;
    setBusy(true);
    const { error: storageError } = await supabase.storage.from(row.bucket_id).remove([row.object_path]);
    if (storageError) { setBusy(false); setNotice({ kind: 'error', text: storageError.message }); return; }
    const { error } = await supabase.from('media_assets').delete().eq('id', row.id);
    setBusy(false);
    if (error) { setNotice({ kind: 'error', text: error.message }); return; }
    setData((current) => ({ ...current, media_assets: current.media_assets.filter((item) => item.id !== row.id) }));
    setNotice({ kind: 'success', text: 'File media dihapus.' });
  }

  async function createDefaultSetting([key, value]) {
    const exists = data.site_settings.some((row) => row.setting_key === key);
    if (exists) return;
    setBusy(true);
    const { data: saved, error } = await supabase.from('site_settings').insert({ setting_key: key, setting_value: value }).select().single();
    setBusy(false);
    if (error) { setNotice({ kind: 'error', text: error.message }); return; }
    setData((current) => ({ ...current, site_settings: [...current.site_settings, saved] }));
    setNotice({ kind: 'success', text: `Pengaturan ${key} ditambahkan.` });
  }

  function renderField([name, label, type, required]) {
    const value = form?.[name] ?? (type === 'boolean' ? false : '');
    const settingKey = section === 'site_settings' && name === 'setting_value' ? form?.setting_key : null;
    let parsedSetting;
    if (settingKey) {
      try { parsedSetting = JSON.parse(value); } catch { parsedSetting = null; }
    }
    const isImageSetting = Boolean(settingKey && imageSettingKeys.has(settingKey));
    if (type === 'images') {
      const imagePaths = Array.isArray(value) ? value : [];
      const libraryImages = data.media_assets.filter((asset) => asset.bucket_id === 'portfolio-public');
      const imageUrl = (path) => /^(https?:)?\/\//i.test(path) || path.startsWith('/')
        ? path : supabase.storage.from('portfolio-public').getPublicUrl(path).data.publicUrl;
      return <div className={`${styles.imageField} ${styles.wide}`} key={name}>
        <span className={styles.fieldLabel}>{label}</span>
        <div className={styles.imageTools}>
          <select aria-label={`Add ${label} from uploaded images`} value="" disabled={busy}
            onChange={(event) => {
              const path = event.target.value;
              if (path && !imagePaths.includes(path)) changeField(name, [...imagePaths, path]);
            }}>
            <option value="">Add from Media library…</option>
            {libraryImages.filter((asset) => !imagePaths.includes(asset.object_path)).map((asset) => <option key={asset.id} value={asset.object_path}>{asset.original_name}</option>)}
          </select>
          <label className={`${styles.imageUploadButton} ${busy ? styles.imageUploadDisabled : ''}`}>
            <span>{busy ? 'Uploading…' : 'Upload preview images'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" multiple disabled={busy}
              onChange={(event) => {
                const files = Array.from(event.target.files ?? []);
                event.target.value = '';
                if (files.length) void uploadImagesToField(files, imagePaths);
              }} />
          </label>
        </div>
        {imagePaths.length ? <div className={styles.imagePreviewGrid}>{imagePaths.map((path, index) => <figure className={styles.imagePreviewItem} key={`${path}-${index}`}>
          <img src={imageUrl(path)} alt={`${label} ${index + 1}`} />
          <figcaption><code>{path}</code><button type="button" disabled={busy} onClick={() => changeField(name, imagePaths.filter((_, itemIndex) => itemIndex !== index))}>Remove</button></figcaption>
        </figure>)}</div> : <small className={styles.fieldHint}>{section === 'history_entries' ? 'Unggah sisi belakang atau foto detail sertifikat agar tersedia di carousel preview.' : 'Unggah screenshot tambahan agar tampil di carousel detail project.'}</small>}
      </div>;
    }
    if (type === 'image' || isImageSetting) {
      let imagePath = isImageSetting ? parsedSetting : value;
      if (typeof imagePath !== 'string') imagePath = '';
      const applyPath = (path) => changeField(name, isImageSetting ? JSON.stringify(path) : path);
      const previewUrl = !imagePath ? '' : /^(https?:)?\/\//i.test(imagePath) || imagePath.startsWith('/')
        ? imagePath
        : supabase.storage.from('portfolio-public').getPublicUrl(imagePath).data.publicUrl;
      const libraryImages = data.media_assets.filter((asset) => asset.bucket_id === 'portfolio-public');
      return <div className={`${styles.imageField} ${styles.wide}`} key={name}>
        <label className={styles.field} htmlFor={`${section}-${name}`}>
          <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
          <input id={`${section}-${name}`} name={name} type="text" required={required} value={imagePath}
            placeholder="Upload a new image or choose from Media" onChange={(event) => applyPath(event.target.value)} />
        </label>
        <div className={styles.imageTools}>
          <select aria-label={`Choose ${label} from uploaded images`} defaultValue="" disabled={busy}
            onChange={(event) => { if (event.target.value) applyPath(event.target.value); event.target.value = ''; }}>
            <option value="">Choose from Media library…</option>
            {libraryImages.map((asset) => <option key={asset.id} value={asset.object_path}>{asset.original_name}</option>)}
          </select>
          <label className={`${styles.imageUploadButton} ${busy ? styles.imageUploadDisabled : ''}`}>
            <span>{busy ? 'Uploading…' : 'Upload image'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void uploadImageToField(file, applyPath);
              }} />
          </label>
        </div>
        {previewUrl && <div className={styles.imagePreview}><img src={previewUrl} alt={`Preview: ${label}`} /><code>{imagePath}</code></div>}
      </div>;
    }
    if (settingKey && colorSettingKeys.has(settingKey)) return <label className={`${styles.field} ${styles.settingColor}`} key={name}>
      <span>{label}</span><div><input aria-label={label} type="color" value={typeof parsedSetting === 'string' ? parsedSetting : '#ffffff'}
        onChange={(event) => changeField(name, JSON.stringify(event.target.value))} /><code>{parsedSetting}</code></div>
    </label>;
    if (settingKey && numberSettingRanges[settingKey]) {
      const [min, max, step] = numberSettingRanges[settingKey];
      return <label className={styles.field} key={name}>
        <span>{label}</span><input type="number" min={min} max={max} step={step} value={Number(parsedSetting ?? min)}
          onChange={(event) => changeField(name, JSON.stringify(Number(event.target.value)))} />
        <small>{min}–{max}</small>
      </label>;
    }
    if ((settingKey && settingKey.startsWith('components.') && settingKey.endsWith('.enabled')) || booleanSettingKeys.has(settingKey)) return <label className={styles.toggleField} key={name}>
      <input type="checkbox" checked={Boolean(parsedSetting)} onChange={(event) => changeField(name, JSON.stringify(event.target.checked))} />
      <span>{label}</span>
    </label>;
    if (settingKey && choiceSettingOptions[settingKey]) return <label className={styles.field} key={name}>
      <span>{label}</span><select value={parsedSetting ?? choiceSettingOptions[settingKey][0]}
        onChange={(event) => changeField(name, JSON.stringify(event.target.value))}>
        {choiceSettingOptions[settingKey].map((choice) => <option key={choice} value={choice}>{choice}</option>)}
      </select>
    </label>;
    if (settingKey && arraySettingKeys.has(settingKey)) return <label className={`${styles.field} ${styles.wide}`} key={name}>
      <span>{label}</span><textarea rows={5} value={Array.isArray(parsedSetting) ? parsedSetting.join('\n') : ''}
        onChange={(event) => changeField(name, JSON.stringify(event.target.value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 12)))} />
      <small>Tulis satu item per baris.</small>
    </label>;
    if (settingKey === 'scroll_expand.description' && typeof parsedSetting === 'string') return <label className={`${styles.field} ${styles.wide}`} key={name}>
      <span>{label}</span><textarea rows={5} value={parsedSetting} maxLength={500}
        onChange={(event) => changeField(name, JSON.stringify(event.target.value))} />
    </label>;
    if (settingKey && typeof parsedSetting === 'string') return <label className={styles.field} key={name}>
      <span>{label}</span><input type="text" value={parsedSetting} maxLength={500}
        onChange={(event) => changeField(name, JSON.stringify(event.target.value))} />
    </label>;
    if (type === 'multi') return <fieldset className={`${styles.field} ${styles.wide} ${styles.multiField}`} key={name}>
      <legend>{label}</legend>{data.technologies.length ? <div className={styles.multiOptions}>{data.technologies.map((technology) => <label key={technology.id}>
        <input id={`${section}-${name}-${technology.id}`} name={`${name}[]`} type="checkbox" checked={(value ?? []).includes(technology.id)} onChange={(event) => changeField(name, event.target.checked ? [...(value ?? []), technology.id] : value.filter((id) => id !== technology.id))} />{technology.name}
      </label>)}</div> : <small>Add technologies first to connect them to a project.</small>}
    </fieldset>;
    if (type === 'boolean') return <label className={styles.toggleField} key={name}>
      <input id={`${section}-${name}`} name={name} type="checkbox" checked={Boolean(value)} onChange={(event) => changeField(name, event.target.checked)} />
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      </label>;
    if (type === 'textarea' || type === 'json') return <label className={`${styles.field} ${styles.wide}`} key={name}>
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span><textarea id={`${section}-${name}`} name={name} rows={type === 'json' ? 5 : 4} required={required} value={value ?? ''} onChange={(event) => changeField(name, event.target.value)} spellCheck={type !== 'json'} />
      {type === 'json' && <small>String, angka, boolean, atau array JSON sesuai jenis pengaturan.</small>}
    </label>;
    return <label className={styles.field} key={name}>
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span><input id={`${section}-${name}`} name={name} type={type} required={required} value={value ?? ''} onChange={(event) => changeField(name, event.target.value)} />
    </label>;
  }

  const unreadCount = data.contact_messages.filter((item) => item.status === 'unread').length;

  return <div className={styles.shell}>
    <aside className={styles.sidebar}>
      <Link className={styles.brand} href="/" aria-label="Ihsan portfolio home"><span className={styles.brandMark}>IZ</span><span>Ihsan Zaidan<small>Portfolio CMS</small></span></Link>
      <nav className={styles.navigation} aria-label="Admin sections">
        {nav.map(([id, label]) => <button className={section === id ? styles.activeNav : styles.navButton} key={id} type="button" onClick={() => openSection(id)}>
          <span>{label}</span>{id === 'contact_messages' && unreadCount > 0 && <span className={styles.navCount}>{unreadCount}</span>}
        </button>)}
      </nav>
      <div className={styles.sidebarFoot}><span>Signed in as admin</span><form action={logoutAdmin}><button type="submit">Sign out <span aria-hidden="true">↗</span></button></form></div>
    </aside>

    <main className={styles.main}>
      <header className={styles.topbar}><div><p className={styles.crumb}>PORTFOLIO / CMS</p><h1>{pageTitle}</h1></div><Link href="/" className={styles.viewSite}>View website <span aria-hidden="true">↗</span></Link></header>
      {initialError && <div className={styles.alert} role="alert"><strong>Database belum siap.</strong> {initialError} Pastikan migrasi portfolio schema sudah diterapkan di Supabase.</div>}
      {notice && <p className={notice.kind === 'error' ? styles.errorNotice : styles.successNotice} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p>}

      {section === 'overview' ? <section className={styles.overview}>
        <div className={styles.welcome}><p className={styles.crumb}>CONTENT WORKSPACE</p><h2>Manage the portfolio</h2><p>Edit content, organize its order, and publish each entry from one place.</p></div>
        <div className={styles.stats}>
          {[
            ['Projects', data.projects.length, 'projects'], ['Skills', data.skills.length + data.technologies.length, 'skills'],
            ['Experience', data.experiences.length, 'experiences'], ['Unread messages', unreadCount, 'contact_messages']
          ].map(([label, count, target]) => <button key={label} type="button" onClick={() => openSection(target)}><span>{label}</span><strong>{count}</strong><small>Open {label.toLowerCase()} →</small></button>)}
        </div>
        <div className={styles.overviewGrid}>
          <section className={styles.overviewBlock}><div className={styles.blockHead}><h2>Content sections</h2><span>{nav.length - 1} areas</span></div>
            {nav.slice(1).map(([id, label]) => <button className={styles.overviewRow} type="button" key={id} onClick={() => openSection(id)}><span>{label}</span><strong>{rowsForSection(data, id).length}</strong><span aria-hidden="true">↗</span></button>)}
          </section>
          <section className={styles.overviewBlock}><div className={styles.blockHead}><h2>Site settings</h2><span>Presentation</span></div>
            {settingDefaults.slice(0, 5).map(([key, defaultValue]) => {
              const row = data.site_settings.find((item) => item.setting_key === key);
              return <button type="button" className={styles.settingRow} key={key} onClick={() => openSection('site_settings')}><span>{key}</span><strong>{row ? String(Array.isArray(row.setting_value) ? row.setting_value.join(' · ') : row.setting_value) : String(defaultValue)}</strong></button>;
            })}
          </section>
        </div>
      </section> : null}

      {section === 'site_settings' && <section className={styles.settingsIntro}>
        <div><h2>Edit by section</h2><p>Pilih bagian situs, lalu ubah konten atau tampilannya. Setiap bagian disimpan terpisah.</p></div>
        <nav className={styles.settingTabs} aria-label="Portfolio sections to edit">
          {settingGroups.map(([title]) => <button type="button" key={title} aria-pressed={activeSettingGroup === title}
            className={activeSettingGroup === title ? styles.settingTabActive : styles.settingTab}
            onClick={() => { setActiveSettingGroup(title); setForm(null); setSelectedId(null); }}>
            {title.split(' — ')[0]}
          </button>)}
        </nav>
        <div className={styles.defaults}>{settingGroups.filter(([title]) => title === activeSettingGroup).map(([title, prefix]) => <section className={styles.settingGroup} key={title}>
          <h3>{title}</h3>
          {settingDefaults.filter(([key]) => prefix ? key.startsWith(prefix) : !key.startsWith('profile_card.') && !key.startsWith('lanyard.') && !key.startsWith('scroll_expand.')).map(([key, value]) => {
            const row = data.site_settings.find((item) => item.setting_key === key);
            return <div className={styles.defaultRow} key={key}><span>{settingLabels[key] || key}<small>{key}</small></span>{row
              ? <button type="button" onClick={() => editRow(row)}>Edit value <span aria-hidden="true">↗</span></button>
              : <button type="button" disabled={busy} onClick={() => createDefaultSetting([key, value])}>Add default <span aria-hidden="true">＋</span></button>}
            </div>;
          })}
        </section>)}</div>
      </section>}

      {section === 'media_assets' && <section className={styles.mediaUpload}>
        <div><h2>Upload an image</h2><p>Public portfolio images · JPG, PNG, WebP, or AVIF · maximum 15 MB</p></div>
        <form onSubmit={uploadMedia}><label className={styles.fileInput}><span>{uploadFile?.name ?? 'Choose image file'}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} required /></label><button className={styles.primaryButton} type="submit" disabled={busy || !uploadFile}>{busy ? 'Uploading…' : 'Upload image'}</button></form>
      </section>}

      {section !== 'overview' && <div className={styles.workspace}>
        <section className={styles.listPane} aria-label={`${pageTitle} list`}>
          <div className={styles.listHead}><div><h2>{pageTitle}</h2><span>{rows.length} {rows.length === 1 ? 'entry' : 'entries'}</span></div>{fields[section] && <button className={styles.addButton} type="button" onClick={addRow}>＋ Add</button>}</div>
          {section !== 'contact_messages' && <label className={styles.search}><span aria-hidden="true">⌕</span><input placeholder={`Search ${pageTitle.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)} /></label>}
          <div className={styles.records}>
            {visibleRows.length === 0 ? <div className={styles.empty}><strong>Nothing here yet</strong><span>{fields[section] ? 'Add the first entry to this section.' : 'New entries will appear here.'}</span></div> : visibleRows.map((row) => <button type="button" key={row.id} onClick={() => editRow(row)} className={selectedId === row.id ? styles.recordActive : styles.record}>
              <span className={styles.recordName}>{recordName(section, row)}</span>
              <span className={styles.recordMeta}>{section === 'contact_messages' ? `${row.name} · ${row.status}` : section === 'media_assets' ? row.object_path : row.category || (row.is_published ? 'Published' : row.is_visible === false ? 'Hidden' : '')}</span>
            </button>)}
          </div>
        </section>

        <section className={styles.editor} aria-label={`${pageTitle} editor`}>
          {section === 'contact_messages' ? <MessageViewer row={data.contact_messages.find((item) => item.id === selectedId)} onStatus={updateMessage} onDelete={deleteMessage} busy={busy} />
            : section === 'media_assets' ? <MediaViewer rows={data.media_assets} supabase={supabase} onDelete={deleteMedia} busy={busy} />
            : form && fields[section] ? <form className={styles.editForm} onSubmit={saveRow}>
              <div className={styles.editorHead}><div><p className={styles.crumb}>{selectedId ? 'EDIT ENTRY' : 'NEW ENTRY'}</p><h2>{selectedId ? recordName(section, form) : `New ${pageTitle.toLowerCase().replace(/s$/, '')}`}</h2></div>{selectedId && <button type="button" className={styles.deleteButton} disabled={busy} onClick={() => deleteRow(form)}>Delete</button>}</div>
              <div className={styles.formGrid}>{fields[section].map(renderField)}</div>
              {notice && <p className={notice.kind === 'error' ? styles.errorNotice : styles.successNotice} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
              <div className={styles.formActions}><button type="submit" className={styles.primaryButton} disabled={busy}>{busy ? 'Saving…' : 'Save changes'}</button><button type="button" className={styles.cancelButton} onClick={() => { setForm(null); setSelectedId(null); }}>Cancel</button></div>
            </form> : <div className={styles.editorEmpty}><span className={styles.editorRule} /><h2>Select an entry</h2><p>Choose an item from the list to edit, or add a new one.</p></div>}
        </section>
      </div>}
    </main>
  </div>;
}

function MessageViewer({ row, onStatus, onDelete, busy }) {
  if (!row) return <div className={styles.editorEmpty}><span className={styles.editorRule} /><h2>Contact inbox</h2><p>Select a message to read it and update its status.</p></div>;
  return <article className={styles.messageView}>
    <p className={styles.crumb}>{row.status.toUpperCase()} / {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(row.created_at))}</p>
    <h2>{row.subject}</h2><p className={styles.messageFrom}>{row.name} · <a href={`mailto:${row.email}`}>{row.email}</a></p>
    <p className={styles.messageBody}>{row.message}</p>
    <div className={styles.messageActions}><button type="button" disabled={busy} onClick={() => onStatus(row, 'read')}>Mark read</button><button type="button" disabled={busy} onClick={() => onStatus(row, 'archived')}>Archive</button><button type="button" disabled={busy} onClick={() => onStatus(row, 'unread')}>Mark unread</button><button type="button" disabled={busy} onClick={() => onDelete(row)}>Delete</button></div>
  </article>;
}

function MediaViewer({ rows, supabase, onDelete, busy }) {
  if (!rows.length) return <div className={styles.editorEmpty}><span className={styles.editorRule} /><h2>Media library</h2><p>Uploaded images will appear here. Copy their storage path into a content image field.</p></div>;
  return <div className={styles.mediaGrid}>{rows.map((row) => <article className={styles.mediaCard} key={row.id}>
    <div className={styles.mediaPreview}>{row.bucket_id === 'portfolio-public' ? <img src={supabase.storage.from(row.bucket_id).getPublicUrl(row.object_path).data.publicUrl} alt="" /> : <span>PRIVATE FILE</span>}</div>
    <strong title={row.original_name}>{row.original_name}</strong><code>{row.object_path}</code><small>{(Number(row.size_bytes) / 1024 / 1024).toFixed(2)} MB · {row.mime_type}</small>
    <div className={styles.mediaActions}><button type="button" onClick={() => navigator.clipboard.writeText(row.object_path)}>Copy path</button><button type="button" disabled={busy} onClick={() => onDelete(row)}>Delete</button></div>
  </article>)}</div>;
}
