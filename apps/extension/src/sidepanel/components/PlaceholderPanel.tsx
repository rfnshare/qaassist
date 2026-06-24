type PlaceholderPanelProps = {
  title: string;
  description: string;
  items: string[];
};

export function PlaceholderPanel({ title, description, items }: PlaceholderPanelProps) {
  return (
    <section className="panel" aria-labelledby="panel-title">
      <p className="section-label">Placeholder</p>
      <h2 id="panel-title">{title}</h2>
      <p className="description">{description}</p>
      <ul className="placeholder-list">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </section>
  );
}
