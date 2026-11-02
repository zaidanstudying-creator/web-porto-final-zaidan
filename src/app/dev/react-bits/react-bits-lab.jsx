"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useState } from "react";
import "./react-bits-lab.css";

const PillNav = dynamic(() => import("@/components/react-bits/PillNav"), { ssr: false });
const TechText = dynamic(() => import("@/components/react-bits/TechText"), { ssr: false });
const TextLoop = dynamic(() => import("@/components/react-bits/TextLoop"), { ssr: false });
const ScrollVelocity = dynamic(() => import("@/components/react-bits/ScrollVelocity"), { ssr: false });
const ProfileCard = dynamic(() => import("@/components/react-bits/ProfileCard"), { ssr: false });
const Lanyard = dynamic(() => import("@/components/react-bits/Lanyard"), { ssr: false });
const CardSwapPreview = dynamic(() => import("./card-swap-preview"), { ssr: false });
const ScrollExpand = dynamic(() => import("@/components/react-bits/ScrollExpand"), { ssr: false });
const GlowCursor = dynamic(() => import("@/components/react-bits/GlowCursor"), { ssr: false });

const tests = [
  { id: "pill-nav", label: "Pill Nav", note: "Navigation, focus, and responsive collapse." },
  { id: "tech-text", label: "Tech Text", note: "Canvas text reveal and pointer interaction." },
  { id: "text-loop", label: "Text Loop", note: "SVG path animation and drag behavior." },
  { id: "scroll-velocity", label: "Scroll Velocity", note: "Motion-based scroll velocity treatment." },
  { id: "profile-card", label: "Profile Card", note: "Holographic card with test-only copy; no personal photo." },
  { id: "lanyard", label: "Lanyard", note: "Three.js/WebGL preview using test-only SVG assets." },
  { id: "card-swap", label: "Card Swap", note: "Named Card export and card-stack interaction." },
  { id: "scroll-expand", label: "Scroll Expand", note: "Scroll-driven image transition using a test asset." },
  { id: "glow-cursor", label: "Glow Cursor", note: "WebGL2 fluid cursor; extension support required." },
];

function Preview({ id }) {
  switch (id) {
    case "pill-nav":
      return (
        <div className="lab-nav-preview">
          <PillNav
            ariaLabel="React Bits test navigation"
            items={[
              { label: "One", href: "#test-one" },
              { label: "Two", href: "#test-two" },
              { label: "Three", href: "#test-three" },
            ]}
            theme="dark"
            intro={false}
          />
          <span id="test-one">Test anchor one</span><span id="test-two">Test anchor two</span><span id="test-three">Test anchor three</span>
        </div>
      );
    case "tech-text":
      return <TechText text="REGISTRY TEST" fontSize={88} fontWeight={600} color="#F1F0EB" accentColor="#7FF3FF" />;
    case "text-loop":
      return <TextLoop text="REGISTRY TEST ✦ JS CSS ✦" shape="line" speed={120} ribbonColor="#ff5a36" fontSize={36} />;
    case "scroll-velocity":
      return (
        <ScrollVelocity
          texts={["REGISTRY SMOKE TEST", "MOTION PACKAGE READY"]}
          velocity={50}
          fontSize={32}
          fontWeight={700}
          color="#F1F0EB"
          separator="•"
          numCopies={4}
          pauseOnHover
        />
      );
    case "profile-card":
      return (
        <ProfileCard
          name="Registry Preview"
          title="Test component"
          handle="test-only"
          status="Preview"
          statusColor="#7FF3FF"
          contactText="Test action"
          showUserInfo
          enableTilt
          intro={false}
        />
      );
    case "lanyard":
      return (
        <div className="lab-lanyard">
          <Lanyard
            frontImage="/images/react-bits-test-card-front.svg"
            backImage="/images/react-bits-test-card-back.svg"
            strapImage="/images/react-bits-test-strap.svg"
            strapColor="#eab308"
            cardColor="#ffffff"
            interactive
            intro={false}
          />
        </div>
      );
    case "card-swap":
      return <CardSwapPreview />;
    case "scroll-expand":
      return (
        <div className="lab-scroll-expand">
          <ScrollExpand
            src="/images/react-bits-test-scroll-expand.svg"
            alt="Test-only placeholder image for Scroll Expand component verification"
            title="Registry smoke test"
            scrollHint="Scroll to test the transition"
            useWindowScroll
          />
        </div>
      );
    case "glow-cursor":
      return (
        <GlowCursor color="#7ff3ff" intensity={1.2} trailWidth={2} linger={1} glow={1.2} clickBurst>
          <div className="lab-glow-content">Move the pointer inside this area</div>
        </GlowCursor>
      );
    default:
      return null;
  }
}

export default function ReactBitsLab() {
  const [activeId, setActiveId] = useState(tests[0].id);
  const active = tests.find(test => test.id === activeId);

  return (
    <main className="react-bits-lab page-shell">
      <Link className="lab-back" href="/">← Back to portfolio</Link>
      <header className="lab-header">
        <p className="lab-kicker">Development only / Component verification</p>
        <h1>React Bits smoke test</h1>
        <p>One component is mounted at a time. Test assets are placeholders and contain no portfolio identity or project data.</p>
      </header>
      <nav className="lab-selector" aria-label="Choose a component to test">
        {tests.map((test, index) => (
          <button
            key={test.id}
            type="button"
            aria-pressed={activeId === test.id}
            onClick={() => setActiveId(test.id)}
          >
            <span>{String(index + 1).padStart(2, "0")}</span>{test.label}
          </button>
        ))}
      </nav>
      <section className="lab-test" aria-live="polite">
        <div className="lab-test-heading">
          <div><span className="lab-kicker">Active component</span><h2>{active.label}</h2></div>
          <p>{active.note}</p>
        </div>
        <div className={`lab-stage lab-stage--${activeId}`} key={activeId}>
          <Preview id={activeId} />
        </div>
      </section>
      <p className="lab-footnote">This route returns 404 outside development mode. WebGL previews require browser support and are intentionally never mounted together.</p>
    </main>
  );
}
