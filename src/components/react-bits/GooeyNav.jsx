'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import './GooeyNav.css';

const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

export default function GooeyNav({
  items = [],
  activeIndex,
  initialActiveIndex = 0,
  theme = 'dark',
  size = 'md',
  frame = true,
  particleCount = 15,
  spread = 56,
  animationTime = 600,
  timeVariance = 300,
  gooeyness = 0.5,
  wobble = 0.5,
  hoverEffect = true,
  onChange,
  className = ''
}) {
  const listRef = useRef(null);
  const itemRefs = useRef([]);
  const [localIndex, setLocalIndex] = useState(initialActiveIndex);
  const [hoverIndex, setHoverIndex] = useState(null);
  const [pill, setPill] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const selectedIndex = Number.isInteger(activeIndex) ? activeIndex : localIndex;
  const visibleIndex = hoverEffect && hoverIndex !== null ? hoverIndex : selectedIndex;
  const safeCount = Math.max(0, Math.min(24, particleCount));
  const particles = useMemo(() => Array.from({ length: safeCount }, (_, index) => {
    const angle = (Math.PI * 2 * index) / Math.max(safeCount, 1);
    const distance = spread * (0.58 + ((index * 37) % 43) / 100);
    return {
      x: Math.cos(angle) * distance,
      y: Math.sin(angle) * distance * (0.55 + ((index * 13) % 30) / 100),
      delay: (index * (timeVariance / Math.max(safeCount, 1))) % Math.max(timeVariance, 1),
      size: 5 + ((index * 7) % 7)
    };
  }), [safeCount, spread, timeVariance]);

  useIsomorphicLayoutEffect(() => {
    const list = listRef.current;
    const item = itemRefs.current[visibleIndex];
    if (!list || !item) return;
    const update = () => setPill({
      x: item.offsetLeft,
      y: item.offsetTop,
      width: item.offsetWidth,
      height: item.offsetHeight
    });
    update();
    const observer = new ResizeObserver(update);
    observer.observe(list);
    itemRefs.current.forEach((node) => node && observer.observe(node));
    return () => observer.disconnect();
  }, [visibleIndex, items.length, size]);

  function selectItem(index, item) {
    if (!Number.isInteger(activeIndex)) setLocalIndex(index);
    onChange?.(index, item);
  }

  return (
    <nav
      className={`gooey-nav gooey-nav--${size} ${frame ? 'gooey-nav--framed' : ''} ${className}`.trim()}
      data-theme={theme === 'light' ? 'light' : 'dark'}
      style={{ '--gn-time': `${Math.max(0, animationTime)}ms`, '--gn-goo': 1 + gooeyness * 2, '--gn-wobble': `${wobble * 5}deg` }}
      aria-label="Portfolio sections"
    >
      <span className="gooey-nav__filter" aria-hidden="true">
        <svg xmlns="http://www.w3.org/2000/svg" version="1.1">
          <defs><filter id="gooey-nav-filter"><feGaussianBlur in="SourceGraphic" stdDeviation="7" result="blur" /><feColorMatrix in="blur" mode="matrix" values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${8 + gooeyness * 18} ${-3 - gooeyness * 6}`} result="goo" /><feBlend in="SourceGraphic" in2="goo" /></filter></defs>
        </svg>
      </span>
      <ul className="gooey-nav__list" ref={listRef}>
        <li className="gooey-nav__blob" aria-hidden="true" style={{ transform: `translate(${pill.x}px, ${pill.y}px)`, width: pill.width, height: pill.height }}>
          <span className="gooey-nav__blob-core" />
          {particles.map((particle, index) => (
            <span
              className="gooey-nav__particle"
              key={`${visibleIndex}-${index}`}
              style={{ '--particle-x': `${particle.x}px`, '--particle-y': `${particle.y}px`, '--particle-delay': `${particle.delay}ms`, '--particle-size': `${particle.size}px` }}
            />
          ))}
        </li>
        {items.map((item, index) => (
          <li className="gooey-nav__item" data-active={index === selectedIndex ? '' : undefined} key={`${item.href}-${item.label}`} ref={(node) => { itemRefs.current[index] = node; }}
            onMouseEnter={() => hoverEffect && setHoverIndex(index)} onMouseLeave={() => hoverEffect && setHoverIndex(null)}>
            <a className="gooey-nav__link" href={item.href} aria-current={index === selectedIndex ? 'location' : undefined}
              onClick={() => selectItem(index, item)} onFocus={() => hoverEffect && setHoverIndex(index)} onBlur={() => hoverEffect && setHoverIndex(null)}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
      <span className="gooey-nav__rim" aria-hidden="true" />
    </nav>
  );
}
