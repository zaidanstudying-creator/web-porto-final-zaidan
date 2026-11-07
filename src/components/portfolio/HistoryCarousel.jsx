'use client';

import { useEffect, useRef, useState } from 'react';

const REVEALED_STORAGE_KEY = 'portfolio-history-revealed-v1';

function getYear(eventDate) {
  if (!eventDate) return '';
  const year = new Date(`${eventDate}T00:00:00`).getFullYear();
  return Number.isNaN(year) ? '' : year;
}

export default function HistoryCarousel({ items = [] }) {
  const dialogRef = useRef(null);
  const revealedIdsRef = useRef(new Set());
  const [activeIndex, setActiveIndex] = useState(0);
  const [revealedIds, setRevealedIds] = useState(() => new Set());
  const [animatingId, setAnimatingId] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(REVEALED_STORAGE_KEY) || '[]');
      if (Array.isArray(saved)) {
        revealedIdsRef.current = new Set(saved.filter((id) => typeof id === 'string'));
      }
    } catch {
      // Keep the one-time reveal limited to this page when storage is unavailable.
    }
    setRevealedIds(new Set(revealedIdsRef.current));
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready || !items.length) return;
    const item = items[activeIndex];
    if (!item) return;

    const id = String(item.id ?? activeIndex);
    if (revealedIdsRef.current.has(id)) {
      setAnimatingId(null);
      return;
    }

    const next = new Set(revealedIdsRef.current);
    next.add(id);
    revealedIdsRef.current = next;
    setRevealedIds(next);

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    setAnimatingId(reducedMotion ? null : id);
    try {
      window.localStorage.setItem(REVEALED_STORAGE_KEY, JSON.stringify([...next]));
    } catch {
      // The card still stays sharp for the rest of this page session.
    }
  }, [activeIndex, items.length, ready]);

  const changeSlide = (direction) => {
    setActiveIndex((current) => Math.max(0, Math.min(items.length - 1, current + direction)));
  };

  const openDetails = (item) => {
    setSelectedItem(item);
    if (dialogRef.current && !dialogRef.current.open) dialogRef.current.showModal();
  };

  const dismissBackdrop = (event) => {
    const dialog = event.currentTarget;
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    const inside = event.clientX >= rect.left && event.clientX <= rect.right
      && event.clientY >= rect.top && event.clientY <= rect.bottom;
    if (!inside) dialog.close();
  };

  if (!items.length) return <p>Published milestones will appear here.</p>;

  const item = items[activeIndex];
  const itemId = String(item?.id ?? activeIndex);
  const isRevealed = revealedIds.has(itemId);

  return (
    <div className="history-carousel" role="group" aria-roledescription="carousel" aria-label="History milestones">
      <div className="history-carousel-stage" aria-live="polite" aria-atomic="true">
        {item && (
          <article
            className={`history-slide${isRevealed ? ' is-revealed' : ''}${animatingId === itemId ? ' is-animating' : ''}`}
            key={itemId}
            data-blur-ready={ready ? 'true' : 'false'}
            data-cms-section="history_entries"
            data-cms-record={item.id}
            role="group"
            aria-roledescription="slide"
            aria-label={`${activeIndex + 1} of ${items.length}: ${item.title}`}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget && animatingId === itemId) setAnimatingId(null);
            }}
          >
            <button className="history-slide-open" type="button" aria-haspopup="dialog" onClick={() => openDetails(item)}>
              <span className="history-slide-year">{getYear(item.event_date)}</span>
              <span className="history-slide-copy">
                <span className="history-slide-category">{item.category}</span>
                <span className="history-slide-title" data-cms-field="title">{item.title}</span>
                {item.description && <span className="history-slide-description" data-cms-field="description">{item.description}</span>}
                {item.image_url && <img className="history-image" src={item.image_url} alt="" data-cms-field="image_path" />}
                <span className="history-slide-more">Lihat detail <span aria-hidden="true">↗</span></span>
              </span>
            </button>
          </article>
        )}
      </div>
      <div className="history-carousel-controls">
        <button className="history-carousel-arrow" type="button" aria-label="Previous history item" onClick={() => changeSlide(-1)} disabled={activeIndex === 0}>
          <span aria-hidden="true">←</span>
        </button>
        <span className="history-carousel-count">{String(activeIndex + 1).padStart(2, '0')} <span>/</span> {String(items.length).padStart(2, '0')}</span>
        <button className="history-carousel-arrow" type="button" aria-label="Next history item" onClick={() => changeSlide(1)} disabled={activeIndex === items.length - 1}>
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <dialog
        className="history-detail-dialog"
        ref={dialogRef}
        aria-labelledby="history-detail-title"
        onClose={() => setSelectedItem(null)}
        onClick={dismissBackdrop}
      >
        {selectedItem && (
          <div className="history-detail-content">
            <div className="history-detail-header">
              <p className="history-slide-category">{selectedItem.category} · {getYear(selectedItem.event_date)}</p>
              <form method="dialog"><button className="history-detail-close" type="submit" aria-label="Close details">×</button></form>
            </div>
            <h3 id="history-detail-title">{selectedItem.title}</h3>
            {selectedItem.image_url && <img className="history-detail-image" src={selectedItem.image_url} alt={selectedItem.title} />}
            {selectedItem.description && <p className="history-detail-description">{selectedItem.description}</p>}
          </div>
        )}
      </dialog>
    </div>
  );
}
