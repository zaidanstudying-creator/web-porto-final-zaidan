'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { logoutAdmin } from '../actions';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import AdminContentPreview from './AdminContentPreview';
import styles from './admin-dashboard.module.css';

const nav = [
  ['overview', 'Dashboard'], ['profiles', 'Profil'], ['projects', 'Proyek'],
  ['technologies', 'Teknologi'], ['skills', 'Keahlian'], ['experiences', 'Pengalaman'],
  ['history_entries', 'Riwayat'], ['certificates', 'Sertifikat'], ['social_links', 'Tautan sosial'], ['site_settings', 'Pengaturan tampilan'],
  ['contact_messages', 'Pesan masuk'], ['media_assets', 'Media']
];

const sectionHelp = {
  profiles: 'Kelola informasi profil untuk bagian pembuka dan kartu profil. Pengaturan nama atau tampilan khusus ada di Pengaturan tampilan. Foto profil dan pola ikon memiliki fungsi berbeda.',
  projects: 'Hanya proyek berstatus Tayang muncul di situs. Proyek Unggulan tampil lebih dulu, lalu mengikuti Urutan tampil.',
  technologies: 'Nama teknologi tampil di daftar dan pilihan teknologi untuk proyek. Item tersembunyi tidak ditampilkan.',
  skills: 'Nama keahlian tampil bersama teknologi pada bagian Skills. Item tersembunyi tidak ditampilkan.',
  experiences: 'Pengalaman berstatus Tayang muncul di situs. Tandai posisi yang masih berjalan untuk menampilkan “Present”.',
  history_entries: 'Riwayat berstatus Tayang muncul di timeline. Tanggal, kategori, deskripsi, dan gambar melengkapi tiap peristiwa.',
  certificates: 'Sertifikat berstatus Tayang tampil di carousel. Gambar utama dan tambahan menjadi slide; judul, tahun, dan deskripsi ikut ditampilkan.',
  social_links: 'Tautan yang terlihat muncul di navigasi dan bagian kontak. Gunakan URL lengkap, misalnya https://…',
  site_settings: 'Pengaturan di sini langsung mengubah komponen visual yang disebutkan pada nama pengaturan.',
  media_assets: 'Pilih media ini saat mengedit gambar. Jangan hapus file yang masih dipakai oleh konten.'
};

const fields = {
  profiles: [
    ['full_name', 'Nama lengkap', 'text', true], ['professional_title', 'Jabatan profesional', 'text', true],
    ['headline', 'Kalimat pembuka', 'text'], ['bio', 'Tentang saya', 'textarea'], ['location', 'Lokasi', 'text'],
    ['availability_status', 'Status ketersediaan', 'text'],
    ['avatar_path', 'Foto profil', 'image'], ['profile_icon_path', 'Pola ikon kartu profil', 'image']
  ],
  projects: [
    ['title', 'Nama proyek', 'text', true], ['slug', 'Slug URL', 'text', true],
    ['subtitle', 'Subjudul', 'text'], ['summary', 'Ringkasan', 'textarea'], ['description', 'Deskripsi lengkap', 'textarea'],
    ['cover_path', 'Gambar sampul', 'image'], ['preview_paths', 'Screenshot tambahan', 'images'],
    ['github_url', 'URL GitHub', 'url'], ['demo_url', 'URL demo langsung', 'url'],
    ['technology_ids', 'Teknologi yang digunakan', 'multi'],
    ['sort_order', 'Urutan tampil', 'number'], ['featured', 'Proyek unggulan', 'boolean'], ['is_published', 'Tayang di website', 'boolean']
  ],
  technologies: [
    ['name', 'Nama teknologi', 'text', true], ['sort_order', 'Urutan tampil', 'number'], ['is_visible', 'Tampilkan di website', 'boolean']
  ],
  skills: [
    ['name', 'Nama keahlian', 'text', true], ['sort_order', 'Urutan tampil', 'number'], ['is_visible', 'Tampilkan di website', 'boolean']
  ],
  experiences: [
    ['organization', 'Organisasi', 'text', true], ['position', 'Jabatan', 'text', true],
    ['start_date', 'Tanggal mulai', 'date'], ['end_date', 'Tanggal selesai', 'date'], ['is_current', 'Masih bekerja di sini', 'boolean'],
    ['description', 'Deskripsi', 'textarea'], ['logo_path', 'Logo organisasi', 'image'],
    ['sort_order', 'Urutan tampil', 'number'], ['is_published', 'Tayang di website', 'boolean']
  ],
  history_entries: [
    ['title', 'Nama peristiwa', 'text', true], ['event_date', 'Tanggal', 'date', true], ['category', 'Kategori', 'text'],
    ['description', 'Deskripsi', 'textarea'], ['image_path', 'Gambar peristiwa', 'image'],
    ['sort_order', 'Urutan tampil', 'number'], ['is_published', 'Tayang di website', 'boolean']
  ],
  certificates: [
    ['title', 'Nama sertifikat', 'text', true], ['event_date', 'Tanggal terbit', 'date', true],
    ['description', 'Deskripsi', 'textarea'], ['image_path', 'Gambar utama sertifikat', 'image'],
    ['preview_paths', 'Gambar tambahan sertifikat', 'images'],
    ['sort_order', 'Urutan tampil', 'number'], ['is_published', 'Tayang di website', 'boolean']
  ],
  social_links: [
    ['platform', 'Platform', 'text', true], ['label', 'Nama tautan', 'text'], ['url', 'URL lengkap', 'url', true],
    ['sort_order', 'Urutan tampil', 'number'], ['is_visible', 'Tampilkan di website', 'boolean']
  ],
  site_settings: [
    ['setting_value', 'Isi yang tampil di website', 'json', true]
  ]
};

