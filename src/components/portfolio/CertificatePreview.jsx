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

export default function CertificatePreview({ item }) {
  const dialogRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const images = [
    ...(item.image_url ? [{ src: item.image_url, label: 'Certificate' }] : []),
    ...(item.preview_urls ?? []).map((src, index) => ({ src, label: `Certificate detail ${index + 1}` })),
  ];

  useEffect(() => {
    if (images.length && activeIndex >= images.length) setActiveIndex(0);
  }, [activeIndex, images.length]);

  function openPreview() {
    setActiveIndex(0);
    dialogRef.current?.showModal();
  }

  function move(step) {
    setActiveIndex((index) => (index + step + images.length) % images.length);
  }

  return <>
    {item.image_url ? <button className="certificate-preview-trigger" type="button" onClick={openPreview}
      aria-label={`Preview certificate: ${item.title}`}>
      <img className="history-image" src={item.image_url} alt={`${item.title} certificate`} loading="lazy" />
      <span>View certificate preview ↗</span>
    </button> : <span className="certificate-preview-missing">Certificate preview has not been added yet.</span>}
    {images.length > 0 && <dialog ref={dialogRef} className="certificate-preview-dialog"
      aria-label={`${item.title} certificate preview`}
      onClick={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }}>
      <div className="certificate-preview-content">
        <button className="certificate-preview-close" type="button" aria-label="Close certificate preview"
          onClick={() => dialogRef.current?.close()}>×</button>
        <p className="certificate-preview-kicker">CERTIFICATE PREVIEW</p>
        <h3>{item.title}</h3>
        <RefineFrame key={images[activeIndex].src} src={images[activeIndex].src}
          alt={`${item.title} — ${images[activeIndex].label}`} />
        {images.length > 1 && <>
          <div className="certificate-preview-controls">
            <button type="button" className="certificate-preview-arrow" aria-label="Previous certificate image" onClick={() => move(-1)}>←</button>
            <span aria-live="polite">{activeIndex + 1} / {images.length}</span>
            <button type="button" className="certificate-preview-arrow" aria-label="Next certificate image" onClick={() => move(1)}>→</button>
          </div>
          <div className="certificate-preview-dots" role="group" aria-label="Choose certificate image">
            {images.map((image, index) => <button type="button" key={`${image.src}-${index}`}
              className="certificate-preview-dot" data-active={index === activeIndex}
              aria-label={`Show ${image.label.toLowerCase()}`} aria-pressed={index === activeIndex}
              onClick={() => setActiveIndex(index)} />)}
          </div>
        </>}
      </div>
    </dialog>}
  </>;
}
