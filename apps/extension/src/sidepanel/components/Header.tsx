export function Header() {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">Browser extension shell</p>
        <h1>QA Assist</h1>
      </div>
      <span className="status-dot" aria-label="Extension shell ready" />
    </header>
  );
}
