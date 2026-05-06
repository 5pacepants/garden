export function DetailPanel() {
  return (
    <aside className="detail-panel" aria-label="Detaljer">
      <span className="eyebrow">Valt objekt</span>
      <h2>Ingen växt vald</h2>
      <p>Välj en växt, rabatt eller zon på kartan för att se och redigera information.</p>
      <div className="detail-section">
        <h3>Kommande innehåll</h3>
        <ul>
          <li>Växtkort</li>
          <li>Skötselschema</li>
          <li>Historik</li>
          <li>Platsmatchning</li>
        </ul>
      </div>
    </aside>
  );
}
