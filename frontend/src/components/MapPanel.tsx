export function MapPanel({ label }: { label: string }) {
  return (
    <div className="map-panel" role="img" aria-label={`Map preview for ${label}`}>
      <div className="map-grid" />
      <div className="map-region one" />
      <div className="map-region two" />
      <div className="map-region three" />
      <span>{label}</span>
    </div>
  );
}

