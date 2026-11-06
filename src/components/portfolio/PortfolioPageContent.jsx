'use client';

import { useEffect, useState } from 'react';
import {
  AboutTransition,
  ContactGlow,
  HeroAnimations,
  LanyardMount,
  PortfolioNavigation,
  ProfileCardMount,
  ProjectCardSwap,
  TechnologyMarquee,
  VelocityTransition,
} from "@/components/portfolio/ReactBitsPortfolio";
import ContactForm from "@/components/portfolio/ContactForm";
import CertificatePreview from "@/components/portfolio/CertificatePreview";
import HistoryCarousel from "@/components/portfolio/HistoryCarousel";
import FoldText from "@/components/react-bits/FoldText";
import SkillLogoLoops from "@/components/portfolio/SkillLogoLoops";

const technology = ["HTML", "CSS", "JavaScript", "Laravel", "PHP"];
export const dynamic = "force-dynamic";

function SectionHeading({ number, title, description, id }) {
  return (
    <div className="section-heading">
      <span className="section-number">{number}</span>
      <div>
        <h2 className="section-title" id={id}>
          <FoldText text={title} splitBy="char" hinge="top" foldStyle="paper" trigger="scroll"
            foldAngle={92} duration={0.65} stagger={0.035} ease="power3.out"
            perspective={700} creaseShading={0.45} hoverRefold refoldRadius={140} refoldAngle={45}
            color="var(--cyan)" className="section-title-fold" />
        </h2>
        <p className="section-description">{description}</p>
      </div>
    </div>
  );
}

function EmptyEntry({ index, label }) {
  return <div className="empty-entry"><span className="entry-index">{index}</span><span>{label}</span><span className="entry-state">To be added</span></div>;
}

function formatPeriod(start, end, current) {
  const year = (value) => value ? new Date(`${value}T00:00:00`).getFullYear() : "";
  return [year(start), current ? "Present" : year(end)].filter(Boolean).join(" — ");
}

