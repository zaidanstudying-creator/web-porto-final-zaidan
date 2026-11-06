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
  const [revealedIndexes, setRevealedIndexes] = useState(() => new Set());
  const [blurReady, setBlurReady] = useState(false);

  useEffect(() => {
    setBlurReady(true);
    const track = trackRef.current;
    if (!track || !items.length) return undefined;

    let frame = 0;
    const updateActiveSlide = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(() => {
        frame = 0;
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
      });
    };

    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting || entry.intersectionRatio < 0.68) continue;
        const index = Number(entry.target.dataset.index);
        setRevealedIndexes((current) => {
          if (current.has(index)) return current;
          const next = new Set(current);
          next.add(index);
          return next;
        });
        observer.unobserve(entry.target);
      }
      updateActiveSlide();
    }, { root: track, threshold: [0, 0.68, 0.9, 1] });

    slideRefs.current.forEach((slide) => {
      if (slide) observer.observe(slide);
    });
    track.addEventListener('scroll', updateActiveSlide, { passive: true });
    updateActiveSlide();

    return () => {
      observer.disconnect();
      track.removeEventListener('scroll', updateActiveSlide);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [items.length]);

  const moveTo = (index) => {
    const boundedIndex = Math.max(0, Math.min(items.length - 1, index));
    const slide = slideRefs.current[boundedIndex];
    if (!slide) return;
    const behavior = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
    slide.scrollIntoView({ behavior, block: 'nearest', inline: 'center' });
    setActiveIndex(boundedIndex);
  };

  if (!items.length) return <p>Published milestones will appear here.</p>;

  return (
    <div className="history-carousel" role="group" aria-roledescription="carousel" aria-label="History milestones">
      <div className="history-carousel-track" ref={trackRef}>
        {items.map((item, index) => {
          const isRevealed = revealedIndexes.has(index);
          return (
            <article
              className={`history-slide${isRevealed ? ' is-revealed' : ''}`}
              key={item.id}
              data-index={index}
              data-blur-ready={blurReady ? 'true' : 'false'}
              aria-roledescription="slide"
              aria-label={`${index + 1} of ${items.length}: ${item.title}`}
              aria-current={activeIndex === index ? 'true' : undefined}
              ref={(node) => { slideRefs.current[index] = node; }}
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
