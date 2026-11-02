"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import "./FoldText.css";

gsap.registerPlugin(ScrollTrigger);

const useIsomorphicLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function FoldText({
  text = "About",
  splitBy = "char",
  hinge = "top",
  duration = 0.65,
  stagger = 0.035,
  foldAngle = 92,
  ease = "power3.out",
  perspective = 700,
  creaseShading = 0.55,
  trigger = "scroll",
  hoverRefold = false,
  refoldRadius = 140,
  refoldAngle = 45,
  color = "currentColor",
  fontWeight = "inherit",
  fontSize = "inherit",
  className = "",
}) {
  const rootRef = useRef(null);
  const pieces = splitBy === "word"
    ? text.split(/(\s+)/).filter(Boolean)
    : Array.from(text);

  useIsomorphicLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return undefined;

    const elements = Array.from(root.querySelectorAll("[data-fold-piece]"));
    if (!elements.length) return undefined;

    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) return undefined;

    const hingeOrigins = {
      top: "50% 0%",
      bottom: "50% 100%",
      left: "0% 50%",
      right: "100% 50%",
    };
    const axis = hinge === "left" || hinge === "right" ? "rotationY" : "rotationX";
    const direction = hinge === "bottom" || hinge === "right" ? 1 : -1;
    const initialRotation = direction * Math.min(180, Math.max(0, foldAngle));
    const origin = hingeOrigins[hinge] || hingeOrigins.top;
    const safeDuration = Math.max(0.15, duration);
    const safeStagger = Math.max(0, stagger);
    const safePerspective = Math.max(120, perspective);
    const shade = Math.min(1, Math.max(0, creaseShading));
    const safeRefoldRadius = Math.max(1, refoldRadius);
    const safeRefoldAngle = Math.min(180, Math.max(0, refoldAngle));
    const refoldShade = (element, amount) => gsap.to(element, {
      [axis]: direction * safeRefoldAngle * amount,
      opacity: 1 - amount * 0.12,
      "--fold-crease": shade * amount,
      duration: 0.18,
      ease: "power2.out",
      overwrite: "auto",
    });
    let unfolded = false;

    gsap.set(elements, {
      [axis]: initialRotation,
      opacity: 0,
      transformOrigin: origin,
      transformPerspective: safePerspective,
      transformStyle: "preserve-3d",
      "--fold-crease": shade,
    });

    const timeline = gsap.timeline({ paused: true, onComplete: () => { unfolded = true; } });
    timeline.to(elements, {
      [axis]: 0,
      opacity: 1,
      "--fold-crease": 0,
      duration: safeDuration,
      ease,
      stagger: safeStagger,
      clearProps: "transformPerspective",
    });

    let scrollTrigger;
    if (trigger === "scroll") {
      scrollTrigger = ScrollTrigger.create({
        trigger: root,
        start: "top 82%",
        once: true,
        onEnter: () => timeline.play(),
      });
    } else {
      timeline.play();
    }

    const handlePointerMove = (event) => {
      if (!hoverRefold || !unfolded) return;
      elements.forEach((element) => {
        const rect = element.getBoundingClientRect();
        const distance = Math.hypot(event.clientX - (rect.left + rect.width / 2), event.clientY - (rect.top + rect.height / 2));
        const proximity = Math.min(1, Math.max(0, 1 - distance / safeRefoldRadius));
        const amount = proximity * proximity * (3 - 2 * proximity);
        refoldShade(element, amount);
      });
    };
    const handlePointerLeave = () => {
      if (!hoverRefold || !unfolded) return;
      elements.forEach((element) => refoldShade(element, 0));
    };

    if (hoverRefold) {
      root.addEventListener("pointermove", handlePointerMove, { passive: true });
      root.addEventListener("pointerleave", handlePointerLeave);
    }

    return () => {
      root.removeEventListener("pointermove", handlePointerMove);
      root.removeEventListener("pointerleave", handlePointerLeave);
      scrollTrigger?.kill();
      timeline.kill();
      gsap.killTweensOf(elements);
    };
  }, [duration, ease, foldAngle, hinge, perspective, creaseShading, stagger, trigger, text, splitBy, hoverRefold, refoldRadius, refoldAngle]);

  return (
    <span
      ref={rootRef}
      className={`fold-text ${className}`.trim()}
      style={{ "--fold-font-size": typeof fontSize === "number" ? `${fontSize}px` : fontSize, "--fold-font-weight": fontWeight, "--fold-color": color }}
    >
      <span className="fold-text-sr-only">{text}</span>
      <span className="fold-text-visual" aria-hidden="true">
        {pieces.map((piece, index) => (
          /^\s+$/.test(piece)
            ? <span className="fold-text-space" key={`space-${index}`}>{piece.replace(/ /g, "\u00a0")}</span>
            : <span className="fold-text-segment" key={`piece-${index}`}><span data-fold-piece>{piece}</span></span>
        ))}
      </span>
    </span>
  );
}
