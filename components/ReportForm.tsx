"use client";

import { useState, useRef } from "react";
import { FiMapPin, FiCamera, FiSend } from "react-icons/fi";
import { complaintCreate, ComplaintDto } from "@/lib/api";
import toast from "react-hot-toast";

const WASTE_TYPES = ["Organic", "Plastic", "Metal", "Glass", "E-waste", "Mixed", "Other"];

interface ReportFormProps {
  onSuccess: (complaint: ComplaintDto) => void;
}

export default function ReportForm({ onSuccess }: ReportFormProps) {
  const [description, setDescription] = useState("");
  const [wasteType, setWasteType] = useState("Mixed");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function getLocation() {
    setGettingLocation(true);
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });
      setLat(pos.coords.latitude);
      setLng(pos.coords.longitude);
      toast.success("Location captured");
    } catch {
      toast.error("Could not get location. Please enable location access or enter manually.");
    } finally {
      setGettingLocation(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) {
      toast.error("Please enter a description");
      return;
    }
    if (lat === null || lng === null) {
      toast.error("Please capture your location first");
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.set("description", description.trim());
      form.set("wasteType", wasteType);
      form.set("latitude", String(lat));
      form.set("longitude", String(lng));
      const file = fileRef.current?.files?.[0];
      if (file) form.set("image", file);
      const { complaint } = await complaintCreate(form);
      toast.success("Complaint submitted! You may earn points when it is resolved.");
      setDescription("");
      setWasteType("Mixed");
      setLat(null);
      setLng(null);
      if (fileRef.current) fileRef.current.value = "";
      onSuccess(complaint);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to submit");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card space-y-4 p-6">
      <h2 className="text-lg font-semibold">Report garbage</h2>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Description *
        </label>
        <textarea
          className="input min-h-[80px] resize-y"
          placeholder="e.g. Overflowing bin near the park entrance"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Waste type
        </label>
        <select
          className="input"
          value={wasteType}
          onChange={(e) => setWasteType(e.target.value)}
        >
          {WASTE_TYPES.map((t) => (
            <option key={t} value={t}>{t}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Your location *
        </label>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={getLocation}
            disabled={gettingLocation}
            className="btn-outline inline-flex items-center gap-2"
          >
            <FiMapPin className="h-4 w-4" />
            {gettingLocation ? "Getting location…" : "Use my location"}
          </button>
          {(lat != null && lng != null) && (
            <span className="rounded-lg bg-slate-100 px-3 py-2 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </span>
          )}
        </div>
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
          Photo (optional)
        </label>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="input py-1.5 file:mr-2 file:rounded-lg file:border-0 file:bg-primary file:px-3 file:py-1 file:text-primary-foreground file:text-sm"
        />
      </div>
      <button type="submit" className="btn-primary inline-flex items-center gap-2" disabled={loading}>
        <FiSend className="h-4 w-4" />
        {loading ? "Submitting…" : "Submit report"}
      </button>
    </form>
  );
}
