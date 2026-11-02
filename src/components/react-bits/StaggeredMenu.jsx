"use client";

import "./StaggeredMenu.css";

export default function StaggeredMenu({ items = [], socialItems = [], accentColor = "#7ff3ff", secondaryColor = "#ff5a36" }) {
  return (
    <div className="staggered-menu-wrapper fixed-wrapper" style={{ "--sm-accent": accentColor, "--sm-secondary": secondaryColor }}>
      <header className="staggered-menu-header">
        <a className="sm-logo" href="#home" aria-label="Ihsan portfolio home"><span className="sm-logo-mark">IZ<span>.</span></span></a>
      </header>
      <details className="sm-menu-details">
        <summary className="sm-toggle" aria-controls="mobile-navigation-panel">
          <span className="sm-toggle-label sm-toggle-label--menu">Menu</span>
          <span className="sm-toggle-label sm-toggle-label--close">Close</span>
          <span className="sm-icon" aria-hidden="true"><i /><i /></span>
        </summary>
        <div className="sm-prelayers" aria-hidden="true">
          <span className="sm-prelayer sm-prelayer--back" />
          <span className="sm-prelayer sm-prelayer--front" />
        </div>
        <nav id="mobile-navigation-panel" className="staggered-menu-panel" aria-label="Main navigation">
          <div className="sm-panel-inner">
            <p className="sm-panel-title">Navigate <span>— 2026</span></p>
            <ul className="sm-panel-list">
              {items.map((item) => <li key={item.link}><a className="sm-panel-item" href={item.link} aria-label={item.ariaLabel} onClick={(event) => event.currentTarget.closest("details")?.removeAttribute("open")}><span className="sm-panel-itemLabel">{item.label}</span></a></li>)}
            </ul>
            {socialItems.length > 0 && <div className="sm-socials"><p className="sm-socials-title">Find me elsewhere</p><ul className="sm-socials-list">{socialItems.map((item) => <li key={`${item.label}-${item.link}`}><a className="sm-socials-link" href={item.link} target="_blank" rel="noreferrer">{item.label}<span aria-hidden="true"> ↗</span></a></li>)}</ul></div>}
          </div>
        </nav>
      </details>
    </div>
  );
}
