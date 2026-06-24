export type PanelKey = "setup" | "story" | "analysis" | "settings";

const navItems: Array<{ key: PanelKey; label: string }> = [
  { key: "setup", label: "Setup" },
  { key: "story", label: "Story" },
  { key: "analysis", label: "Analysis" },
  { key: "settings", label: "Settings" }
];

type NavigationProps = {
  activePanel: PanelKey;
  onChange: (panel: PanelKey) => void;
};

export function Navigation({ activePanel, onChange }: NavigationProps) {
  return (
    <nav className="navigation" aria-label="QA Assist sections">
      {navItems.map((item) => (
        <button
          key={item.key}
          className={item.key === activePanel ? "nav-button active" : "nav-button"}
          type="button"
          onClick={() => onChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </nav>
  );
}
