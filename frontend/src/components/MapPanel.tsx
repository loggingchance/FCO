import { stateGeometries } from "../data/stateGeometries";

type Position = number[];

function outerRings(stateCode: string): Position[][] {
  const geometry = stateGeometries[stateCode]?.geometry;
  if (!geometry) return [];

  if (geometry.type === "Polygon") {
    return [(geometry.coordinates as number[][][])[0]];
  }

  return (geometry.coordinates as number[][][][]).map((polygon) => polygon[0]);
}

function statePath(stateCode: string) {
  const rings = outerRings(stateCode);
  const points = rings.flat();
  if (!points.length) return "";

  const longitudes = points.map(([longitude]) => longitude);
  const latitudes = points.map(([, latitude]) => latitude);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const width = Math.max(maxLongitude - minLongitude, 0.1);
  const height = Math.max(maxLatitude - minLatitude, 0.1);
  const scale = Math.min(270 / width, 175 / height);
  const offsetX = (320 - width * scale) / 2;
  const offsetY = (210 - height * scale) / 2;

  return rings.map((ring) => ring.map(([longitude, latitude], index) => {
    const x = offsetX + (longitude - minLongitude) * scale;
    const y = offsetY + (maxLatitude - latitude) * scale;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z").join(" ");
}

export function MapPanel({ stateCode, label }: { stateCode: string; label: string }) {
  const state = stateGeometries[stateCode];
  const path = statePath(stateCode);

  return (
    <figure className="map-panel" role="img" aria-label={`Boundary map of ${label}`}>
      <svg viewBox="0 0 320 210" aria-hidden="true">
        <path className="state-shadow" d={path} transform="translate(3 4)" />
        <path className="state-shape" d={path} />
      </svg>
      <figcaption>
        <strong>{label}</strong>
        <span>{state?.name || stateCode} boundary</span>
      </figcaption>
    </figure>
  );
}
