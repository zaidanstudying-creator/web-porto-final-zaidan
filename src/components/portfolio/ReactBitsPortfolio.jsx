"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import StaggeredMenu from "@/components/react-bits/StaggeredMenu";

const componentImports = {
  GooeyNav: () => import("@/components/react-bits/GooeyNav"),
  TechText: () => import("@/components/react-bits/TechText"),
  TextLoop: () => import("@/components/react-bits/TextLoop"),
  ScrollVelocity: () => import("@/components/react-bits/ScrollVelocity"),
  ProfileCard: () => import("@/components/react-bits/ProfileCard"),
  Lanyard: () => import("@/components/react-bits/Lanyard"),
  CardSwap: () => import("@/components/react-bits/CardSwap"),
  ScrollExpand: () => import("@/components/react-bits/ScrollExpand"),
  GlowCursor: () => import("@/components/react-bits/GlowCursor"),
};

function useDeferredModule(name, eager = false) {
  const hostRef = useRef(null);
  const loadedRef = useRef(false);
  const [module, setModule] = useState(null);
  const [visible, setVisible] = useState(eager);

  useEffect(() => {
    let alive = true;
    let observer;
    const load = () => componentImports[name]().then((value) => {
      if (alive) {
        loadedRef.current = true;
        setModule(value);
      }
    });

    if (eager || typeof IntersectionObserver === "undefined") {
      load();
    } else {
      observer = new IntersectionObserver(([entry]) => {
        setVisible(entry.isIntersecting);
        if (entry.isIntersecting && !loadedRef.current) load();
      }, { rootMargin: "240px 0px" });
      if (hostRef.current) observer.observe(hostRef.current);
    }

    return () => {
      alive = false;
      observer?.disconnect();
    };
  }, [eager, name]);

  return [hostRef, module, visible];
}

function Mounted({ name, eager = false, suspendOffscreen = false, className = "", fallback = null, children }) {
  const [ref, module, visible] = useDeferredModule(name, eager);
  const renderModule = module && (!suspendOffscreen || visible);
  return <div ref={ref} className={className}>{renderModule ? children(module) : fallback}</div>;
}

const navItems = [
  { href: "#home", label: "Home" },
  { href: "#profile", label: "About" },
  { href: "#projects", label: "Projects" },
  { href: "#skills", label: "Skills" },
  { href: "#experience", label: "Experience" },
  { href: "#history", label: "History" },
  { href: "#certificates", label: "Sertifikat" },
  { href: "#contact", label: "Contact" },
];
const sections = navItems.map(({ href }) => href.slice(1));

export function PortfolioNavigation({ socialItems = [], showDesktop = true }) {
  const [activeHref, setActiveHref] = useState("#home");
  useEffect(() => {
    const nodes = sections.map((id) => document.getElementById(id)).filter(Boolean);
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActiveHref(`#${visible.target.id}`);
    }, { rootMargin: "-20% 0px -60% 0px", threshold: [0, 0.15, 0.35, 0.6] });
    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, []);

  return (
    <>
    {showDesktop && <Mounted name="GooeyNav" eager className="portfolio-pill-nav">
      {(mod) => {
        const GooeyNav = mod.default;
        return <GooeyNav items={navItems} activeIndex={navItems.findIndex((item) => item.href === activeHref)}
          initialActiveIndex={0} theme="dark" size="md" frame particleCount={15} spread={44}
          animationTime={600} timeVariance={300} gooeyness={0.5} wobble={0.35} hoverEffect
          className="portfolio-gooey-nav" />;
      }}
    </Mounted>}
    <div className="portfolio-staggered-nav">
      <StaggeredMenu items={navItems.map(({ href, label }) => ({ label, ariaLabel: `Go to ${label} section`, link: href }))}
        socialItems={socialItems.map((item) => ({ label: item.label || item.platform, link: item.url }))}
        accentColor="var(--cyan)" secondaryColor="var(--secondary-accent, #ff5a36)" />
    </div>
    </>
  );
}

