'use client';

import { useEffect, useRef, useState } from 'react';

function getYear(eventDate) {
  if (!eventDate) return '';
  const year = new Date(`${eventDate}T00:00:00`).getFullYear();
  return Number.isNaN(year) ? '' : year;
}

export default function HistoryCarousel({ items = [] }) {
  const trackRef = useRef(null);
  const slideRefs = useRef([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealedIds, setRevealedIds] = useState(() => new Set());
  const [animatingIds, setAnimatingIds] = useState(() => new Set());
  const [blurReady, setBlurReady] = useState(false);

  useEffect(() => {
    const track = trackRef.current;
    let savedIds = new Set();
    try {
      const stored = JSON.parse(window.localStorage.getItem('portfolio-history-revealed-v1') || '[]');
      if (Array.isArray(stored)) savedIds = new Set(stored.filter((id) => typeof id === 'string'));
    } catch {
      // Continue with a per-page reveal if storage is unavailable.
    }
    setRevealedIds(savedIds);
    setBlurReady(true);
    if (!track || !items.length) return undefined;

    let scrollTimer = 0;
    const updateActiveSlide = () => {
      window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        const center = track.getBoundingClientRect().left + track.clientWidth / 2;
        let closestIndex = 0;
        let closestDistance = Infinity;

        slideRefs.current.forEach((slide, index) => {
          if (!slide) return;
          const rect = slide.getBoundingClientRect();
          const distance = Math.abs(rect.left + rect.width / 2 - center);
          if (distance < closestDistance) {
            closestDistance = distance;
            closestIndex = index;
          }
        });

        setActiveIndex(closestIndex);
      }, 120);
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.68) continue;
        const id = entry.target.dataset.historyId;
        if (!savedIds.has(id)) {
          savedIds.add(id);
          setRevealedIds(new Set(savedIds));
          const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          if (!reducedMotion) setAnimatingIds((current) => new Set(current).add(id));
          try {
            window.localStorage.setItem('portfolio-history-revealed-v1', JSON.stringify([...savedIds]));
          } catch {
            // The slide still stays clear for this page even without storage.
          }
        }
        observer.unobserve(entry.target);
      }
    }, { root: track, threshold: [0, 0.68, 0.9, 1] });

    slideRefs.current.forEach((slide) => {
      if (slide && !savedIds.has(slide.dataset.historyId)) observer.observe(slide);
    });
    track.addEventListener('scroll', updateActiveSlide, { passive: true });

    return () => {
      observer.disconnect();
      track.removeEventListener('scroll', updateActiveSlide);
      window.clearTimeout(scrollTimer);
    };
  }, [items.length]);

  const moveTo = (index) => {
    const boundedIndex = Math.max(0, Math.min(items.length - 1, index));
    const slide = slideRefs.current[boundedIndex];
    const track = trackRef.current;
    if (!slide || !track) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    const trackRect = track.getBoundingClientRect();
    const slideRect = slide.getBoundingClientRect();
    const targetLeft = track.scrollLeft + slideRect.left - trackRect.left - (track.clientWidth - slide.clientWidth) / 2;
    track.scrollTo({ left: targetLeft, behavior });
    setActiveIndex(boundedIndex);
  };

  if (!items.length) return <p>Published milestones will appear here.</p>;

  return (
    <div className="history-carousel" role="group" aria-roledescription="carousel" aria-label="History milestones">
      <div className="history-carousel-track" ref={trackRef}>
        {items.map((item, index) => {
          const id = String(item.id ?? index);
          const isRevealed = revealedIds.has(id);
          const isAnimating = animatingIds.has(id);
          return (
            <article
              className={`history-slide${isRevealed ? ' is-revealed' : ''}${isAnimating ? ' is-animating' : ''}`}
              key={item.id}
              data-index={index}
              data-history-id={id}
              data-blur-ready={blurReady ? 'true' : 'false'}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${items.length}: ${item.title}`}
              aria-current={activeIndex === index ? 'true' : undefined}
              ref={(node) => { slideRefs.current[index] = node; }}
              onAnimationEnd={(event) => {
                if (event.target !== event.currentTarget || !isAnimating) return;
                setAnimatingIds((current) => {
                  const next = new Set(current);
                  next.delete(id);
                  return next;
                });
              }}
            >
              <span className="history-slide-year">{getYear(item.event_date)}</span>
              <div className="history-slide-copy">
                <p className="history-slide-category">{item.category}</p>
                <h3>{item.title}</h3>
                {item.description && <p className="history-slide-description">{item.description}</p>}
                {item.image_url && <img className="history-image" src={item.image_url} alt={item.title} />}
              </div>
            </article>
          );
        })}
      </div>
      <div className="history-carousel-controls">
        <button className="history-carousel-arrow" type="button" aria-label="Previous history item" onClick={() => moveTo(activeIndex - 1)} disabled={activeIndex === 0}>
          <span aria-hidden="true">←</span>
        </button>
        <span className="history-carousel-count" aria-live="polite" aria-atomic="true">{String(activeIndex + 1).padStart(2, '0')} <span>/</span> {String(items.length).padStart(2, '0')}</span>
        <button className="history-carousel-arrow" type="button" aria-label="Next history item" onClick={() => moveTo(activeIndex + 1)} disabled={activeIndex === items.length - 1}>
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