export default function PortfolioPageContent({ initialContent, cmsPreview = false }) {
  const [content, setContent] = useState(initialContent);
  useEffect(() => {
    if (!cmsPreview) return undefined;
    const receivePreview = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'portfolio-cms-preview') {
        setContent(event.data.content);
        window.scrollTo({ top: 0, behavior: 'instant' });
      }
    };
    const selectSection = (event) => {
      if (!cmsPreview) return;
      const target = event.target.closest('[data-cms-setting], [data-cms-section]');
      if (target) {
        event.preventDefault();
        event.stopPropagation();
        window.parent.postMessage({ type: 'portfolio-cms-select', section: target.dataset.cmsSection, settingKey: target.dataset.cmsSetting }, window.location.origin);
      }
    };
    window.addEventListener('message', receivePreview);
    document.addEventListener('click', selectSection, true);
    window.parent.postMessage({ type: 'portfolio-cms-preview-ready' }, window.location.origin);
    return () => {
      window.removeEventListener('message', receivePreview);
      document.removeEventListener('click', selectSection, true);
    };
  }, [cmsPreview]);

  const profile = content?.profile;
  const settings = content?.settings ?? {};
  const name = settings['hero.text'] || profile?.full_name || "Ihsan Fawwas Zaidan";
  const title = profile?.professional_title || "Full Stack Web Developer";
  const technologies = content?.technologies?.length ? content.technologies.map((item) => item.name) : technology;
  const certificates = content?.history?.filter((item) => /sertifikat|certificate/i.test(item.category || '')) ?? [];
  const historyEntries = content?.history?.filter((item) => !/sertifikat|certificate/i.test(item.category || '')) ?? [];
  const velocityTexts = settings['scroll_velocity.texts'];
  const primaryAccent = typeof settings['appearance.primary_accent'] === 'string' ? settings['appearance.primary_accent'] : undefined;
  const secondaryAccent = typeof settings['appearance.secondary_accent'] === 'string' ? settings['appearance.secondary_accent'] : undefined;
  const themeStyle = {
    ...(primaryAccent ? { '--cyan': primaryAccent } : {}),
    ...(secondaryAccent ? { '--secondary-accent': secondaryAccent } : {})
  };
  return (
    <main style={themeStyle}>
      <PortfolioNavigation socialItems={content?.social ?? []} showDesktop={settings['components.pill_nav.enabled'] !== false} />

      <section className="page-shell hero" id="home" aria-labelledby="hero-title" data-cms-section="profiles">
        <div className="hero-main" data-cms-setting="hero.text">
          <p className="eyebrow">Personal portfolio <span>/</span> 2026</p>
          <h1 id="hero-title" className="visually-hidden">{name}</h1>
          <HeroAnimations profileName={name} settings={settings} />
          <div className="hero-intro-copy" data-cms-section="profiles">
            <span className="aside-rule" aria-hidden="true" />
            <p className="aside-label">01 / Introduction</p>
            <p className="hero-description">{profile?.headline || profile?.bio || "Selected work, technical interests, and professional background will be presented here as verified details become available."}</p>
            <a className="aside-link" href="#about">Read profile <span aria-hidden="true">↓</span></a>
          </div>
        </div>
        <aside className="hero-aside" aria-label="Interactive lanyard" data-cms-setting="lanyard.front_image">
          {settings['components.lanyard.enabled'] !== false && <div className="hero-lanyard"><LanyardMount profile={profile} settings={settings} /></div>}
        </aside>
        <div className="hero-tech-band" data-cms-setting="hero.tech_loop">
          <TechnologyMarquee technologies={settings['hero.tech_loop'] || technologies} settings={settings} />
        </div>
        <div className="hero-footer">
          <p className="hero-role">{title}</p>
          <div className="hero-links">
            <a href="#projects">View projects <span aria-hidden="true">↘</span></a>
            <a href="#contact">Contact me <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="hero-index" aria-hidden="true">IZ—01</div>
      </section>

      <VelocityTransition texts={velocityTexts} enabled={settings['components.scroll_velocity.enabled'] !== false} />
      <AboutTransition profile={profile} settings={settings} enabled={settings['components.scroll_expand.enabled'] !== false} />

      <section className="page-shell section profile-section" id="profile" aria-labelledby="profile-title" data-cms-section="profiles">
        <SectionHeading number="01" title="About" id="profile-title" description={profile?.bio || "A concise profile. Personal background details will be added when confirmed."}></SectionHeading>
        <div className="profile-composition">
          {settings['components.profile_card.enabled'] !== false && <div className="profile-card-column" data-cms-setting="profile_card.name">
            <p className="composition-label">PROFILE CARD / 01</p>
            <ProfileCardMount profile={profile} settings={settings} />
            <p className="asset-note profile-asset-note">Initials are shown in place of a personal photo.</p>
          </div>}
          {(profile?.location || profile?.availability_status) && <div className="profile-facts">
            {profile.location && <p><span>Location</span><strong>{profile.location}</strong></p>}
            {profile.availability_status && <p><span>Availability</span><strong>{profile.availability_status}</strong></p>}
          </div>}
        </div>
      </section>

      <section className="page-shell section projects-section" id="projects" aria-labelledby="projects-title" data-cms-section="projects">
        <SectionHeading number="02" title="Projects" id="projects-title" description={content?.projects?.length ? "Selected work, its context, and the tools behind each project." : "Selected work with context, technologies, and links will appear here once published."}></SectionHeading>
        <div className="projects-content">
          <p className="composition-label">FEATURED PROJECTS / 01</p>
          {settings['components.card_swap.enabled'] !== false ? <ProjectCardSwap projects={content?.projects ?? []} /> : content?.projects?.length ? <div className="managed-projects">{content.projects.map((project, index) => <article className="managed-project" key={project.id}>
            <span className="managed-project-index">{String(index + 1).padStart(2, '0')}</span>
            <div className="managed-project-copy"><h3>{project.title}</h3><p>{project.summary || project.description}</p>{project.technologies.length > 0 && <div className="managed-project-tech">{project.technologies.map((technologyName) => <span key={technologyName}>{technologyName}</span>)}</div>}</div>
            {project.cover_url && <img src={project.cover_url} alt={`${project.title} cover`} />}
            <div className="managed-project-links">{project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer">GitHub ↗</a>}{project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer">Live ↗</a>}</div>
          </article>)}</div> : <EmptyEntry index="01" label="No published projects yet" />}
        </div>
      </section>

      <section className="page-shell section skills-section" id="skills" aria-labelledby="skills-title" data-cms-section="skills">
        <SectionHeading number="03" title="Skills" id="skills-title" description="Technologies and skills maintained from the admin workspace."></SectionHeading>
        <SkillLogoLoops technologies={technologies} skills={content?.skills ?? []} />
      </section>

      <section className="page-shell section experience-section" id="experience" aria-labelledby="experience-title" data-cms-section="experiences">
        <SectionHeading number="04" title="Experience" id="experience-title" description="Organizations, roles, dates, and responsibilities."></SectionHeading>
        <div className="entry-list">{content?.experiences?.length ? content.experiences.map((item, index) => <article className="managed-entry" key={item.id}><span className="entry-index">{String(index + 1).padStart(2, '0')}</span><div className="managed-entry-body">{item.logo_url && <img className="managed-entry-logo" src={item.logo_url} alt={`${item.organization} logo`} />}<div><h3>{item.position}</h3><p>{item.organization}{formatPeriod(item.start_date, item.end_date, item.is_current) && ` · ${formatPeriod(item.start_date, item.end_date, item.is_current)}`}</p><small>{item.description}</small></div></div></article>) : <EmptyEntry index="01" label="Published experience will appear here" />}</div>
      </section>

      <section className="page-shell section history-section" id="history" aria-labelledby="history-title" data-cms-section="history_entries">
        <SectionHeading number="05" title="History" id="history-title" description="A timeline of milestones and personal achievements."></SectionHeading>
        <HistoryCarousel items={historyEntries} />
      </section>

      <section className="page-shell section certificates-section" id="certificates" aria-labelledby="certificates-title" data-cms-section="certificates">
        <SectionHeading number="06" title="Sertifikat" id="certificates-title" description="Sertifikat dan kredensial yang sudah diterbitkan."></SectionHeading>
        {certificates.length ? <CertificatePreview items={certificates} /> : <p>Tambahkan sertifikat melalui Admin → Sertifikat agar muncul di sini.</p>}
      </section>

      <section className="page-shell section contact-section" id="contact" aria-labelledby="contact-title">
        <SectionHeading number="07" title="Contact" id="contact-title" description="A contact form for project enquiries and collaborations."></SectionHeading>
        {content?.social?.length > 0 && <div className="public-social-links" data-cms-section="social_links">{content.social.map((item) => <a key={item.id} href={item.url} target="_blank" rel="noreferrer">{item.label || item.platform} ↗</a>)}</div>}
        {settings['components.glow_cursor.enabled'] !== false ? <ContactGlow settings={settings}><ContactForm /></ContactGlow> : <ContactForm />}
      </section>

      <footer className="site-footer">
        <div className="page-shell footer-inner">
          <a className="wordmark" href="#home">{name}<span aria-hidden="true">.</span></a>
          <p>© {new Date().getFullYear()} {name}</p>
          <a className="back-to-top" href="#home">Back to top ↑</a>
        </div>
      </footer>
    </main>
  );
}