const titleField = {
  profiles: 'full_name', projects: 'title', technologies: 'name', skills: 'name',
  experiences: 'position', history_entries: 'title', certificates: 'title', social_links: 'platform', site_settings: 'setting_key'
};

const tableForSection = (section) => section === 'certificates' ? 'history_entries' : section;
const rowsForSection = (data, section) => section === 'certificates'
  ? (data.history_entries ?? []).filter((row) => /sertifikat|certificate/i.test(row.category ?? ''))
  : section === 'history_entries'
    ? (data.history_entries ?? []).filter((row) => !/sertifikat|certificate/i.test(row.category ?? ''))
  : data[section] ?? [];

const settingDefaults = [
  ['appearance.primary_accent', '#7FF3FF'], ['appearance.secondary_accent', '#FF5A36'],
  ['hero.text', 'Ihsan Fawwas Zaidan'], ['hero.tech_loop', ['HTML', 'CSS', 'JavaScript', 'Laravel', 'PHP']],
  ['scroll_velocity.texts', ['Full Stack Web Developer', 'AI Assistant']],
  ['profile_card.name', 'Ihsan Fawwas Zaidan'], ['profile_card.title', 'Full Stack Web Developer'],
  ['profile_card.status', 'Online'], ['profile_card.handle', '@ihsanfawwaszaidan'],
  ['profile_card.icon_pattern', '/images/profile-pattern.svg'], ['profile_card.contact_text', 'Contact Me'],
  ['profile_card.status_color', '#7FF3FF'], ['profile_card.theme', 'dark'], ['profile_card.show_user_info', true],
  ['scroll_expand.title', 'BEHIND THE CODE'], ['scroll_expand.scroll_hint', 'Scroll to explore'],
  ['scroll_expand.media_path', '/images/about-placeholder.svg'], ['scroll_expand.alt', 'Portfolio profile artwork'],
  ['scroll_expand.kicker', 'PROFILE / 01'], ['scroll_expand.name', 'Ihsan Fawwas Zaidan'],
  ['scroll_expand.subtitle', 'Full Stack Web Developer'],
  ['scroll_expand.description', 'A personal portfolio for selected work, skills, and professional background.'],
  ['lanyard.front_image', '/images/lanyard-front.svg'], ['lanyard.back_image', '/images/lanyard-back.svg'],
  ['lanyard.strap_image', '/images/lanyard-strap.svg'], ['lanyard.card_color', '#ffffff'],
  ['lanyard.strap_color', '#eab308'], ['lanyard.size', 0.72], ['lanyard.orientation', 'portrait'],
  ['lanyard.finish', 'glossy'], ['lanyard.image_fit', 'cover'], ['lanyard.interactive', true],
  ['glow_cursor.color', '#7FF3FF'],
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
const booleanSettingKeys = new Set(['profile_card.show_user_info', 'lanyard.interactive']);
const numberSettingRanges = { 'lanyard.size': [0.35, 1.25, 0.01] };
const choiceSettingOptions = {
  'profile_card.theme': ['dark', 'light'],
  'lanyard.orientation': ['portrait', 'landscape'], 'lanyard.finish': ['glossy', 'matte', 'holographic', 'metallic'],
  'lanyard.image_fit': ['cover', 'contain'],
  'lanyard.anchor': ['left', 'center', 'right'], 'lanyard.metal': ['graphite', 'silver', 'gold']
};
const settingLabels = {
  'hero.text': 'Nama besar di halaman pembuka', 'hero.tech_loop': 'Teknologi yang berjalan di halaman pembuka',
  'scroll_velocity.texts': 'Teks yang berjalan di halaman',
  'appearance.primary_accent': 'Warna aksen utama', 'appearance.secondary_accent': 'Warna aksen kedua',
  'profile_card.name': 'Nama pada kartu profil', 'profile_card.title': 'Pekerjaan pada kartu profil',
  'profile_card.status': 'Status pada kartu profil', 'profile_card.handle': 'Nama akun sosial',
  'profile_card.icon_pattern': 'Gambar dekorasi kartu profil', 'profile_card.contact_text': 'Tulisan tombol kontak',
  'profile_card.status_color': 'Warna status', 'profile_card.theme': 'Warna kartu profil',
  'profile_card.show_user_info': 'Tampilkan nama dan pekerjaan di kartu',
  'scroll_expand.title': 'Judul bagian', 'scroll_expand.scroll_hint': 'Petunjuk saat digulir',
  'scroll_expand.media_path': 'Gambar bagian', 'scroll_expand.alt': 'Deskripsi gambar untuk pembaca layar',
  'scroll_expand.kicker': 'Teks kecil di atas judul', 'scroll_expand.name': 'Nama di bagian ini',
  'scroll_expand.subtitle': 'Pekerjaan di bagian ini', 'scroll_expand.description': 'Deskripsi bagian',
  'lanyard.front_image': 'Gambar depan kartu', 'lanyard.back_image': 'Gambar belakang kartu',
  'lanyard.strap_image': 'Gambar tali kartu', 'lanyard.card_color': 'Warna dasar kartu',
  'lanyard.strap_color': 'Warna tali kartu', 'lanyard.size': 'Ukuran kartu di halaman',
  'lanyard.orientation': 'Bentuk kartu', 'lanyard.finish': 'Tampilan permukaan kartu',
  'lanyard.image_fit': 'Cara gambar memenuhi kartu', 'lanyard.interactive': 'Izinkan kartu bergerak saat disentuh',
  'glow_cursor.color': 'Warna efek di bagian kontak',
  'components.pill_nav.enabled': 'Tampilkan menu navigasi',
  'components.tech_text.enabled': 'Tampilkan nama utama dengan efek teks',
  'components.text_loop.enabled': 'Tampilkan teknologi berjalan',
  'components.scroll_velocity.enabled': 'Tampilkan baris teks berjalan',
  'components.profile_card.enabled': 'Tampilkan kartu profil',
  'components.lanyard.enabled': 'Tampilkan kartu identitas',
  'components.card_swap.enabled': 'Tampilkan proyek sebagai tumpukan kartu',
  'components.scroll_expand.enabled': 'Tampilkan bagian Behind the Code',
  'components.glow_cursor.enabled': 'Tampilkan efek di bagian kontak'
};

const settingHelp = {
  'hero.text': 'Tulisan utama yang pertama dilihat pengunjung.',
  'hero.tech_loop': 'Tulis satu nama teknologi per baris.',
  'scroll_velocity.texts': 'Tulis satu kalimat per baris.',
  'appearance.primary_accent': 'Dipakai untuk sorotan dan efek teks.',
  'appearance.secondary_accent': 'Dipakai untuk aksen pada baris teknologi.',
  'profile_card.icon_pattern': 'Pilih gambar yang menjadi dekorasi kartu.',
  'scroll_expand.media_path': 'Gambar yang membesar saat bagian ini digulir.',
  'scroll_expand.description': 'Kalimat yang muncul di bawah nama dan pekerjaan.',
  'lanyard.front_image': 'Gambar yang terlihat di bagian depan kartu.',
  'lanyard.back_image': 'Gambar yang terlihat saat kartu berputar.',
  'lanyard.strap_image': 'Pilih gambar tali dari Media atau unggah yang baru.',
  'lanyard.size': 'Geser untuk mengecilkan atau membesarkan kartu.',
  'components.pill_nav.enabled': 'Matikan jika menu tidak ingin ditampilkan.',
  'components.lanyard.enabled': 'Sembunyikan jika kartu identitas tidak ingin tampil.'
};
const settingGroups = [
  { title: 'Kartu profil', description: 'Foto, nama, status, warna, dan efek kartu di bagian pembuka.', prefix: 'profile_card.', previewKey: 'profile_card.name' },
  { title: 'Lanyard', description: 'Kartu identitas, gambar depan-belakang, tali, dan gerakannya.', prefix: 'lanyard.', previewKey: 'lanyard.front_image' },
  { title: 'Behind the Code', description: 'Gambar, teks, dan animasi profil yang muncul saat halaman digulir.', prefix: 'scroll_expand.', previewKey: 'scroll_expand.title' },
  { title: 'Hero, navigasi, dan tema', description: 'Nama utama, teknologi, teks berjalan, warna, dan visibilitas bagian.', prefix: null, previewKey: 'hero.text' }
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

function recordMeta(section, row) {
  if (section === 'contact_messages') {
    const status = { unread: 'Belum dibaca', read: 'Sudah dibaca', archived: 'Diarsipkan' }[row.status] || row.status;
    return `${row.name} · ${status}`;
  }
  if (section === 'media_assets') return row.object_path;
  if (section === 'projects') return `${row.featured ? 'Unggulan · ' : ''}${row.is_published ? 'Tayang' : 'Draf'}`;
  if (['experiences', 'history_entries', 'certificates'].includes(section)) {
    return `${row.category ? `${row.category} · ` : ''}${row.is_published ? 'Tayang' : 'Draf'}`;
  }
  if (['technologies', 'skills', 'social_links'].includes(section)) return row.is_visible ? 'Tampil di website' : 'Disembunyikan';
  return row.category || '';
}

function settingValueSummary(key, value) {
  if (typeof value === 'boolean') return value ? 'Aktif' : 'Tidak aktif';
  if (Array.isArray(value)) return value.length ? `${value.slice(0, 2).join(' · ')}${value.length > 2 ? ` +${value.length - 2}` : ''}` : 'Belum diisi';
  if (imageSettingKeys.has(key)) return typeof value === 'string' ? value.split('/').pop() : 'Belum memilih gambar';
  if (colorSettingKeys.has(key)) return typeof value === 'string' ? value.toUpperCase() : 'Warna belum dipilih';
  if (key === 'lanyard.size' && Number.isFinite(Number(value))) return `${Math.round(Number(value) * 100)}%`;
  return String(value ?? 'Belum diisi');
}

function contentImagePath(section, row) {
  if (section === 'profiles') return row.avatar_path;
  if (section === 'projects') return row.cover_path || row.preview_paths?.[0];
  if (section === 'experiences') return row.logo_path;
  if (section === 'history_entries' || section === 'certificates') return row.image_path || row.preview_paths?.[0];
  return '';
}

function contentSummary(section, row) {
  if (section === 'profiles') return row.professional_title || row.headline || row.bio;
  if (section === 'projects') return row.summary || row.subtitle || row.description;
  if (section === 'experiences') return row.organization || row.description;
  if (section === 'history_entries' || section === 'certificates') return row.description || row.category;
  if (section === 'social_links') return row.url;
  return row.description || row.category || '';
}

function mediaReferences(asset, data) {
  if (asset.bucket_id !== 'portfolio-public') return [];
  const path = asset.object_path;
  const references = [];
  if (data.profiles.some((row) => row.avatar_path === path)) references.push('foto profil');
  if (data.profiles.some((row) => row.profile_icon_path === path)) references.push('pola ikon profil');
  if (data.projects.some((row) => row.cover_path === path || row.preview_paths?.includes(path))) references.push('proyek');
  if (data.experiences.some((row) => row.logo_path === path)) references.push('pengalaman');
  if (data.history_entries.some((row) => row.image_path === path || row.preview_paths?.includes(path))) references.push('riwayat atau sertifikat');
  if (data.site_settings.some((row) => row.setting_value === path)) references.push('pengaturan tampilan');
  return references;
}

function sortedRows(section, rows) {
  return [...(rows ?? [])].sort((a, b) => {
    if (section === 'contact_messages' || section === 'media_assets') return new Date(b.created_at) - new Date(a.created_at);
    if (section === 'projects' && a.featured !== b.featured) return Number(b.featured) - Number(a.featured);
    return (a.sort_order ?? 0) - (b.sort_order ?? 0);
  });
}

export default function AdminDashboard({ initialData, initialError }) {
  const [supabase] = useState(() => createSupabaseBrowserClient());
  const [data, setData] = useState(initialData);
  const [section, setSection] = useState('overview');
  const [selectedId, setSelectedId] = useState(null);
  const [form, setForm] = useState(null);
  const [savedForm, setSavedForm] = useState(null);
  const [search, setSearch] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);

  const rows = useMemo(() => sortedRows(section, rowsForSection(data, section)), [data, section]);
  const visibleRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query ? rows.filter((row) => `${recordName(section, row)} ${row.category ?? ''}`.toLowerCase().includes(query)) : rows;
  }, [rows, search, section]);
  const pageTitle = nav.find(([id]) => id === section)?.[1] ?? 'Dashboard';
  const isDirty = Boolean(form && JSON.stringify(form) !== savedForm);

  useEffect(() => {
    if (!isDirty) return undefined;
    const warnBeforeLeave = (event) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warnBeforeLeave);
    return () => window.removeEventListener('beforeunload', warnBeforeLeave);
  }, [isDirty]);

  function confirmDiscardChanges() {
    return !isDirty || window.confirm('Perubahan belum disimpan. Buang perubahan ini?');
  }

  function openSection(id) {
    if (!confirmDiscardChanges()) return;
    setSection(id);
    setSelectedId(null);
    setForm(null);
    setSavedForm(null);
    setSearch('');
    setNotice(null);
  }

  function editRow(row) {
    if (!confirmDiscardChanges()) return;
    setSelectedId(row.id);
    const nextForm = { ...row,
      ...(section === 'projects' ? {
        technology_ids: data.project_technologies.filter((item) => item.project_id === row.id).map((item) => item.technology_id),
        preview_paths: Array.isArray(row.preview_paths) ? row.preview_paths : []
      } : {}),
      ...(section === 'certificates' ? { preview_paths: Array.isArray(row.preview_paths) ? row.preview_paths : [] } : {}),
      ...(section === 'site_settings' ? { setting_value: JSON.stringify(row.setting_value, null, 2) } : {})
    };
    setForm(nextForm);
    setSavedForm(JSON.stringify(nextForm));
    setNotice(null);
  }

  function addRow() {
    if (!confirmDiscardChanges()) return;
    setSelectedId(null);
    const nextForm = blankRecord(section);
    setForm(nextForm);
    setSavedForm(JSON.stringify(nextForm));
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
    if (section === 'experiences' && payload.is_current) payload.end_date = null;
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
    const nextForm = { ...saved,
      ...(section === 'projects' ? { technology_ids: selectedTechnologyIds } : {}),
      ...(section === 'site_settings' ? { setting_value: JSON.stringify(saved.setting_value, null, 2) } : {})
    };
    setForm(nextForm);
    setSavedForm(JSON.stringify(nextForm));
    setNotice({ kind: 'success', text: 'Perubahan tersimpan. Buka atau muat ulang website untuk melihat hasilnya.' });
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
    if (selectedId === row.id) { setSelectedId(null); setForm(null); setSavedForm(null); }
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
    if (!confirmDiscardChanges()) return;
    const exists = data.site_settings.some((row) => row.setting_key === key);
    if (exists) return;
    setBusy(true);
    const { data: saved, error } = await supabase.from('site_settings').insert({ setting_key: key, setting_value: value }).select().single();
    setBusy(false);
    if (error) { setNotice({ kind: 'error', text: error.message }); return; }
    setData((current) => ({ ...current, site_settings: [...current.site_settings, saved] }));
    const nextForm = { ...saved, setting_value: JSON.stringify(saved.setting_value, null, 2) };
    setSelectedId(saved.id);
    setForm(nextForm);
    setSavedForm(JSON.stringify(nextForm));
    setNotice({ kind: 'success', text: `Pengaturan ${key} ditambahkan.` });
  }

  function editSetting(row) {
    editRow(row);
    window.setTimeout(() => document.getElementById('settings-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  }

  async function addAndEditSetting(setting) {
    await createDefaultSetting(setting);
    window.setTimeout(() => document.getElementById('settings-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 120);
  }

  function editContent(row) {
    editRow(row);
    window.setTimeout(() => document.getElementById('content-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  }

  function addContent() {
    addRow();
    window.setTimeout(() => document.getElementById('content-editor')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 80);
  }

  function renderField([name, label, type, required]) {
    const value = form?.[name] ?? (type === 'boolean' ? false : '');
    const settingKey = section === 'site_settings' && name === 'setting_value' ? form?.setting_key : null;
    let parsedSetting;
    if (settingKey) {
      try { parsedSetting = JSON.parse(value); } catch { parsedSetting = null; }
    }
    const isImageSetting = Boolean(settingKey && imageSettingKeys.has(settingKey));
    const displayLabel = settingLabels[settingKey] || label;
    const helpText = settingHelp[settingKey];
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
            <option value="">Pilih dari Media…</option>
            {libraryImages.filter((asset) => !imagePaths.includes(asset.object_path)).map((asset) => <option key={asset.id} value={asset.object_path}>{asset.original_name}</option>)}
          </select>
          <label className={`${styles.imageUploadButton} ${busy ? styles.imageUploadDisabled : ''}`}>
            <span>{busy ? 'Mengunggah…' : 'Unggah gambar tambahan'}</span>
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
          <figcaption><code>{path}</code><button type="button" disabled={busy} onClick={() => changeField(name, imagePaths.filter((_, itemIndex) => itemIndex !== index))}>Hapus</button></figcaption>
        </figure>)}</div> : <small className={styles.fieldHint}>{section === 'certificates' ? 'Gambar tambahan akan tampil sebagai slide setelah gambar utama sertifikat.' : 'Unggah screenshot tambahan agar tampil di carousel detail project.'}</small>}
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
          <span>{displayLabel}{required && <b aria-hidden="true"> *</b>}</span>
          {helpText && <small>{helpText}</small>}
          {!isImageSetting && <input id={`${section}-${name}`} name={name} type="text" required={required} value={imagePath}
            placeholder="Pilih gambar dari Media atau unggah gambar baru" onChange={(event) => applyPath(event.target.value)} />}
        </label>
        <div className={styles.imageTools}>
          <select aria-label={`Pilih ${displayLabel} dari gambar yang sudah diunggah`} defaultValue="" disabled={busy}
            onChange={(event) => { if (event.target.value) applyPath(event.target.value); event.target.value = ''; }}>
            <option value="">Pilih gambar dari Media…</option>
            {libraryImages.map((asset) => <option key={asset.id} value={asset.object_path}>{asset.original_name}</option>)}
          </select>
          <label className={`${styles.imageUploadButton} ${busy ? styles.imageUploadDisabled : ''}`}>
            <span>{busy ? 'Mengunggah…' : 'Unggah gambar baru'}</span>
            <input type="file" accept="image/jpeg,image/png,image/webp,image/avif" disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = '';
                if (file) void uploadImageToField(file, applyPath);
              }} />
          </label>
        </div>
        {previewUrl && <div className={styles.imagePreview}><img src={previewUrl} alt={`Pratinjau: ${displayLabel}`} />{!isImageSetting && <code>{imagePath}</code>}</div>}
      </div>;
    }
    if (settingKey && colorSettingKeys.has(settingKey)) return <label className={`${styles.field} ${styles.settingColor}`} key={name}>
      <span>{displayLabel}</span>{helpText && <small>{helpText}</small>}<div><input aria-label={displayLabel} type="color" value={typeof parsedSetting === 'string' ? parsedSetting : '#ffffff'}
        onChange={(event) => changeField(name, JSON.stringify(event.target.value))} /><code>{parsedSetting}</code></div>
    </label>;
    if (settingKey && numberSettingRanges[settingKey]) {
      const [min, max, step] = numberSettingRanges[settingKey];
      return <label className={styles.field} key={name}>
        <span>{displayLabel}</span>{helpText && <small>{helpText}</small>}
        <div className={styles.rangeControl}><input type="range" min={min} max={max} step={step} value={Number(parsedSetting ?? min)}
          onChange={(event) => changeField(name, JSON.stringify(Number(event.target.value)))} /><output>{Math.round(Number(parsedSetting ?? min) * 100)}%</output></div>
      </label>;
    }
    if ((settingKey && settingKey.startsWith('components.') && settingKey.endsWith('.enabled')) || booleanSettingKeys.has(settingKey)) return <label className={styles.toggleField} key={name}>
      <input type="checkbox" checked={Boolean(parsedSetting)} onChange={(event) => changeField(name, JSON.stringify(event.target.checked))} />
      <span>{displayLabel}{helpText && <small>{helpText}</small>}</span>
    </label>;
    if (settingKey && choiceSettingOptions[settingKey]) return <fieldset className={`${styles.field} ${styles.wide} ${styles.settingChoices}`} key={name}>
      <legend>{displayLabel}</legend>{helpText && <small>{helpText}</small>}
      <div>{choiceSettingOptions[settingKey].map((choice) => <label key={choice}>
        <input type="radio" name={settingKey} value={choice} checked={(parsedSetting ?? choiceSettingOptions[settingKey][0]) === choice}
          onChange={() => changeField(name, JSON.stringify(choice))} />
        <span>{({ portrait: 'Tegak', landscape: 'Mendatar', glossy: 'Mengilap', matte: 'Doff', holographic: 'Hologram', metallic: 'Metalik', cover: 'Penuhi kartu', contain: 'Tampilkan seluruh gambar', dark: 'Gelap', light: 'Terang' })[choice] || choice}</span>
      </label>)}</div>
    </fieldset>;
    if (settingKey && arraySettingKeys.has(settingKey)) return <label className={`${styles.field} ${styles.wide}`} key={name}>
      <span>{displayLabel}</span>{helpText && <small>{helpText}</small>}<textarea rows={5} value={Array.isArray(parsedSetting) ? parsedSetting.join('\n') : ''}
        onChange={(event) => changeField(name, JSON.stringify(event.target.value.split('\n').map((item) => item.trim()).filter(Boolean).slice(0, 12)))} />
      <small>Tekan Enter untuk menambah baris baru.</small>
    </label>;
    if (settingKey === 'scroll_expand.description' && typeof parsedSetting === 'string') return <label className={`${styles.field} ${styles.wide}`} key={name}>
      <span>{displayLabel}</span>{helpText && <small>{helpText}</small>}<textarea rows={5} value={parsedSetting} maxLength={500}
        onChange={(event) => changeField(name, JSON.stringify(event.target.value))} />
    </label>;
    if (settingKey && typeof parsedSetting === 'string') return <label className={styles.field} key={name}>
      <span>{displayLabel}</span>{helpText && <small>{helpText}</small>}<input type="text" value={parsedSetting} maxLength={500}
        onChange={(event) => changeField(name, JSON.stringify(event.target.value))} />
    </label>;
    if (type === 'multi') return <fieldset className={`${styles.field} ${styles.wide} ${styles.multiField}`} key={name}>
      <legend>{label}</legend>{data.technologies.length ? <div className={styles.multiOptions}>{data.technologies.map((technology) => <label key={technology.id}>
        <input id={`${section}-${name}-${technology.id}`} name={`${name}[]`} type="checkbox" checked={(value ?? []).includes(technology.id)} onChange={(event) => changeField(name, event.target.checked ? [...(value ?? []), technology.id] : value.filter((id) => id !== technology.id))} />{technology.name}
      </label>)}</div> : <small>Add technologies first to connect them to a project.</small>}
    </fieldset>;
    if (type === 'boolean') return <label className={styles.toggleField} key={name}>
      <input id={`${section}-${name}`} name={name} type="checkbox" checked={Boolean(value)} onChange={(event) => {
        const checked = event.target.checked;
        changeField(name, checked);
        if (section === 'experiences' && name === 'is_current' && checked) changeField('end_date', '');
      }} />
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span>
      </label>;
    if (type === 'textarea' || type === 'json') return <label className={`${styles.field} ${styles.wide}`} key={name}>
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span><textarea id={`${section}-${name}`} name={name} rows={type === 'json' ? 5 : 4} required={required} value={value ?? ''} onChange={(event) => changeField(name, event.target.value)} spellCheck={type !== 'json'} />
      {type === 'json' && <small>String, angka, boolean, atau array JSON sesuai jenis pengaturan.</small>}
    </label>;
    return <label className={styles.field} key={name}>
      <span>{label}{required && <b aria-hidden="true"> *</b>}</span><input id={`${section}-${name}`} name={name} type={type} required={required} readOnly={section === 'site_settings' && name === 'setting_key' && Boolean(selectedId)} disabled={section === 'experiences' && name === 'end_date' && form?.is_current} value={value ?? ''} onChange={(event) => changeField(name, event.target.value)} />
      {section === 'site_settings' && name === 'setting_key' && selectedId && <small>Kunci ini sudah terhubung ke komponen website dan tidak dapat diubah.</small>}
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
      <div className={styles.sidebarFoot}><span>Masuk sebagai admin</span><form action={logoutAdmin}><button type="submit">Keluar <span aria-hidden="true">↗</span></button></form></div>
    </aside>

    <main className={styles.main}>
      <header className={styles.topbar}><div><p className={styles.crumb}>PORTOFOLIO / CMS</p><h1>{pageTitle}</h1></div><Link href="/" target="_blank" rel="noreferrer" className={styles.viewSite}>Lihat website <span aria-hidden="true">↗</span></Link></header>
      {initialError && <div className={styles.alert} role="alert"><strong>Data belum dapat dimuat.</strong> {initialError} Pastikan konfigurasi dan migrasi Supabase sudah siap.</div>}
      {notice && <p className={notice.kind === 'error' ? styles.errorNotice : styles.successNotice} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p>}

      {section === 'overview' ? <section className={styles.overview}>
        <div className={styles.welcome}><p className={styles.crumb}>RUANG KONTEN</p><h2>Kelola konten website</h2><p>Ubah informasi, atur urutannya, lalu pilih konten yang ingin ditampilkan di website.</p></div>
        <div className={styles.stats}>
          {[
            ['Proyek tayang', data.projects.filter((item) => item.is_published).length, 'projects'], ['Keahlian tampil', data.skills.filter((item) => item.is_visible).length, 'skills'],
            ['Pengalaman tayang', data.experiences.filter((item) => item.is_published).length, 'experiences'], ['Pesan belum dibaca', unreadCount, 'contact_messages']
          ].map(([label, count, target]) => <button key={label} type="button" onClick={() => openSection(target)}><span>{label}</span><strong>{count}</strong><small>Buka {label.toLowerCase()} →</small></button>)}
        </div>
        <div className={styles.overviewGrid}>
          <section className={styles.overviewBlock}><div className={styles.blockHead}><h2>Bagian konten</h2><span>{nav.length - 1} bagian</span></div>
            {nav.slice(1).map(([id, label]) => <button className={styles.overviewRow} type="button" key={id} onClick={() => openSection(id)}><span>{label}</span><strong>{rowsForSection(data, id).length}</strong><span aria-hidden="true">↗</span></button>)}
          </section>
          <section className={styles.overviewBlock}><div className={styles.blockHead}><h2>Pengaturan tampilan</h2><span>Komponen website</span></div>
            {settingDefaults.slice(0, 5).map(([key, defaultValue]) => {
              const row = data.site_settings.find((item) => item.setting_key === key);
              return <button type="button" className={styles.settingRow} key={key} onClick={() => openSection('site_settings')}><span>{settingLabels[key] || key}</span><strong>{row ? String(Array.isArray(row.setting_value) ? row.setting_value.join(' · ') : row.setting_value) : String(defaultValue)}</strong></button>;
            })}
          </section>
        </div>
      </section> : null}

      {section === 'site_settings' && <section className={styles.settingsStudio} aria-labelledby="settings-studio-title">
        <div className={styles.settingsStudioHead}><div><p className={styles.crumb}>EDITOR VISUAL</p><h2 id="settings-studio-title">Pengaturan mengikuti bagian website</h2><p>Pilih bagian yang ingin diubah. Pratinjau di bawah memakai konten dan gaya dari website.</p></div><Link href="/" target="_blank" rel="noreferrer" className={styles.viewSite}>Buka website <span aria-hidden="true">↗</span></Link></div>
        <div className={styles.settingsCards}>{settingGroups.map((group) => {
          const settings = settingDefaults.filter(([key]) => group.prefix
            ? key.startsWith(group.prefix)
            : !key.startsWith('profile_card.') && !key.startsWith('lanyard.') && !key.startsWith('scroll_expand.'));
          const previewRow = data.site_settings.find((row) => row.setting_key === group.previewKey);
          const previewDefault = settings.find(([key]) => key === group.previewKey);
          const previewValue = previewRow?.setting_value ?? previewDefault?.[1] ?? '';
          return <article className={styles.settingsCard} key={group.title}>
            <div className={styles.settingsCardHead}><div><span className={styles.settingsCardEyebrow}>BAGIAN WEBSITE</span><h3>{group.title}</h3><p>{group.description}</p></div><span className={styles.settingsCount}>{settings.length} opsi</span></div>
            <div className={styles.settingsCardPreview}><AdminContentPreview section="site_settings" form={{ setting_key: group.previewKey, setting_value: JSON.stringify(previewValue) }} data={data} supabase={supabase} /></div>
            <details className={styles.settingsOptions}>
              <summary>Atur bagian ini <span aria-hidden="true">↓</span></summary>
              <div className={styles.settingsOptionList}>{settings.map(([key, defaultValue]) => {
                const row = data.site_settings.find((item) => item.setting_key === key);
                const currentValue = row?.setting_value ?? defaultValue;
                const valueText = settingValueSummary(key, currentValue);
                return <div className={styles.settingsOption} key={key}><span><strong>{settingLabels[key] || key}</strong><small>{valueText}</small></span>
                  <button type="button" disabled={busy} onClick={() => row ? editSetting(row) : addAndEditSetting([key, defaultValue])}>Atur</button></div>;
              })}</div>
            </details>
          </article>;
        })}</div>
      </section>}

      {section === 'media_assets' && <section className={styles.mediaUpload}>
        <div><h2>Unggah gambar</h2><p>Gambar website · JPG, PNG, WebP, atau AVIF · maksimal 15 MB</p></div>
        <form onSubmit={uploadMedia}><label className={styles.fileInput}><span>{uploadFile?.name ?? 'Pilih file gambar'}</span><input type="file" accept="image/jpeg,image/png,image/webp,image/avif" onChange={(event) => setUploadFile(event.target.files?.[0] ?? null)} required /></label><button className={styles.primaryButton} type="submit" disabled={busy || !uploadFile}>{busy ? 'Mengunggah…' : 'Unggah gambar'}</button></form>
      </section>}

      {fields[section] && section !== 'site_settings' && <section className={styles.contentLibrary} aria-labelledby="content-library-title">
        <div className={styles.contentLibraryHead}><div><p className={styles.crumb}>KONTEN WEBSITE</p><h2 id="content-library-title">Pilih konten yang ingin diubah</h2><p>Setiap kartu mewakili satu konten. Pilih Ubah untuk membuka form dan pratinjaunya.</p></div>
          {!(section === 'profiles' && data.profiles.length > 0) && <button className={styles.primaryButton} type="button" onClick={addContent}>＋ Tambah {pageTitle.toLowerCase()}</button>}
        </div>
        <label className={styles.search}><span aria-hidden="true">⌕</span><input placeholder={`Cari ${pageTitle.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)} /></label>
        {visibleRows.length === 0 ? <div className={styles.contentEmpty}><strong>{search ? 'Konten tidak ditemukan' : 'Belum ada konten'}</strong><span>{search ? 'Coba kata lain atau hapus pencarian.' : `Pilih “Tambah ${pageTitle.toLowerCase()}” untuk membuat konten pertama.`}</span></div>
          : <div className={styles.contentGrid}>{visibleRows.map((row) => {
            const path = contentImagePath(section, row);
            const image = path ? (/^(https?:)?\/\//i.test(path) || path.startsWith('/') ? path : supabase.storage.from('portfolio-public').getPublicUrl(path).data.publicUrl) : '';
            const summary = contentSummary(section, row);
            const title = recordName(section, row);
            return <article className={`${styles.contentCard} ${selectedId === row.id ? styles.contentCardSelected : ''}`} key={row.id}>
              <div className={styles.contentCardMedia}>{image ? <img src={image} alt="" /> : <span aria-hidden="true">{title.slice(0, 2).toUpperCase()}</span>}</div>
              <div className={styles.contentCardBody}><p className={styles.contentCardMeta}>{recordMeta(section, row) || pageTitle}</p><h3>{title}</h3>{summary && <p className={styles.contentCardSummary}>{summary}</p>}
                <button className={styles.contentEditButton} type="button" onClick={() => editContent(row)}>Ubah konten <span aria-hidden="true">↗</span></button>
              </div>
            </article>;
          })}</div>}
      </section>}

      {section !== 'overview' && <div className={`${styles.workspace} ${section === 'site_settings' || fields[section] ? styles.workspaceSettings : ''}`}>
        <section className={`${styles.listPane} ${section === 'site_settings' || fields[section] ? styles.settingsListHidden : ''}`} aria-label={`${pageTitle} list`}>
          <div className={styles.listHead}><div><h2>{pageTitle}</h2><span>{rows.length} konten</span></div>{fields[section] && section !== 'site_settings' && !(section === 'profiles' && data.profiles.length > 0) && <button className={styles.addButton} type="button" onClick={addRow}>＋ Tambah</button>}</div>
          {sectionHelp[section] && <p className={styles.sectionHelp}>{sectionHelp[section]}</p>}
          {section !== 'contact_messages' && <label className={styles.search}><span aria-hidden="true">⌕</span><input placeholder={`Cari ${pageTitle.toLowerCase()}`} value={search} onChange={(event) => setSearch(event.target.value)} /></label>}
          <div className={styles.records}>
            {visibleRows.length === 0 ? <div className={styles.empty}><strong>{search ? 'Konten tidak ditemukan' : 'Belum ada konten'}</strong><span>{section === 'site_settings' ? 'Pilih Tambah pengaturan di atas untuk menambahkan kontrol tampilan.' : fields[section] ? 'Pilih Tambah untuk membuat konten pertama.' : 'Konten baru akan muncul di sini.'}</span></div> : visibleRows.map((row) => <button type="button" key={row.id} onClick={() => editRow(row)} className={selectedId === row.id ? styles.recordActive : styles.record}>
              <span className={styles.recordName}>{recordName(section, row)}</span>
              <span className={styles.recordMeta}>{recordMeta(section, row)}</span>
            </button>)}
          </div>
        </section>

        <section className={`${styles.editor} ${section === 'site_settings' || fields[section] ? styles.settingsEditor : ''}`} id={section === 'site_settings' ? 'settings-editor' : fields[section] ? 'content-editor' : undefined} aria-label={`${pageTitle} editor`}>
          {section === 'contact_messages' ? <MessageViewer row={data.contact_messages.find((item) => item.id === selectedId)} onStatus={updateMessage} onDelete={deleteMessage} busy={busy} />
            : section === 'media_assets' ? <MediaViewer rows={data.media_assets} supabase={supabase} getReferences={(asset) => mediaReferences(asset, data)} onDelete={deleteMedia} busy={busy} />
            : form && fields[section] ? <div className={styles.editorLayout}><form className={styles.editForm} onSubmit={saveRow}>
              <div className={styles.editorHead}><div><p className={styles.crumb}>{selectedId ? 'SEDANG MENGEDIT' : 'KONTEN BARU'}</p><h2>{selectedId ? (section === 'site_settings' ? settingLabels[form.setting_key] || recordName(section, form) : recordName(section, form)) : `Tambah ${pageTitle.toLowerCase()}`}</h2>{section === 'site_settings' && <p className={styles.editorDescription}>Ubah pilihan di bawah. Pratinjau di samping ikut berubah sebelum disimpan.</p>}</div>{selectedId && section !== 'site_settings' && <button type="button" className={styles.deleteButton} disabled={busy} onClick={() => deleteRow(form)}>Hapus</button>}</div>
              <div className={styles.formGrid}>{fields[section].map(renderField)}</div>
              {form && <p className={isDirty ? styles.dirtyState : styles.savedState}>{isDirty ? 'Ada perubahan yang belum disimpan.' : selectedId ? 'Semua perubahan sudah tersimpan.' : 'Isi konten baru, lalu simpan untuk menampilkannya.'}</p>}
              {notice && <p className={notice.kind === 'error' ? styles.errorNotice : styles.successNotice} role={notice.kind === 'error' ? 'alert' : 'status'}>{notice.text}</p>}
              <div className={styles.formActions}><button type="submit" className={styles.primaryButton} disabled={busy || (!selectedId && !isDirty)}>{busy ? 'Menyimpan…' : 'Simpan perubahan'}</button><button type="button" className={styles.cancelButton} onClick={() => {
                if (!confirmDiscardChanges()) return;
                setForm(null);
                setSavedForm(null);
                setSelectedId(null);
              }}>Tutup editor</button></div>
            </form><AdminContentPreview section={section} form={form} data={data} supabase={supabase} /></div> : <div className={styles.editorEmpty}><span className={styles.editorRule} /><h2>{fields[section] ? 'Form edit konten' : 'Pilih konten'}</h2><p>{fields[section] ? 'Pilih tombol “Ubah konten” pada kartu di atas. Form dan pratinjau akan muncul di sini.' : 'Pilih item di daftar untuk melihat detailnya.'}</p></div>}
        </section>
      </div>}
    </main>
  </div>;
}

function MessageViewer({ row, onStatus, onDelete, busy }) {
  if (!row) return <div className={styles.editorEmpty}><span className={styles.editorRule} /><h2>Pesan masuk</h2><p>Pilih pesan di daftar untuk membaca dan memperbarui statusnya.</p></div>;
  const status = { unread: 'BELUM DIBACA', read: 'SUDAH DIBACA', archived: 'DIARSIPKAN' }[row.status] || row.status.toUpperCase();
  return <article className={styles.messageView}>
    <p className={styles.crumb}>{status} / {new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Jakarta' }).format(new Date(row.created_at))}</p>
    <h2>{row.subject}</h2><p className={styles.messageFrom}>{row.name} · <a href={`mailto:${row.email}`}>{row.email}</a></p>
    <p className={styles.messageBody}>{row.message}</p>
    <div className={styles.messageActions}><button type="button" disabled={busy} onClick={() => onStatus(row, 'read')}>Tandai dibaca</button><button type="button" disabled={busy} onClick={() => onStatus(row, 'archived')}>Arsipkan</button><button type="button" disabled={busy} onClick={() => onStatus(row, 'unread')}>Tandai belum dibaca</button><button type="button" disabled={busy} onClick={() => onDelete(row)}>Hapus pesan</button></div>
  </article>;
}

function MediaViewer({ rows, supabase, getReferences, onDelete, busy }) {
  if (!rows.length) return <div className={styles.editorEmpty}><span className={styles.editorRule} /><h2>Perpustakaan media</h2><p>Gambar yang diunggah akan muncul di sini. Pilih gambar ini dari editor konten yang membutuhkan gambar.</p></div>;
  return <div className={styles.mediaGrid}>{rows.map((row) => <article className={styles.mediaCard} key={row.id}>
    <div className={styles.mediaPreview}>{row.bucket_id === 'portfolio-public' ? <img src={supabase.storage.from(row.bucket_id).getPublicUrl(row.object_path).data.publicUrl} alt="" /> : <span>FILE PRIVAT</span>}</div>
    <strong title={row.original_name}>{row.original_name}</strong><code>{row.object_path}</code><small>{(Number(row.size_bytes) / 1024 / 1024).toFixed(2)} MB · {row.mime_type}</small>
    {getReferences(row).length > 0 && <small className={styles.mediaUsage}>Dipakai oleh: {getReferences(row).join(', ')}. Hapus konten yang memakai gambar ini sebelum menghapus file.</small>}
    <div className={styles.mediaActions}><button type="button" onClick={() => navigator.clipboard.writeText(row.object_path)}>Salin path</button><button type="button" disabled={busy || getReferences(row).length > 0} onClick={() => onDelete(row)}>Hapus</button></div>
  </article>)}</div>;
}
