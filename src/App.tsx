import { AppShell } from "./components/AppShell";
import "./styles/app.css";

function App() {
  return (
    <AppShell>
      <section className="map-placeholder" aria-label="Trädgårdskarta">
        <div className="map-grid">
          <div className="zone zone-sun">Solzon</div>
          <div className="bed-shape">Framsida rabatt</div>
          <button className="plant-node existing" type="button" aria-label="Exempelväxt: Röd solhatt" />
          <button className="plant-node planned" type="button" aria-label="Planerad växt" />
        </div>
        <div className="map-caption">
          <span className="eyebrow">Karta</span>
          <h2>Din trädgård ovanifrån</h2>
          <p>Här kommer bakgrundsbild, rabatter, zoner och växtnoder att redigeras.</p>
        </div>
      </section>
    </AppShell>
  );
}

export default App;
