export default function Loading() {
  return (
    <main className="loading-state" role="status" aria-label="Loading portfolio">
      <span className="loader" aria-hidden="true" />
      <span className="visually-hidden">Loading portfolio…</span>
    </main>
  );
}
