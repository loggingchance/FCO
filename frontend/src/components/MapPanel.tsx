import { useEffect, useMemo, useState } from "react";
import { stateGeometries } from "../data/stateGeometries";
import { api } from "../services/api";

type Position = number[];
type BoundaryGeometry = { type: "Polygon" | "MultiPolygon"; coordinates: unknown };

function outerRings(geometry?: BoundaryGeometry): Position[][] {
  if (!geometry) return [];
  if (geometry.type === "Polygon") return [(geometry.coordinates as number[][][])[0]];
  return (geometry.coordinates as number[][][][]).map((polygon) => polygon[0]);
}

function boundaryPath(geometry?: BoundaryGeometry) {
  const rings = outerRings(geometry);
  const points = rings.flat();
  if (!points.length) return "";

  const latitudes = points.map(([, latitude]) => latitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const centerLatitude = (minLatitude + maxLatitude) / 2;
  const longitudeScale = Math.cos(centerLatitude * Math.PI / 180);
  const projectedLongitudes = points.map(([longitude]) => longitude * longitudeScale);
  const minLongitude = Math.min(...projectedLongitudes);
  const maxLongitude = Math.max(...projectedLongitudes);
  const width = Math.max(maxLongitude - minLongitude, 0.1);
  const height = Math.max(maxLatitude - minLatitude, 0.1);
  const scale = Math.min(270 / width, 175 / height);
  const offsetX = (320 - width * scale) / 2;
  const offsetY = (210 - height * scale) / 2;

  return rings.map((ring) => ring.map(([longitude, latitude], index) => {
    const x = offsetX + (longitude * longitudeScale - minLongitude) * scale;
    const y = offsetY + (maxLatitude - latitude) * scale;
    return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(" ") + " Z").join(" ");
}

export function MapPanel({ stateCode, label, countyFips }: { stateCode: string; label: string; countyFips?: string }) {
  const state = stateGeometries[stateCode];
  const [countyGeometry, setCountyGeometry] = useState<BoundaryGeometry>();
  const [countyStatus, setCountyStatus] = useState<"loading" | "ready" | "unavailable">(countyFips ? "loading" : "ready");

  useEffect(() => {
    if (!countyFips) {
      setCountyGeometry(undefined);
      setCountyStatus("ready");
      return;
    }
    let active = true;
    setCountyGeometry(undefined);
    setCountyStatus("loading");
    api.countyBoundary(countyFips).then((result) => {
      if (!active) return;
      setCountyGeometry(result.geometry);
      setCountyStatus("ready");
    }).catch(() => {
      if (active) setCountyStatus("unavailable");
    });
    return () => { active = false; };
  }, [countyFips]);

  const geometry = countyFips ? countyGeometry : state?.geometry as BoundaryGeometry | undefined;
  const path = useMemo(() => boundaryPath(geometry), [geometry]);
  const boundaryLabel = countyFips ? `${label} boundary` : `${state?.name || stateCode} boundary`;

  return (
    <figure className="map-panel" role="img" aria-label={countyStatus === "ready" ? `Boundary map of ${label}` : `Boundary map unavailable for ${label}`}>
      {countyStatus === "ready" && path ? (
        <svg viewBox="0 0 320 210" aria-hidden="true">
          <path className="state-shadow" d={path} transform="translate(3 4)" />
          <path className="state-shape" d={path} />
        </svg>
      ) : <div className="map-status">{countyStatus === "loading" ? "Loading official county boundary..." : "Official county boundary unavailable"}</div>}
      <figcaption><strong>{label}</strong><span>{boundaryLabel}</span></figcaption>
    </figure>
  );
}