export function HeroAnimations({ profileName = "Ihsan Fawwas Zaidan", settings = {} }) {
  return (
    <div className="hero-animation-stack">
      {settings['components.tech_text.enabled'] !== false && <Mounted name="TechText" eager className="hero-tech-mount" fallback={<span className="hero-name-fallback">{profileName}</span>}>
        {(mod) => { const TechText = mod.default; return <TechText text={profileName} fontWeight={600} fontSize={150} reveal="letter"
          dashLength={4} dashGap={2} specks={15} intro="none" introDuration={2} clickKick
          guides={false} letterSpacing={-0.05} accentColor={settings['appearance.primary_accent'] || "#06b6d4"} reach={200} softness={0.7}
          lineStyle="dashed" strokeWidth={1.5} speed={1} bounce={0.4} selection labels
          color={settings['appearance.primary_accent'] || "#23abc2"} align="center" draggable sweep className="hero-tech" />; }}
      </Mounted>}
      <span className="visually-hidden">{profileName}</span>
    </div>
  );
}

export function TechnologyMarquee({ technologies = [], settings = {} }) {
  if (settings['components.text_loop.enabled'] === false) return null;
  const text = technologies.length ? technologies.join(" ✦ ") : "HTML ✦ CSS ✦ JavaScript ✦ Laravel ✦ PHP";
  return <Mounted name="TextLoop" eager className="hero-loop-mount" fallback={<div className="hero-loop-fallback">{text} ✦ {text}</div>}>
    {(mod) => {
      const TextLoop = mod.default;
      return <TextLoop text={text} shape="line" speed={120} direction="forward" separator="✦"
        curviness={90} tilt={0} fontSize={54} fontWeight={800} textOffsetY={8} letterSpacing={1} uppercase
        ribbon ribbonColor={settings['appearance.secondary_accent'] || "#ff5a36"} ribbonWidth={96}
        edgeFade={0} cross crossAngle={14} draggable scrollBoost={0} outline={false} pauseOnHover
        outlineWidth={1.5} color="#120f17" className="hero-tech-loop" />;
    }}
  </Mounted>;
}

export function VelocityTransition({ texts, enabled = true }) {
  if (!enabled) return null;
  const velocityTexts = Array.isArray(texts) && texts.length ? texts : ["Full Stack Web Developer", "AI Assistant"];
  return <Mounted name="ScrollVelocity" suspendOffscreen className="velocity-mount" fallback={<div className="velocity-fallback">FULL STACK WEB DEVELOPER <span>•</span> AI ASSISTANT</div>}>
    {(mod) => {
      const ScrollVelocity = mod.default;
      return <ScrollVelocity texts={velocityTexts} velocity={250}
        skewWithVelocity={6} scaleWithVelocity={0} draggable fontSize={120} fontWeight={800}
        numCopies={8} damping={50} stiffness={400} separator="•" fadeEdges outlineAlternate
        gap={24} pauseOnHover={false} className="portfolio-velocity"
        parallaxClassName="portfolio-velocity-track" scrollerClassName="portfolio-velocity-row" />;
    }}
  </Mounted>;
}

