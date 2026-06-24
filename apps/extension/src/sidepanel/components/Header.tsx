type HeaderProps = {
  resolvedTheme: "light" | "dark";
};

export function Header({ resolvedTheme }: HeaderProps) {
  return (
    <header className="header">
      <div>
        <p className="eyebrow">Preview only</p>
        <h1>QA Assist</h1>
        <p className="header-copy">A calm QA assistant inside Azure DevOps.</p>
      </div>
      <span className="status-pill">{resolvedTheme}</span>
    </header>
  );
}
