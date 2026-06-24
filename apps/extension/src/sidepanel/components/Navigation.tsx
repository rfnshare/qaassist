export type PanelKey =
  | "today"
  | "story"
  | "run"
  | "settings";

const navItems: Array<{ key: PanelKey; label: string }> = [
  { key: "today", label: "Today" },
  { key: "story", label: "Story" },
  { key: "run", label: "Run" },
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
