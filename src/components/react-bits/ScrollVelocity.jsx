'use client';

import { useRef } from 'react';
import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  useVelocity
} from 'motion/react';
import './ScrollVelocity.css';

const smootherstep = t => t * t * t * (t * (t * 6 - 15) + 10);

const FADE_STEPS = Array.from({ length: 9 }, (_, i) => i / 8);

const FADE_MASK = `linear-gradient(to right, ${[
  ...FADE_STEPS.map(t => `rgba(0, 0, 0, ${smootherstep(t).toFixed(3)}) ${(t * 12).toFixed(1)}%`),
  ...FADE_STEPS.map(t => `rgba(0, 0, 0, ${smootherstep(1 - t).toFixed(3)}) ${(88 + t * 12).toFixed(1)}%`)
].join(', ')})`;

const OUTLINE_STYLE = {
  WebkitTextFillColor: 'transparent',
  WebkitTextStroke: 'max(1px, 0.028em) currentColor'
};

function VelocityText({
  children,
  baseVelocity,
  scrollContainerRef,
  className = '',
  damping,
  stiffness,
  numCopies,
  velocityMapping,
  parallaxClassName,
  scrollerClassName,
  parallaxStyle,
  scrollerStyle,
  separator,
  pauseOnHover,
  hoveredRef,
  skewWithVelocity,
  scaleWithVelocity,
  outline,
  gap,
  fontSize,
  fontWeight,
  color,
  draggable
}) {
  const skewX = useMotionValue(0);
  const scaleY = useMotionValue(1);
  const scrollOptions = scrollContainerRef ? { container: scrollContainerRef } : {};
  const { scrollY } = useScroll(scrollOptions);
  const scrollVelocity = useVelocity(scrollY);
  const smoothVelocity = useSpring(scrollVelocity, { damping, stiffness });
  const velocityFactor = useTransform(
    smoothVelocity,
    velocityMapping?.input || [0, 1000],
    velocityMapping?.output || [0, 5],
    { clamp: false }
  );
  const reduceMotion = useReducedMotion();

  const scrollerRef = useRef(null);
  const drag = useRef({ active: false, pointerId: -1, lastX: 0, travel: 0 });

  useAnimationFrame((t, delta) => {
    const animation = scrollerRef.current?.getAnimations?.()[0];
    if (animation) {
      animation.playbackRate = reduceMotion ? 0.35 : 1 + Math.min(5, Math.abs(velocityFactor.get()));
      if (drag.current.active || (pauseOnHover && hoveredRef.current)) animation.pause();
      else animation.play();
    }

    if (reduceMotion || (!skewWithVelocity && !scaleWithVelocity)) return;
    const surge = Math.tanh(Math.abs(smoothVelocity.get()) / 1600);
    const heading = Math.sign(baseVelocity);
    const ease = 1 - Math.exp(-delta / 110);
    const nextSkew = skewX.get() + (-heading * skewWithVelocity * surge - skewX.get()) * ease;
    const nextScale = scaleY.get() + (1 + scaleWithVelocity * surge - scaleY.get()) * ease;
    skewX.set(nextSkew);
    scaleY.set(nextScale);
  });

  const handlePointerDown = event => {
    if (!draggable || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const grab = drag.current;
    grab.active = true;
    grab.pointerId = event.pointerId;
    grab.lastX = event.clientX;
    grab.travel = 0;
    scrollerRef.current?.getAnimations?.()[0]?.pause();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    event.currentTarget.style.cursor = 'grabbing';
  };

  const handlePointerMove = event => {
    const grab = drag.current;
    if (!grab.active || event.pointerId !== grab.pointerId) return;
    const dx = event.clientX - grab.lastX;
    grab.lastX = event.clientX;
    grab.travel += Math.abs(dx);
    const animation = scrollerRef.current?.getAnimations?.()[0];
    if (animation) {
      const direction = Math.sign(baseVelocity) || 1;
      animation.currentTime = Number(animation.currentTime || 0) + (dx / (direction * Math.abs(baseVelocity))) * 1000;
    }
  };

  const handlePointerUp = event => {
    const grab = drag.current;
    if (!grab.active || event.pointerId !== grab.pointerId) return;
    grab.active = false;
    scrollerRef.current?.getAnimations?.()[0]?.play();
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    event.currentTarget.style.cursor = 'grab';
  };

  const handleClickCapture = event => {
    if (drag.current.travel > 6) {
      event.preventDefault();
      event.stopPropagation();
    }
  };

  const spans = [];
  for (let i = 0; i < numCopies; i++) {
    spans.push(
      <motion.span
        className={className}
        key={i}
        aria-hidden={i > 0 ? true : undefined}
        style={{
          ...(!separator && gap > 0 ? { paddingRight: gap } : {}),
          skewX,
          scaleY,
          transformOrigin: 'center'
        }}
      >
        {children}
        {separator ? (
          <span style={gap > 0 ? { margin: `0 ${gap / 2}px` } : undefined}>{separator}</span>
        ) : null}
      </motion.span>
    );
  }

  const typeStyle = {
    ...(fontSize !== undefined
      ? { fontSize: typeof fontSize === 'number' ? `${fontSize}px` : fontSize, lineHeight: 1 }
      : {}),
    ...(fontWeight !== undefined ? { fontWeight } : {}),
    ...(color ? { color } : {}),
    ...(outline ? OUTLINE_STYLE : {})
  };
  const animationDuration = Math.max(4, 6 * (250 / Math.max(Math.abs(baseVelocity), 1)));

  return (
    <div
      className={parallaxClassName}
      style={{
        ...(draggable ? { cursor: 'grab', userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'pan-y' } : {}),
        ...parallaxStyle
      }}
      onPointerDown={draggable ? handlePointerDown : undefined}
      onPointerMove={draggable ? handlePointerMove : undefined}
      onPointerUp={draggable ? handlePointerUp : undefined}
      onPointerCancel={draggable ? handlePointerUp : undefined}
      onClickCapture={draggable ? handleClickCapture : undefined}
    >
      <motion.div
        ref={scrollerRef}
        className={scrollerClassName}
        style={{
          ...typeStyle,
          ...scrollerStyle,
          '--copy-step': `${-(100 / Math.max(numCopies, 1))}%`,
          animationName: baseVelocity > 0 ? 'scroll-velocity-right' : 'scroll-velocity-left',
          animationDuration: `${animationDuration}s`,
          animationTimingFunction: 'linear',
          animationIterationCount: 'infinite',
          animationFillMode: 'both',
          animationDelay: baseVelocity > 0 ? `-${animationDuration}s` : '0s'
        }}
      >
        {spans}
      </motion.div>
    </div>
  );
}

export const ScrollVelocity = ({
  scrollContainerRef,
  texts = [],
  velocity = 100,
  className = '',
  damping = 50,
  stiffness = 400,
  numCopies = 6,
  velocityMapping = { input: [0, 1000], output: [0, 5] },
  parallaxClassName = 'parallax',
  scrollerClassName = 'scroller',
  parallaxStyle,
  scrollerStyle,
  separator = '',
  pauseOnHover = false,
  fadeEdges = false,
  skewWithVelocity = 0,
  scaleWithVelocity = 0,
  outlineAlternate = false,
  gap = 0,
  fontSize,
  fontWeight,
  color,
  draggable = false
}) => {
  const hoveredRef = useRef(false);

  return (
    <section
      style={{ width: '100%', ...(fadeEdges ? { WebkitMaskImage: FADE_MASK, maskImage: FADE_MASK } : {}) }}
      onPointerEnter={() => {
        hoveredRef.current = true;
      }}
      onPointerLeave={() => {
        hoveredRef.current = false;
      }}
    >
      {texts.map((text, index) => (
        <VelocityText
          key={index}
          className={className}
          baseVelocity={index % 2 === 0 ? velocity : -velocity}
          scrollContainerRef={scrollContainerRef}
          damping={damping}
          stiffness={stiffness}
          numCopies={numCopies}
          velocityMapping={velocityMapping}
          parallaxClassName={parallaxClassName}
          scrollerClassName={scrollerClassName}
          parallaxStyle={parallaxStyle}
          scrollerStyle={scrollerStyle}
          separator={separator}
          pauseOnHover={pauseOnHover}
          hoveredRef={hoveredRef}
          skewWithVelocity={skewWithVelocity}
          scaleWithVelocity={scaleWithVelocity}
          outline={outlineAlternate && index % 2 !== 0}
          gap={gap}
          fontSize={fontSize}
          fontWeight={fontWeight}
          color={color}
          draggable={draggable}
        >
          {text}
        </VelocityText>
      ))}
    </section>
  );
};

export default ScrollVelocity;
