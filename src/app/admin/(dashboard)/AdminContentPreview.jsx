'use client';

import styles from './AdminContentPreview.module.css';

function imageUrl(supabase, path) {
  if (!path || typeof path !== 'string') return '';
  if (/^(https?:)?\/\//i.test(path) || path.startsWith('/')) return path;
  return supabase.storage.from('portfolio-public').getPublicUrl(path).data.publicUrl;
}

function PreviewImage({ supabase, src, alt = '', className = '' }) {
  const url = src ? imageUrl(supabase, src) : '';
  return url
    ? <img className={`${styles.image} ${className}`} src={url} alt={alt} />
    : <div className={`${styles.imagePlaceholder} ${className}`}>Gambar belum dipilih</div>;
}

function year(date) {
  if (!date) return '';
  const value = new Date(`${date}T00:00:00`).getFullYear();
  return Number.isNaN(value) ? '' : value;
}

function formatPeriod(start, end, current) {
  const years = [year(start), current ? 'Present' : year(end)].filter(Boolean);
  return years.join(' — ');
}

function SettingPreview({ form, data, supabase }) {
  const settings = Object.fromEntries((data.site_settings ?? []).map((row) => [row.setting_key, row.setting_value]));
  let value = form.setting_value;
  try { value = JSON.parse(form.setting_value); } catch {}
  const key = form.setting_key || '';
  settings[key] = value;
  const profile = data.profiles?.[0] ?? {};
  const componentEnabled = key.startsWith('components.') ? value !== false : true;
  const group = key.startsWith('profile_card.') ? 'Kartu profil'
    : key.startsWith('lanyard.') ? 'Lanyard'
      : key.startsWith('scroll_expand.') ? 'Behind the Code'
        : key.startsWith('appearance.') ? 'Tema website'
          : key.startsWith('components.') ? 'Visibilitas komponen'
            : key.startsWith('hero.') || key.startsWith('scroll_velocity.') || key.startsWith('glow_cursor.') ? 'Hero & interaksi'
              : 'Pengaturan website';

  return (
    <aside className={styles.panel} aria-label="Pratinjau pengaturan website">
      <div className={styles.panelHeader}><span>PRATINJAU LANGSUNG</span><strong>{group}</strong></div>
      {key.startsWith('appearance.') || key.includes('.color') ? (
        <div className={styles.colorPreview}>
          <span style={{ background: typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value) ? value : '#7ff3ff' }} />
          <div><strong>{group}</strong><small>{typeof value === 'string' ? value : 'Nilai warna akan terlihat di website.'}</small></div>
        </div>
      ) : key.startsWith('profile_card.') ? (
        <article className={styles.profilePreview}>
          <div className={styles.profileGlow} />
          <PreviewImage supabase={supabase} src={settings['profile_card.icon_pattern'] || profile.profile_icon_path} alt="" />
          <div className={styles.profileInfo}>
            <strong>{settings['profile_card.name'] || profile.full_name || 'Nama profil'}</strong>
            <span>{settings['profile_card.title'] || profile.professional_title || 'Jabatan profesional'}</span>
            <small>{settings['profile_card.status'] || profile.availability_status || 'Status'}</small>
          </div>
          <span className={styles.previewTag}>KARTU PROFIL</span>
        </article>
      ) : key.startsWith('lanyard.') ? (
        <div className={styles.lanyardPreview}>
          <PreviewImage supabase={supabase} src={settings['lanyard.front_image'] || profile.avatar_path} alt="Pratinjau gambar lanyard" />
          <strong>{settings['profile_card.name'] || profile.full_name || 'Nama kartu'}</strong>
          <span>{settings['lanyard.orientation'] || 'portrait'} · {settings['lanyard.finish'] || 'glossy'}</span>
        </div>
      ) : key.startsWith('scroll_expand.') ? (
        <div className={styles.expandPreview}>
          <PreviewImage supabase={supabase} src={settings['scroll_expand.media_path']} alt={settings['scroll_expand.alt'] || ''} />
          <small>{settings['scroll_expand.kicker'] || 'PROFILE / 01'}</small>
          <strong>{settings['scroll_expand.title'] || 'BEHIND THE CODE'}</strong>
          <span>{settings['scroll_expand.name'] || profile.full_name || 'Nama'}</span>
          <p>{settings['scroll_expand.description'] || 'Deskripsi bagian ini akan muncul di website.'}</p>
        </div>
      ) : key.startsWith('components.') ? (
        <div className={styles.visibilityPreview}>
          <span className={componentEnabled ? styles.enabledDot : styles.disabledDot} />
          <strong>{componentEnabled ? 'Bagian ini tampil di website' : 'Bagian ini disembunyikan'}</strong>
          <p>{key.replace('components.', '').replace('.enabled', '').replaceAll('_', ' ')}</p>
        </div>
      ) : (
        <div className={styles.settingValuePreview}>
          <strong>{Array.isArray(value) ? 'Daftar yang tampil' : 'Nilai yang tampil'}</strong>
          {Array.isArray(value) ? <ul>{value.map((item, index) => <li key={`${item}-${index}`}>{item}</li>)}</ul> : <p>{String(value ?? '')}</p>}
        </div>
      )}
      <p className={styles.note}>Pratinjau mengikuti nilai yang sedang diedit. Simpan untuk menerapkannya ke website.</p>
    </aside>
  );
}