export function AboutTransition({ profile, settings = {}, enabled = true }) {
  if (!enabled) return null;
  const name = profile?.full_name || "Ihsan Fawwas Zaidan";
  const title = profile?.professional_title || "Full Stack Web Developer";
  const media = settings['scroll_expand.media_path'] || "/images/about-placeholder.svg";
  return <div className="about-transition" id="about" aria-label="About Ihsan Fawwas Zaidan" data-cms-setting="scroll_expand.media_path">
    <Mounted name="ScrollExpand" className="scroll-expand-mount" fallback={<Image className="scroll-expand-fallback" src="/images/about-placeholder.svg" alt="Abstract monochrome placeholder artwork" width={1600} height={1000} priority />}>
      {(mod) => {
        const ScrollExpand = mod.default;
        return <ScrollExpand src={media} alt={settings['scroll_expand.alt'] || "Portfolio profile artwork"}
          title={settings['scroll_expand.title'] || "BEHIND THE CODE"} scrollHint={settings['scroll_expand.scroll_hint'] || "Scroll to explore"}
          startWidth={Number(settings['scroll_expand.start_width'] ?? 42)} startHeight={Number(settings['scroll_expand.start_height'] ?? 58)}
          startRadius={Number(settings['scroll_expand.start_radius'] ?? 24)} endRadius={Number(settings['scroll_expand.end_radius'] ?? 0)}
          mediaZoom={Number(settings['scroll_expand.media_zoom'] ?? 1)} scrollDistance={Number(settings['scroll_expand.scroll_distance'] ?? 1.2)}
          holdDistance={Number(settings['scroll_expand.hold_distance'] ?? 0.35)} smoothing={Number(settings['scroll_expand.smoothing'] ?? 0.1)}
          overlayScrim={Number(settings['scroll_expand.overlay_scrim'] ?? 0.45)}
          useWindowScroll={settings['scroll_expand.use_window_scroll'] !== false} enabled
          className="portfolio-scroll-expand">
          <p className="expand-kicker">{settings['scroll_expand.kicker'] || 'PROFILE / 01'}</p>
          <h2>{settings['scroll_expand.name'] || name}</h2>
          <p>{settings['scroll_expand.subtitle'] || title}</p>
          <p className="expand-copy">{settings['scroll_expand.description'] || 'A personal portfolio for selected work, skills, and professional background.'}</p>
        </ScrollExpand>;
      }}
    </Mounted>
  </div>;
}

