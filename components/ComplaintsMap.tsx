"use client";

import { useEffect, useRef, useState } from "react";
import { ComplaintDto } from "@/lib/api";

interface ComplaintsMapProps {
  complaints: ComplaintDto[];
  height?: string;
}

export default function ComplaintsMap({ complaints, height = "400px" }: ComplaintsMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!containerRef.current || complaints.length === 0) {
      setReady(true);
      return;
    }
    let L: typeof import("leaflet") | null = null;
    let map: import("leaflet").Map | null = null;

    async function init() {
      L = (await import("leaflet")).default;
      if (!containerRef.current || !L) return;

      // Fix default marker icon in Next/SSR
      delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const first = complaints[0];
      const center: [number, number] = [first.latitude, first.longitude];
      map = L.map(containerRef.current).setView(center, 13);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
      }).addTo(map);

      const group = L.layerGroup();
      complaints.forEach((c) => {
        const marker = L!.marker([c.latitude, c.longitude]);
        marker.bindTooltip(`${c.wasteType}: ${c.description.slice(0, 40)}...`, {
          permanent: false,
        });
        group.addLayer(marker);
      });
      group.addTo(map);

      if (complaints.length > 1) {
        const bounds = L!.latLngBounds(
          complaints.map((c) => [c.latitude, c.longitude] as [number, number])
        );
        map!.fitBounds(bounds, { padding: [30, 30] });
      }
      setReady(true);
    }
    init();
    return () => {
      map?.remove();
      map = null;
    };
  }, [complaints]);

  if (complaints.length === 0) {
    return (
      <div
        className="map-wrapper flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50"
        style={{ height }}
      >
        <p className="text-slate-500">No complaints to show on map</p>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="map-wrapper rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800"
      style={{ height }}
    />
  );
}