export default function AdminContentPreview({ section, form, data, supabase }) {
  if (!form) return null;
  if (section === 'site_settings') return <SettingPreview form={form} data={data} supabase={supabase} />;

  const sectionTitle = {
    profiles: 'Profil', projects: 'Proyek', technologies: 'Teknologi', skills: 'Keahlian',
    experiences: 'Pengalaman', history_entries: 'History', certificates: 'Sertifikat', social_links: 'Tautan sosial'
  }[section] || 'Konten website';
  const published = ['projects', 'experiences', 'history_entries', 'certificates'].includes(section)
    ? Boolean(form.is_published)
    : ['technologies', 'skills', 'social_links'].includes(section) ? Boolean(form.is_visible) : null;
  const imagePath = form.cover_path || form.avatar_path || form.logo_path || form.image_path;
  const technologyNames = section === 'projects'
    ? (form.technology_ids ?? []).map((id) => data.technologies.find((item) => item.id === id)?.name).filter(Boolean)
    : [];

  return (
    <aside className={styles.panel} aria-label={`Pratinjau ${sectionTitle}`}>
      <div className={styles.panelHeader}><span>PRATINJAU LANGSUNG</span><strong>{sectionTitle}</strong></div>
      {published !== null && <p className={published ? styles.statusPublished : styles.statusDraft}>{published ? 'Akan tampil di website' : 'Masih disimpan sebagai draf'}</p>}

      {section === 'profiles' && <div className={styles.profilePreview}>
        <PreviewImage supabase={supabase} src={form.avatar_path} alt="Foto profil" />
        <div className={styles.profileInfo}><strong>{form.full_name || 'Nama lengkap'}</strong><span>{form.professional_title || 'Jabatan profesional'}</span><p>{form.headline || form.bio || 'Kalimat pembuka profil'}</p><small>{[form.location, form.availability_status].filter(Boolean).join(' · ')}</small></div>
        <span className={styles.previewTag}>INTRO / PROFILE</span>
      </div>}

      {section === 'projects' && <article className="portfolio-project-card">
        <span className="project-card-index">PROJECT / {String(Number(form.sort_order || 0) + 1).padStart(2, '0')}</span>
        <div className="project-card-cover" data-missing={form.cover_path ? 'false' : 'true'}>
          {form.cover_path ? <PreviewImage supabase={supabase} src={form.cover_path} alt="Sampul proyek" /> : <strong>{(form.title || 'PR').slice(0, 2).toUpperCase()}</strong>}
        </div>
        <div className="project-card-copy"><h3>{form.title || 'Nama proyek'}</h3><p>{form.summary || form.description || 'Ringkasan proyek akan muncul di sini.'}</p>
          {technologyNames.length > 0 && <div className="project-card-tech">{technologyNames.slice(0, 4).map((name) => <span key={name}>{name}</span>)}</div>}
          {(form.demo_url || form.github_url) && <div className="project-card-links">{form.demo_url && <span>Live project ↗</span>}{form.github_url && <span>Source ↗</span>}</div>}
        </div>
      </article>}

      {['technologies', 'skills'].includes(section) && <div className={styles.skillPreview}>
        <p className="composition-label">SKILLS / TECHNOLOGIES</p><span>{form.name || `Nama ${sectionTitle.toLowerCase()}`}</span>
        {form.category && <small>{form.category}</small>}
        {form.description && <p>{form.description}</p>}
      </div>}

      {section === 'experiences' && <article className="managed-entry">
        <span className="entry-index">{String(Number(form.sort_order || 0) + 1).padStart(2, '0')}</span>
        <div className="managed-entry-body">{form.logo_path && <PreviewImage supabase={supabase} src={form.logo_path} alt="Logo organisasi" />}
          <div><h3>{form.position || 'Jabatan'}</h3><p>{form.organization || 'Organisasi'}{formatPeriod(form.start_date, form.end_date, form.is_current) && ` · ${formatPeriod(form.start_date, form.end_date, form.is_current)}`}</p><small>{form.description || 'Deskripsi pengalaman'}</small></div>
        </div>
      </article>}

      {section === 'history_entries' && <article className="history-slide is-revealed">
        <div className="history-slide-open"><span className="history-slide-year">{year(form.event_date) || '2026'}</span><div className="history-slide-copy">
          <span className="history-slide-category">{form.category || 'Kategori'}</span><span className="history-slide-title">{form.title || 'Nama peristiwa'}</span><span className="history-slide-description">{form.description || 'Deskripsi peristiwa'}</span>
          {form.image_path && <PreviewImage supabase={supabase} src={form.image_path} alt="Gambar peristiwa" />}
        </div></div>
      </article>}

      {section === 'certificates' && <div className="certificate-showcase">
        <p className="certificate-preview-kicker">SERTIFIKAT / 01</p><h3>{form.title || 'Nama sertifikat'}</h3>
        <div className="certificate-vertical-stage"><div className="certificate-vertical-card is-active">
          {form.image_path ? <PreviewImage supabase={supabase} src={form.image_path} alt="Gambar sertifikat" /> : <span className={styles.certificateMissing}>Pilih gambar sertifikat</span>}
        </div></div>
        <div className="certificate-showcase-meta"><span>{year(form.event_date) || 'Tahun terbit'}</span>{form.description && <p>{form.description}</p>}</div>
        {Array.isArray(form.preview_paths) && form.preview_paths.length > 0 && <small className={styles.previewCount}>+ {form.preview_paths.length} gambar tambahan</small>}
      </div>}

      {section === 'social_links' && <div className={styles.socialPreview}><span>{form.platform || 'Platform'}</span><strong>{form.label || form.platform || 'Nama tautan sosial'}</strong><small>{form.url || 'https://example.com'}</small></div>}

      <p className={styles.note}>Pratinjau berubah saat Anda mengedit. Simpan, lalu muat ulang website untuk menerapkan perubahan.</p>
    </aside>
  );
}
