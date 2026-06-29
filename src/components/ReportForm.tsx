import React, { useState, useRef, useEffect } from "react";
import { Issue } from "../types";
import {
  Sparkles,
  MapPin,
  Upload,
  Camera,
  Loader2,
  AlertCircle,
  Clock,
  ShieldCheck,
  Plus,
} from "lucide-react";
import InteractiveMap from "./InteractiveMap";
import { compressImage } from "../utils/imageCompressor";

interface ReportFormProps {
  onSubmitIssue: (issueData: Partial<Issue>) => void;
  issues: Issue[]; // passed to display on the mini-picker map
  theme?: "light" | "dark";
}

export default function ReportForm({ onSubmitIssue, issues, theme = "dark" }: ReportFormProps) {
  // Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<Issue["category"]>("Road Hazards");
  const [severity, setSeverity] = useState<Issue["severity"]>("Medium");
  const [estimatedResolutionDays, setEstimatedResolutionDays] = useState(5);
  const [latitude, setLatitude] = useState(22.3072);
  const [longitude, setLongitude] = useState(73.1812);

  // File Upload State
  const [imageBase64, setImageBase64] = useState<string | null>(null);        // compressed, for preview + Gemini
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [imageToStore, setImageToStore] = useState<string | null>(null);       // thumbnail-only, safe for localStorage
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // AI Loading & Autofill Feedback
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [aiFilled, setAiFilled] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [loadingStep, setLoadingStep] = useState("");

  const categories: Issue["category"][] = [
    "Road Hazards",
    "Water & Sanitation",
    "Streetlights",
    "Waste Management",
    "Public Facilities",
    "Vandals & Safety",
    "Others",
  ];

  // Drag and Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const processFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Please upload an image file.");
      return;
    }

    setIsCompressing(true);
    try {
      // Full-quality compressed image (800×800, 70% JPEG) — used for preview and Gemini API call only
      const compressed = await compressImage(file, 800, 800, 0.7);
      setImageBase64(compressed.base64);
      setImageMimeType(compressed.mimeType);

      // Tiny thumbnail (120×120, 40% JPEG) — this is the only thing saved to localStorage
      // ~2–4 KB per issue vs ~150–300 KB uncompressed — safe for quota
      const thumbnail = await compressImage(file, 120, 120, 0.4);
      setImageToStore(thumbnail.base64);
    } catch (err) {
      console.error("Image compression failed:", err);
      alert("Could not process image. Please try a different file.");
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      void processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      void processFile(e.target.files[0]);
    }
  };

  // Run Gemini AI Vision Auto-fill
  const handleAiAutoFill = async () => {
    setIsAnalyzing(true);
    setAiError(null);
    setLoadingStep("Connecting to Gemini 3.5 Flash...");

    try {
      // Simulate stepped planning output for realistic civic AI feel
      setTimeout(() => setLoadingStep("Extracting visual contours from photograph..."), 600);
      setTimeout(() => setLoadingStep("Matching municipal issue profiles..."), 1200);

      const response = await fetch("/api/gemini/analyze-issue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: description || title || "Please analyze this image and report the issue",
          imageBase64: imageBase64,
          mimeType: imageMimeType,
        }),
      });

      if (!response.ok) {
        throw new Error("AI analysis service currently offline. Using local analyzer...");
      }

      const data = await response.json();

      // Set values with delay for nice interface loading feel
      setTitle(data.title);
      setDescription(data.description);
      setCategory(data.category);
      setSeverity(data.severity);
      setEstimatedResolutionDays(data.estimatedResolutionDays);

      // Trigger purple glow flash
      setAiFilled(true);
      setTimeout(() => setAiFilled(false), 3000); // glowing lasts 3s
    } catch (error: any) {
      console.warn("AI autofill failed, applying structural estimation:", error);
      // Run local heuristic estimator for beautiful fallback auto-fill
      estimateDetailsLocally();
    } finally {
      setIsAnalyzing(false);
      setLoadingStep("");
    }
  };

  const estimateDetailsLocally = () => {
    // Elegant fallback rules
    let calculatedTitle = title || "Reported Infrastructure Issue";
    let calculatedDesc = description || "Active community request. Street team requested to inspect site.";
    let calculatedCat: Issue["category"] = category;
    let calculatedSeverity: Issue["severity"] = severity;
    let days = estimatedResolutionDays;

    const descLower = (description + " " + title).toLowerCase();

    if (descLower.includes("pothole") || descLower.includes("road") || descLower.includes("asphalt")) {
      calculatedTitle = "Pothole Maintenance Request";
      calculatedCat = "Road Hazards";
      calculatedSeverity = "High";
      days = 4;
    } else if (descLower.includes("light") || descLower.includes("lamp") || descLower.includes("dark")) {
      calculatedTitle = "Streetlight Blackout Report";
      calculatedCat = "Streetlights";
      calculatedSeverity = "Medium";
      days = 6;
    } else if (descLower.includes("leak") || descLower.includes("water") || descLower.includes("pipe") || descLower.includes("drain")) {
      calculatedTitle = "Water Leakage & Drainage Block";
      calculatedCat = "Water & Sanitation";
      calculatedSeverity = "High";
      days = 3;
    } else if (descLower.includes("trash") || descLower.includes("dump") || descLower.includes("waste") || descLower.includes("garbage")) {
      calculatedTitle = "Illegal Waste Accumulation";
      calculatedCat = "Waste Management";
      calculatedSeverity = "Medium";
      days = 2;
    }

    setTitle(calculatedTitle);
    setDescription(calculatedDesc);
    setCategory(calculatedCat);
    setSeverity(calculatedSeverity);
    setEstimatedResolutionDays(days);

    // Flash purple glows
    setAiFilled(true);
    setTimeout(() => setAiFilled(false), 3000);
  };

  // Submit Handler
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      alert("Please provide an issue title.");
      return;
    }

    onSubmitIssue({
      title,
      description,
      category,
      severity,
      estimatedResolutionDays,
      latitude,
      longitude,
      // Save only the tiny thumbnail to localStorage to avoid quota crash.
      // The full compressed image (imageBase64) is only used for Gemini API calls and preview.
      imageUrl: imageToStore || undefined,
    });

    // Reset Form
    setTitle("");
    setDescription("");
    setCategory("Road Hazards");
    setSeverity("Medium");
    setEstimatedResolutionDays(5);
    setImageBase64(null);
    setImageMimeType(null);
    setImageToStore(null);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Left Form Panel: Column Span 7 */}
      <div className="xl:col-span-7 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-6 backdrop-blur-md shadow-xl flex flex-col justify-between">
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold font-display bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Report Community Issue
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Add details, upload photo proof, and select GPS coordinates. Use Gemini AI to auto-fill details instantly.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Issue Evidence Photograph</label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative h-44 rounded-xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer overflow-hidden transition-all duration-300 ${
                  isDragging
                    ? "border-blue-500 bg-blue-500/10"
                    : imageBase64
                      ? "border-emerald-500/50 bg-emerald-950/5"
                      : "border-white/10 hover:border-blue-500/50 hover:bg-blue-500/5"
                }`}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />

                {isCompressing ? (
                  <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                    <p className="text-xs font-semibold">Compressing image...</p>
                  </div>
                ) : imageBase64 ? (
                  <div className="relative w-full h-full group">
                    <img
                      src={imageBase64}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <p className="text-xs text-white font-semibold flex items-center gap-1">
                        <Camera className="h-4 w-4" /> Replace Photograph
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 space-y-2">
                    <div className="h-12 w-12 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center mx-auto text-slate-400 dark:text-slate-300 shadow-inner">
                      <Upload className="h-5 w-5 text-blue-400" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-700 dark:text-slate-200 font-semibold">
                        Drag and drop your image here, or <span className="text-blue-400 hover:underline">browse</span>
                      </p>
                      <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, WebP up to 10MB</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* AI Auto-fill Button */}
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleAiAutoFill}
                disabled={isAnalyzing || isCompressing || (!imageBase64 && !description && !title)}
                className="flex items-center gap-2 bg-blue-950/40 text-blue-300 border border-blue-500/30 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-blue-950/30 hover:bg-blue-900/40 transition-all disabled:opacity-50"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-400" />
                    <span>{loadingStep || "Analyzing..."}</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5 text-blue-400 animate-pulse" />
                    <span>Gemini AI Auto-Fill Form</span>
                  </>
                )}
              </button>
            </div>

            {/* Title and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Issue Title</label>
                <input
                  type="text"
                  placeholder="e.g., Damaged Storm Water Grate"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className={`w-full bg-white dark:bg-slate-950 border dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all ${
                    aiFilled ? "flash-glow" : ""
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value as Issue["category"])}
                  className={`w-full bg-white dark:bg-slate-950 border dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all ${
                    aiFilled ? "flash-glow" : ""
                  }`}
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Description</label>
              <textarea
                placeholder="Describe the issue in detail, including specific hazards, safety risks, or repair requirements..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className={`w-full bg-white dark:bg-slate-950 border dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-all resize-none leading-relaxed ${
                  aiFilled ? "flash-glow" : ""
                }`}
              />
            </div>

            {/* Severity and Est Days */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Predicted Severity</label>
                <div className="grid grid-cols-4 gap-2">
                  {(["Low", "Medium", "High", "Critical"] as Issue["severity"][]).map((level) => (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setSeverity(level)}
                      className={`py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        severity === level
                          ? level === "Critical"
                            ? "bg-rose-500/20 text-rose-300 border-rose-500"
                            : level === "High"
                              ? "bg-orange-500/20 text-orange-300 border-orange-500"
                              : level === "Medium"
                                ? "bg-yellow-500/20 text-yellow-300 border-yellow-500"
                                : "bg-emerald-500/20 text-emerald-300 border-emerald-500"
                          : "bg-slate-100 dark:bg-slate-950 border-slate-200 dark:border-white/10 hover:border-slate-300 dark:hover:border-white/20 text-slate-500 dark:text-slate-400"
                      } ${aiFilled ? "flash-glow" : ""}`}
                    >
                      {level}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-300 flex items-center justify-between">
                  <span>Est. Resolution Days</span>
                  <span className="text-[10px] text-blue-400 font-mono">Set by AI Plan</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={estimatedResolutionDays}
                    onChange={(e) => setEstimatedResolutionDays(parseInt(e.target.value) || 1)}
                    className={`w-full bg-white dark:bg-slate-950 border dark:border-white/10 rounded-xl px-3.5 py-2 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 transition-all font-mono ${
                      aiFilled ? "flash-glow" : ""
                    }`}
                  />
                  <div className="px-3 py-2 bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-white/10 rounded-xl text-slate-500 dark:text-slate-400 text-[10px] shrink-0 font-mono">
                    Days
                  </div>
                </div>
              </div>
            </div>

            {/* Latitude & Longitude displays */}
            <div className="grid grid-cols-2 gap-4 bg-slate-100 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-white/5">
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider font-mono">Latitude</span>
                <span className="text-xs text-blue-300 font-mono font-bold">{latitude.toFixed(6)}</span>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-slate-500 block uppercase font-bold tracking-wider font-mono">Longitude</span>
                <span className="text-xs text-blue-300 font-mono font-bold">{longitude.toFixed(6)}</span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:opacity-95 text-white py-2.5 rounded-xl font-bold text-xs shadow-lg shadow-blue-500/20 hover:shadow-blue-500/30 transition-all hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              File Official Complaint Submittal
            </button>
          </form>
        </div>
      </div>

      {/* Right Map Location Picker: Column Span 5 */}
      <div className="xl:col-span-5 flex flex-col gap-4">
        <div className="bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-4 backdrop-blur-md shadow-xl h-[450px] flex flex-col">
          <div className="mb-3">
            <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <MapPin className="h-4 w-4 text-blue-400" />
              Interactive Location Picker
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Click/Tap anywhere on this community map to pin your issue's precise GPS location automatically.
            </p>
          </div>
          <div className="flex-1 w-full overflow-hidden">
            <InteractiveMap
              issues={issues}
              selectedCategory="All"
              selectedStatus="All"
              onSelectIssue={() => {}} // No detail modal on picker map
              isPickerMode={true}
              pickedLocation={{ lat: latitude, lng: longitude }}
              onPickLocation={(lat, lng) => {
                setLatitude(lat);
                setLongitude(lng);
              }}
              theme={theme}
            />
          </div>
        </div>

        {/* Tip Container */}
        <div className="bg-indigo-50 dark:bg-indigo-500/5 border border-indigo-200 dark:border-indigo-500/10 p-4 rounded-2xl flex gap-3 text-slate-500 dark:text-slate-400 text-xs">
          <ShieldCheck className="h-5 w-5 text-indigo-400 shrink-0" />
          <div className="space-y-1">
            <span className="font-bold text-slate-700 dark:text-slate-300">Citizen Reporting Impact</span>
            <p className="leading-relaxed text-[11px]">
              Filing complaints helps allocate city repair funds. Each issue you report gives you **+50 Experience Points (XP)** and unlocks high-reputation community badges.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}