'use client';

import { useEffect, useRef, useState } from 'react';

function RefineFrame({ src, alt, aspectRatio = '4 / 3' }) {
  const [loaded, setLoaded] = useState(false);
  return <div className="certificate-refine-frame" style={{ aspectRatio }} data-loaded={loaded}>
    <img src={src} alt={alt} onLoad={() => setLoaded(true)} onError={() => setLoaded(true)} />
    <span className="certificate-refine-sweep" aria-hidden="true" />
    {!loaded && <span className="certificate-refine-status" role="status">Loading preview…</span>}
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
