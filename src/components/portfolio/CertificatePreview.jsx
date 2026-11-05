'use client';

import { useEffect, useRef, useState } from 'react';

function RefineFrame({ src, alt, aspectRatio = '4 / 3' }) {
  const frameRef = useRef(null);
  const imageRef = useRef(null);
  const canvasRef = useRef(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const frame = frameRef.current;
    const image = imageRef.current;
    const canvas = canvasRef.current;
    const context = canvas?.getContext('2d');
    if (!frame || !image || !canvas || !context) return undefined;

    let animationFrame = 0;
    let resizeObserver;
    let startedAt = 0;
    let currentBlock = 48;
    let finished = false;
    const blockSizes = [48, 32, 20, 12, 8, 5, 3, 2, 1];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const draw = (blockSize) => {
      const box = frame.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      const width = Math.max(1, Math.round(box.width * dpr));
      const height = Math.max(1, Math.round(box.height * dpr));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }

      const lowRes = document.createElement('canvas');
      lowRes.width = Math.max(1, Math.ceil(width / blockSize));
      lowRes.height = Math.max(1, Math.ceil(height / blockSize));
      const lowContext = lowRes.getContext('2d');
      if (!lowContext) return;
      lowContext.fillStyle = '#27272a';
      lowContext.fillRect(0, 0, lowRes.width, lowRes.height);
      const fit = Math.min(lowRes.width / image.naturalWidth, lowRes.height / image.naturalHeight);
      const imageWidth = image.naturalWidth * fit;
      const imageHeight = image.naturalHeight * fit;
      lowContext.drawImage(image, (lowRes.width - imageWidth) / 2, (lowRes.height - imageHeight) / 2, imageWidth, imageHeight);

      context.clearRect(0, 0, width, height);
      context.imageSmoothingEnabled = blockSize === 1;
      if (blockSize === 1) context.imageSmoothingQuality = 'high';
      context.drawImage(lowRes, 0, 0, width, height);
    };

    const animate = (now) => {
      if (!startedAt) startedAt = now;
      const elapsed = now - startedAt;
      const step = Math.min(blockSizes.length - 1, Math.floor(elapsed / 105));
      currentBlock = blockSizes[step];
      draw(currentBlock);
      if (step >= blockSizes.length - 1) {
        finished = true;
        setLoaded(true);
        animationFrame = 0;
      } else {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    const begin = () => {
      if (!image.naturalWidth) return;
      cancelAnimationFrame(animationFrame);
      startedAt = 0;
      finished = false;
      setLoaded(false);
      if (reducedMotion) {
        currentBlock = 1;
        draw(1);
        setLoaded(true);
        return;
      }
      draw(blockSizes[0]);
      animationFrame = requestAnimationFrame(animate);
    };

    const resize = () => {
      if (image.naturalWidth) draw(finished ? 1 : currentBlock);
    };

    if (image.complete && image.naturalWidth) begin();
    else image.addEventListener('load', begin, { once: true });
    image.addEventListener('error', () => setLoaded(true), { once: true });
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(resize);
      resizeObserver.observe(frame);
    }
    window.addEventListener('resize', resize, { passive: true });

    return () => {
      cancelAnimationFrame(animationFrame);
      image.removeEventListener('load', begin);
      resizeObserver?.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, [src]);

  return <div ref={frameRef} className="certificate-refine-frame" style={{ aspectRatio }} data-loaded={loaded}>
    <img ref={imageRef} className="certificate-refine-source" src={src} alt={alt} />
    <canvas ref={canvasRef} className="certificate-refine-canvas" aria-hidden="true" />
    <span className="certificate-refine-sweep" aria-hidden="true" />
    {!loaded && <span className="certificate-refine-status" role="status">Refining preview…</span>}
  </div>;
}

export default function CertificatePreview({ items = [] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStart = useRef(null);
  const images = items.flatMap((entry) => [
    ...(entry.image_url ? [{ src: entry.image_url, label: entry.title, entry }] : []),
    ...(entry.preview_urls ?? []).map((src, index) => ({
      src,
      label: `${entry.title} — detail ${index + 1}`,
      entry,
    })),
  ]);
  const displayIndex = images.length ? activeIndex % images.length : 0;

  useEffect(() => {
    if (images.length < 2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined;
    const timer = window.setInterval(() => setActiveIndex((index) => (index + 1) % images.length), 3200);
    return () => window.clearInterval(timer);
  }, [images.length]);

  function move(step) {
    setActiveIndex((index) => (index + step + images.length) % images.length);
  }

  if (!images.length) return <p className="certificate-preview-missing">Tambahkan gambar sertifikat untuk menampilkan preview.</p>;

  return <div className="certificate-showcase" role="region" aria-label="Certificate previews"
    onWheel={(event) => { if (Math.abs(event.deltaY) > 8) move(event.deltaY > 0 ? 1 : -1); }}
    onTouchStart={(event) => { touchStart.current = event.touches[0]?.clientY ?? null; }}
    onTouchEnd={(event) => {
      const end = event.changedTouches[0]?.clientY;
      if (touchStart.current !== null && end !== undefined && Math.abs(end - touchStart.current) > 35) move(end < touchStart.current ? 1 : -1);
      touchStart.current = null;
    }}>
    <p className="certificate-preview-kicker">SERTIFIKAT / {String(displayIndex + 1).padStart(2, '0')}</p>
    <h3 aria-live="polite">{images[displayIndex]?.label}</h3>
    <div className="certificate-vertical-stage">
      {[-1, 0, 1].map((offset) => {
        const index = (displayIndex + offset + images.length) % images.length;
        const image = images[index];
        return <div className={`certificate-vertical-card${offset === 0 ? ' is-active' : ` is-neighbor neighbor-${offset < 0 ? 'top' : 'bottom'}`}`}
          key={offset} aria-hidden={offset !== 0}>
          {offset === 0 ? <RefineFrame key={image.src} src={image.src} alt={`${image.label} certificate`} aspectRatio="16 / 10" />
            : <img src={image.src} alt="" loading="lazy" />}
        </div>;
      })}
    </div>
    <div className="certificate-showcase-meta" aria-live="polite">
      {images[displayIndex]?.entry?.event_date && <span>{images[displayIndex].entry.event_date.slice(0, 4)}</span>}
      {images[displayIndex]?.entry?.description && <p>{images[displayIndex].entry.description}</p>}
    </div>
    {images.length > 1 && <div className="certificate-preview-controls">
      <button type="button" className="certificate-preview-arrow" aria-label="Previous certificate" onClick={() => move(-1)}>↑</button>
      <span>{displayIndex + 1} / {images.length} · scroll atau geser</span>
      <button type="button" className="certificate-preview-arrow" aria-label="Next certificate" onClick={() => move(1)}>↓</button>
    </div>}
  </div>;
}
