import Link from "next/link";

export default function NotFound() {
  return (
    <main className="page-shell not-found">
      <p className="eyebrow">404 / Page not found</p>
      <h1 className="section-title">This page doesn’t exist.</h1>
      <p className="muted">The page may have moved or the link may be incorrect.</p>
      <Link className="button button-primary" href="/">Return home <span aria-hidden="true">↗</span></Link>
    </main>
  );
}
