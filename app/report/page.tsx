"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import imageCompression from "browser-image-compression";
import { useAuth } from "@/components/AuthContext";

const WASTE_TYPES = ["Organic", "Plastic", "Metal", "Glass", "E-waste", "Mixed", "Other"];

export default function ReportPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [description, setDescription] = useState("");
  const [wasteType, setWasteType] = useState("Mixed");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      toast.error("Please log in to report an issue.");
      router.replace("/login");
      return;
    }
    if (!navigator.geolocation) {
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude);
        setLng(pos.coords.longitude);
      },
      () => setLocationError("Could not get your location. You can still submit with a default location.")
    );
  }, [user, loading, router]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const url = URL.createObjectURL(file);
    setImagePreview(url);
    return () => URL.revokeObjectURL(url);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!description.trim()) {
      toast.error("Please enter a description.");
      return;
    }
    const latitude = lat ?? 0;
    const longitude = lng ?? 0;
    if (latitude === 0 && longitude === 0) {
      toast.error("Location is required. Please allow location access or try again.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("description", description.trim());
      formData.set("wasteType", wasteType);
      formData.set("latitude", String(latitude));
      formData.set("longitude", String(longitude));

      let fileToUpload = imageFile;
      if (imageFile) {
        try {
          fileToUpload = await imageCompression(imageFile, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1200,
            useWebWorker: true
          });
        } catch {
          // use original if compression fails
        }
        if (fileToUpload) formData.set("image", fileToUpload);
      }

      const res = await fetch("/api/complaints", {
        method: "POST",
        credentials: "include",
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to submit report.");
        return;
      }
      toast.success("Report submitted. You can track its status on the map.");
      router.push("/map");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !user) {
    return (
      <div className="card p-8 text-center">
        <div className="skeleton h-8 w-48 mx-auto mb-4" />
        <div className="skeleton h-4 w-64 mx-auto" />
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto card p-6">
      <h1 className="text-xl font-semibold mb-4">Report garbage issue</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Description *</label>
          <textarea
            className="input min-h-[100px] resize-y"
            placeholder="Describe the issue (e.g. overflowing bin, illegal dumping...)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Waste type</label>
          <select
            className="input"
            value={wasteType}
            onChange={(e) => setWasteType(e.target.value)}
          >
            {WASTE_TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Photo (optional)</label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="input"
            onChange={onFileChange}
          />
          {imagePreview && (
            <img
              src={imagePreview}
              alt="Preview"
              className="mt-2 rounded-lg object-cover max-h-40 w-full"
            />
          )}
        </div>
        <div>
          <span className="block text-sm font-medium mb-1">GPS location</span>
          {lat != null && lng != null ? (
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Captured: {lat.toFixed(5)}, {lng.toFixed(5)}
            </p>
          ) : (
            <p className="text-sm text-amber-600 dark:text-amber-400">
              {locationError || "Getting location…"}
            </p>
          )}
        </div>
        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? "Submitting…" : "Submit report"}
        </button>
      </form>
    </div>
  );
}