export function ProfileCardMount({ profile, settings = {} }) {
  const onContactClick = useCallback(() => document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" }), []);
  const name = settings['profile_card.name'] || profile?.full_name || "Ihsan Fawwas Zaidan";
  const title = settings['profile_card.title'] || profile?.professional_title || "Full Stack Web Developer";
  return <Mounted name="ProfileCard" className="profile-card-mount" fallback={<div className="profile-card-fallback"><Image src={profile?.avatar_url || "/images/profile-placeholder.svg"} alt="Profile photograph" width={700} height={900} unoptimized /><strong>{name}</strong><span>{title}</span></div>}>
    {(mod) => {
      const ProfileCard = mod.default;
      return <ProfileCard name={name}
        title={title}
        status={settings['profile_card.status'] || profile?.availability_status || "Online"}
        statusColor={settings['profile_card.status_color'] || settings['appearance.primary_accent'] || "#7FF3FF"}
        contactText={settings['profile_card.contact_text'] ?? "Contact Me"}
        handle={(settings['profile_card.handle'] || profile?.handle || "").replace(/^@/, '')}
        avatarUrl={profile?.avatar_url || "/images/profile-placeholder.svg"}
        miniAvatarUrl={profile?.avatar_url || "/images/profile-placeholder.svg"} iconUrl={profile?.profile_icon_url || settings['profile_card.icon_pattern'] || "/images/profile-pattern.svg"}
        glare={Number(settings['profile_card.glare'] ?? 0.5)} holo={Number(settings['profile_card.holo'] ?? 0.8)}
        tiltStrength={Number(settings['profile_card.tilt_strength'] ?? 12)} parallax={Number(settings['profile_card.parallax'] ?? 8)}
        radius={Number(settings['profile_card.radius'] ?? 16)} enableTilt={settings['profile_card.enable_tilt'] !== false}
        intro={settings['profile_card.intro'] !== false} showUserInfo={settings['profile_card.show_user_info'] !== false}
        enableMobileTilt={settings['profile_card.enable_mobile_tilt'] === true}
        mobileTiltSensitivity={Number(settings['profile_card.mobile_tilt_sensitivity'] ?? 5)}
        theme={settings['profile_card.theme'] || 'dark'} onContactClick={onContactClick} className="portfolio-profile-card" />;
    }}
  </Mounted>;
}

export function LanyardMount({ profile, settings = {} }) {
  const hostRef = useRef(null);
  const [module, setModule] = useState(null);
  const [hasCanvas, setHasCanvas] = useState(false);
  useEffect(() => {
    let alive = true;
    let observer;
    const load = () => import("@/components/react-bits/Lanyard").then((value) => {
      if (alive) setModule(value);
    });
    if (typeof IntersectionObserver === "undefined") load();
    else {
      observer = new IntersectionObserver(([entry]) => {
        if (entry.isIntersecting) { observer.disconnect(); load(); }
      }, { rootMargin: "240px 0px" });
      if (hostRef.current) observer.observe(hostRef.current);
    }
    return () => { alive = false; observer?.disconnect(); };
  }, []);
  useEffect(() => {
    if (!module || !hostRef.current) return undefined;
    const checkCanvas = () => setHasCanvas(Boolean(hostRef.current?.querySelector("canvas.lanyard-canvas")));
    const mutation = new MutationObserver(checkCanvas);
    mutation.observe(hostRef.current, { childList: true, subtree: true });
    checkCanvas();
    const timer = window.setTimeout(checkCanvas, 1800);
    return () => { window.clearTimeout(timer); mutation.disconnect(); };
  }, [module]);

  const Lanyard = module?.default;
  const strapImage = settings['lanyard.strap_image'] || '/images/lanyard-strap.svg';
  const backImage = settings['lanyard.back_image'] || '/images/lanyard-back.svg';
  const frontImage = settings['lanyard.front_image'] || profile?.avatar_url || '/images/lanyard-front.svg';
  const strapColor = settings['lanyard.strap_color'] || '#eab308';
  const cardColor = settings['lanyard.card_color'] || '#ffffff';
  const size = Number(settings['lanyard.size'] ?? 0.72);
  return <div ref={hostRef} className={`lanyard-host${hasCanvas ? " has-webgl" : ""}`}>
    {!hasCanvas && <div className="lanyard-fallback" aria-label="Lanyard preview placeholder">
      <img src={strapImage} alt="" className="lanyard-fallback-strap" />
      <img src={frontImage} alt="Lanyard card preview" className="lanyard-fallback-card" />
      <p>3D preview unavailable</p>
    </div>}
    {Lanyard && <Lanyard frontImage={frontImage} backImage={backImage}
      strapImage={strapImage} imageFit={settings['lanyard.image_fit'] || 'cover'} cardColor={cardColor}
      orientation={settings['lanyard.orientation'] || 'portrait'} finish={settings['lanyard.finish'] || 'glossy'}
      cornerRadius={Number(settings['lanyard.corner_radius'] ?? 0.3)} size={size}
      anchor={settings['lanyard.anchor'] || 'center'} strapLength={Number(settings['lanyard.strap_length'] ?? 0.5)}
      strapColor={strapColor} strapWidth={Number(settings['lanyard.strap_width'] ?? 0.65)} metal={settings['lanyard.metal'] || 'graphite'}
      gravity={Number(settings['lanyard.gravity'] ?? 1)} damping={Number(settings['lanyard.damping'] ?? 0.5)}
      elasticity={Number(settings['lanyard.elasticity'] ?? 0.5)} breeze={Number(settings['lanyard.breeze'] ?? 0.5)}
      interactive={settings['lanyard.interactive'] !== false} intro={settings['lanyard.intro'] !== false} />}
  </div>;
}

function ProjectImageCarousel({ project }) {
  const images = [
    ...(project.cover_url ? [{ url: project.cover_url, label: "Project cover" }] : []),
    ...(project.preview_urls ?? []).map((url, index) => ({ url, label: `Project preview ${index + 1}` })),
  ];
  const [activeIndex, setActiveIndex] = useState(0);
  const total = images.length;
  const wrap = (index) => (index + total) % total;

  if (!total) return <div className="project-image-empty">No project images have been added yet.</div>;

  const carousel = total > 3;
  const thumbnails = carousel
    ? [
        { index: wrap(activeIndex - 1), position: "before" },
        { index: activeIndex, position: "active" },
        { index: wrap(activeIndex + 1), position: "after" },
      ]
    : images.map((_, index) => ({ index, position: index === activeIndex ? "active" : "rest" }));

  return (
    <section className="project-image-carousel" aria-label="Project images">
      <a className="project-image-main" href={images[activeIndex].url} target="_blank" rel="noreferrer"
        aria-label={`Open ${images[activeIndex].label.toLowerCase()} in a new tab`}>
        <img src={images[activeIndex].url} alt={`${project.title} — ${images[activeIndex].label}`} />
      </a>
      {total > 1 && <div className={`project-image-thumbnails${carousel ? " project-image-thumbnails--carousel" : ""}`}>
        {carousel && <button className="project-image-arrow" type="button" aria-label="Previous project image"
          onClick={() => setActiveIndex((index) => wrap(index - 1))}>‹</button>}
        <div className="project-image-thumb-track">
          {thumbnails.map(({ index, position }) => <button className="project-image-thumb" data-position={position}
            type="button" key={`${images[index].url}-${position}`} aria-label={`Show ${images[index].label.toLowerCase()}`}
            aria-pressed={index === activeIndex} onClick={() => setActiveIndex(index)}>
            <img src={images[index].url} alt="" loading="lazy" />
          </button>)}
        </div>
        {carousel && <button className="project-image-arrow" type="button" aria-label="Next project image"
          onClick={() => setActiveIndex((index) => wrap(index + 1))}>›</button>}
      </div>}
      {total > 1 && <p className="project-image-count" aria-live="polite">{activeIndex + 1} / {total}</p>}
      {total === 1 && <p className="project-image-count">Add project screenshots in Admin → Projects → Project preview images.</p>}
    </section>
  );
}

export function ProjectCardSwap({ projects = [] }) {
  const [cardWidth, setCardWidth] = useState(440);
  const [selectedProject, setSelectedProject] = useState(null);
  const detailsDialogRef = useRef(null);

  useEffect(() => {
    const dialog = detailsDialogRef.current;
    if (selectedProject && dialog && !dialog.open) dialog.showModal();
  }, [selectedProject]);

  useEffect(() => {
    const update = () => setCardWidth(window.innerWidth <= 680 ? Math.max(220, Math.min(300, window.innerWidth - 96)) : 440);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const smallScreen = cardWidth < 440;

  const firstProject = projects[0];
  const fallback = firstProject ? (
    <article className="project-card-placeholder">
      <span>PROJECTS / 01</span>
      {firstProject.cover_url && <img src={firstProject.cover_url} alt="" onError={(event) => event.currentTarget.remove()} />}
      <h3>{firstProject.title}</h3>
      <p>{firstProject.summary || firstProject.description || 'Project details will be added soon.'}</p>
    </article>
  ) : (
    <div className="project-card-placeholder"><span>PROJECTS / 01</span><h3>No project details provided yet</h3><p>Published projects will appear here when they are added in admin.</p></div>
  );

  return <>
    <Mounted name="CardSwap" className="project-card-swap-mount" fallback={fallback}>
    {(mod) => {
      const CardSwap = mod.default;
      const Card = mod.Card;
      const visibleProjects = projects;
      const cardHeight = smallScreen ? Math.max(270, Math.round(cardWidth * 0.98)) : 360;
      return <CardSwap delay={4500} cardDistance={smallScreen ? 28 : 52} verticalDistance={smallScreen ? 30 : 52} depth={90} skewAmount={5}
        visibleCards={Math.min(smallScreen ? 3 : 4, Math.max(1, visibleProjects.length))} cardRadius={18} speed={1} bounce={0.35} parallax={0.65} hoverSpread={0.12}
        dim={0.42} autoplay={visibleProjects.length > 1} pauseOnHover draggable theme="light" className="portfolio-card-swap"
        width={cardWidth} height={cardHeight} onCardClick={(index) => setSelectedProject(visibleProjects[index] ?? null)}>
        {visibleProjects.length ? visibleProjects.map((project, index) => (
          <Card key={project.id} customClass="portfolio-project-card" role="group" tabIndex={0}
            aria-label={`${project.title}. Enter or Space to view project details.`}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                setSelectedProject(project);
              }
            }}>
            <span className="project-card-index">PROJECT / {String(index + 1).padStart(2, '0')}</span>
            {project.cover_url ? (
              <div className="project-card-cover" data-missing="false">
                <img src={project.cover_url} alt={`${project.title} project cover`} draggable={false}
                  onError={(event) => { event.currentTarget.remove(); event.currentTarget.parentElement.dataset.missing = 'true'; }} />
                <span aria-hidden="true">Cover image unavailable</span>
              </div>
            ) : (
              <div className="project-card-cover project-card-no-cover"><strong>{project.title.slice(0, 2).toUpperCase()}</strong><span>Cover image pending</span></div>
            )}
            <div className="project-card-copy">
              <h3>{project.title}</h3>
              {(project.summary || project.description) && <p>{project.summary || project.description}</p>}
              {project.technologies.length > 0 && <div className="project-card-tech">{project.technologies.slice(0, 4).map((technology) => <span key={technology}>{technology}</span>)}</div>}
              {(project.demo_url || project.github_url) && <div className="project-card-links">
                {project.demo_url && <a href={project.demo_url} target="_blank" rel="noreferrer">Live project ↗</a>}
                {project.github_url && <a href={project.github_url} target="_blank" rel="noreferrer">Source ↗</a>}
              </div>}
            </div>
          </Card>
        )) : (
          <Card customClass="portfolio-project-card">
            <span className="project-card-index">PROJECTS / 01</span>
            <div className="project-card-empty"><strong>Projects</strong><span>Published projects will appear here.</span></div>
            <p>Add a project from the admin workspace to build this card stack.</p>
          </Card>
        )}
      </CardSwap>;
    }}
    </Mounted>
    <dialog ref={detailsDialogRef} className="project-detail-dialog"
      aria-labelledby="project-detail-title"
      onClose={() => setSelectedProject(null)}
      onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      {selectedProject && <article className="project-detail-content">
        <button className="project-detail-close" type="button" aria-label="Close project details"
          onClick={() => detailsDialogRef.current?.close()}>×</button>
        <p className="project-detail-kicker">PROJECT DETAILS</p>
        <h2 id="project-detail-title">{selectedProject.title}</h2>
        {selectedProject.subtitle && <p className="project-detail-subtitle">{selectedProject.subtitle}</p>}
        <ProjectImageCarousel key={selectedProject.id} project={selectedProject} />
        {selectedProject.summary && <p className="project-detail-summary">{selectedProject.summary}</p>}
        {selectedProject.description && <p className="project-detail-description">{selectedProject.description}</p>}
        {selectedProject.technologies?.length > 0 && <div className="project-detail-tech" aria-label="Technologies used">
          {selectedProject.technologies.map((technology) => <span key={technology}>{technology}</span>)}
        </div>}
        <div className="project-detail-links">
          {selectedProject.demo_url && <a href={selectedProject.demo_url} target="_blank" rel="noreferrer">Open live project ↗</a>}
          {selectedProject.github_url && <a href={selectedProject.github_url} target="_blank" rel="noreferrer">View source code ↗</a>}
        </div>
      </article>}
    </dialog>
  </>;
}

export function ContactGlow({ children, settings = {} }) {
  return <Mounted name="GlowCursor" className="contact-glow-mount" fallback={<div className="contact-glow-fallback">{children}</div>}>
    {(mod) => {
      const GlowCursor = mod.default;
      return <GlowCursor color={settings['glow_cursor.color'] || "#7ff3ff"} intensity={Number(settings['glow_cursor.intensity'] ?? 1.6)} trailWidth={2} linger={1} glow={1.2}
        clickBurst theme="dark" className="portfolio-glow-cursor">{children}</GlowCursor>;
    }}
  </Mounted>;
}
