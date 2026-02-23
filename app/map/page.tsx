"use client";

import { useEffect, useState } from "react";
import useSWR from "swr";
import MapView, { MapComplaint } from "@/components/MapView";

const fetcher = (url: string) => fetch(url, { credentials: "include" }).then((r) => r.json());

export default function MapPage() {
  const { data, error, mutate } = useSWR<{ complaints: MapComplaint[] }>("/api/complaints/map", fetcher, {
    revalidateOnFocus: false
  });
  const [selected, setSelected] = useState<MapComplaint | null>(null);

  useEffect(() => {
    mutate();
  }, [mutate]);

  const complaints = data?.complaints ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-xl font-semibold">Reports on map</h1>
        <p className="text-sm text-slate-500">{complaints.length} report(s)</p>
      </div>
      <MapView complaints={complaints} selected={selected} setSelected={setSelected} />
      {selected && (
        <div className="card p-4">
          <h3 className="font-medium">{selected.wasteType}</h3>
          <p className="text-sm text-slate-500">
            {selected.status} · {selected.priority} priority
          </p>
          {selected.description && (
            <p className="text-sm mt-2 text-slate-600 dark:text-slate-400">{selected.description}</p>
          )}
        </div>
      )}
      {error && (
        <div className="card p-4 text-amber-700 dark:text-amber-300">
          Failed to load map data. Please try again.
        </div>
      )}
    </div>
  );
}
