"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";

export interface MapComplaint {
  _id: string;
  latitude: number;
  longitude: number;
  wasteType: string;
  status: string;
  priority: string;
  description?: string;
  createdAt?: string;
}

const MapContainer = dynamic(
  () => import("react-leaflet").then((m) => m.MapContainer),
  { ssr: false }
);
const TileLayer = dynamic(
  () => import("react-leaflet").then((m) => m.TileLayer),
  { ssr: false }
);
const Marker = dynamic(
  () => import("react-leaflet").then((m) => m.Marker),
  { ssr: false }
);
const Popup = dynamic(
  () => import("react-leaflet").then((m) => m.Popup),
  { ssr: false }
);

function DefaultIcon() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    const L = require("leaflet");
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
      iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
      shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png"
    });
  }, []);
  return null;
}

export default function MapView({
  complaints,
  selected,
  setSelected
}: {
  complaints: MapComplaint[];
  selected: MapComplaint | null;
  setSelected: (c: MapComplaint | null) => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted || typeof window === "undefined") {
    return (
      <div className="map-wrapper bg-slate-200 dark:bg-slate-800 flex items-center justify-center">
        <span className="text-slate-500">Loading map…</span>
      </div>
    );
  }

  const center: [number, number] =
    complaints.length > 0
      ? [complaints[0].latitude, complaints[0].longitude]
      : [20.5937, 78.9629];

  return (
    <div className="map-wrapper">
      <MapContainer
        center={center}
        zoom={complaints.length ? 12 : 4}
        className="leaflet-container"
        style={{ height: "100%", width: "100%" }}
      >
        <DefaultIcon />
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {complaints.map((c) => (
          <Marker
            key={c._id}
            position={[c.latitude, c.longitude]}
            eventHandlers={{ click: () => setSelected(c) }}
          >
            <Popup>
              <div className="p-1 min-w-[180px]">
                <strong>{c.wasteType}</strong>
                <span className={`ml-2 badge badge-priority-${c.priority}`}>{c.priority}</span>
                <span className={`ml-2 badge badge-status-${c.status}`}>
                  {c.status}
                </span>
                {c.description && (
                  <p className="text-xs mt-2 text-slate-600 dark:text-slate-400">
                    {c.description.slice(0, 120)}
                    {c.description.length > 120 ? "…" : ""}
                  </p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
