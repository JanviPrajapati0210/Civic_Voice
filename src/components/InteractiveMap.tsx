import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { Issue } from "../types";
import { Shield, AlertCircle, Clock, CheckCircle } from "lucide-react";

interface InteractiveMapProps {
  issues: Issue[];
  selectedCategory: string;
  selectedStatus: string;
  onSelectIssue: (issue: Issue) => void;
  // Location picker mode props
  isPickerMode?: boolean;
  pickedLocation?: { lat: number; lng: number } | null;
  onPickLocation?: (lat: number, lng: number) => void;
  theme?: "light" | "dark";
}

export default function InteractiveMap({
  issues,
  selectedCategory,
  selectedStatus,
  onSelectIssue,
  isPickerMode = false,
  pickedLocation,
  onPickLocation,
  theme = "dark",
}: InteractiveMapProps) {
  const isDark = theme === "dark";
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);
  const pickerMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [isHeatmapActive, setIsHeatmapActive] = useState(false);

  // Use refs for callbacks and picker states to avoid recreating map instance on prop changes
  const isPickerModeRef = useRef(isPickerMode);
  const onPickLocationRef = useRef(onPickLocation);

  useEffect(() => {
    isPickerModeRef.current = isPickerMode;
  }, [isPickerMode]);

  useEffect(() => {
    onPickLocationRef.current = onPickLocation;
  }, [onPickLocation]);

  // Filter issues based on selections
  const filteredIssues = issues.filter((issue) => {
    // Filter out spam to keep the map clean!
    if (issue.isSpam) return false;
    const matchesCategory = selectedCategory === "All" || issue.category === selectedCategory;
    const matchesStatus = selectedStatus === "All" || issue.status === selectedStatus;
    return matchesCategory && matchesStatus;
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center dynamically based on coordinates of existing issues or global viewport
    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
    });

    const validIssues = issues.filter((issue) => !issue.isSpam);
    if (validIssues.length > 0) {
      try {
        const markers = validIssues.map((issue) => L.marker([issue.latitude, issue.longitude]));
        const group = L.featureGroup(markers);
        map.fitBounds(group.getBounds().pad(0.15));
      } catch (e) {
        map.setView([20, 0], 2);
      }
    } else {
      map.setView([20, 0], 2);
    }

    // Try geolocation to focus close to the user in picker mode
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          if (isPickerModeRef.current) {
            map.setView([position.coords.latitude, position.coords.longitude], 13);
          }
        },
        () => {},
        { timeout: 4000 }
      );
    }

    // Initial tile layer loading
    const initialUrl = theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    tileLayerRef.current = L.tileLayer(initialUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);

    // Add zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    mapRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    // Listen to clicks for picker mode using mutable ref closures
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (isPickerModeRef.current && onPickLocationRef.current) {
        onPickLocationRef.current(e.latlng.lat, e.latlng.lng);
      }
    });

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Dynamically update map tiles when theme changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }

    const tileUrl = theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png";

    tileLayerRef.current = L.tileLayer(tileUrl, {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: "abcd",
      maxZoom: 20,
    }).addTo(map);
  }, [theme]);

  // Update Picked Location Marker (Picker Mode)
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (isPickerMode && pickedLocation) {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.setLatLng([pickedLocation.lat, pickedLocation.lng]);
      } else {
        // Create custom neon pin icon
        const pinIcon = L.divIcon({
          className: "custom-picker-pin",
          html: `
            <div class="relative flex items-center justify-center">
              <span class="absolute inline-flex h-8 w-8 animate-ping rounded-full bg-blue-500 opacity-75"></span>
              <div class="relative flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 border border-white text-white shadow-lg shadow-blue-500/50">
                <span class="text-xs">📍</span>
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        pickerMarkerRef.current = L.marker([pickedLocation.lat, pickedLocation.lng], { icon: pinIcon }).addTo(map);
      }
      map.panTo([pickedLocation.lat, pickedLocation.lng]);
    } else {
      if (pickerMarkerRef.current) {
        pickerMarkerRef.current.remove();
        pickerMarkerRef.current = null;
      }
    }
  }, [isPickerMode, pickedLocation]);

  // Update Issue Markers
  useEffect(() => {
    const map = mapRef.current;
    const markerGroup = markersRef.current;
    if (!map || !markerGroup) return;

    // Clear existing markers
    markerGroup.clearLayers();

    filteredIssues.forEach((issue) => {
      // Color-code based on severity
      let color = "#10b981"; // Low (green)
      let glowColor = "rgba(16, 185, 129, 0.4)";
      let radius = 90; // base radius in meters
      if (issue.severity === "Medium") {
        color = "#eab308"; // Yellow
        glowColor = "rgba(234, 179, 8, 0.4)";
        radius = 160;
      } else if (issue.severity === "High") {
        color = "#f97316"; // Orange
        glowColor = "rgba(249, 115, 22, 0.4)";
        radius = 240;
      } else if (issue.severity === "Critical") {
        color = "#ef4444"; // Red
        glowColor = "rgba(239, 68, 68, 0.4)";
        radius = 350;
      }

      if (isHeatmapActive && !isPickerMode) {
        // Render overlapping heatmap density halos (outer glow and inner hot core)
        const outerCircle = L.circle([issue.latitude, issue.longitude], {
          radius: radius,
          color: color,
          stroke: false,
          fillColor: color,
          fillOpacity: 0.18,
        });

        const innerCircle = L.circle([issue.latitude, issue.longitude], {
          radius: radius * 0.4,
          color: color,
          stroke: false,
          fillColor: color,
          fillOpacity: 0.55,
        });

        // Popup content for the heatmap nodes
        const popupContent = document.createElement("div");
        const isDark = theme === "dark";
        popupContent.className = `p-3 font-sans w-64 rounded-lg border transition-colors duration-300 ${
          isDark
            ? "text-slate-100 bg-[#0a0d14] border-white/10 shadow-lg"
            : "text-slate-800 bg-white border-slate-200/80 shadow-sm"
        }`;
        popupContent.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
              isDark
                ? "bg-white/5 text-rose-300 border-white/10 animate-pulse"
                : "bg-rose-50 text-rose-600 border-rose-100"
            }">
              🔥 Hotspot • ${issue.category}
            </span>
            <span class="px-1.5 py-0.5 text-[9px] font-bold rounded text-white ${
              issue.severity === "Critical"
                ? "bg-rose-500"
                : issue.severity === "High"
                  ? "bg-orange-500"
                  : issue.severity === "Medium"
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
            }">
              ${issue.severity}
            </span>
          </div>
          <h4 class="font-bold text-sm line-clamp-1 mb-1 ${isDark ? "text-white" : "text-slate-900"}">${issue.title}</h4>
          <p class="text-[10px] leading-relaxed mb-2 ${isDark ? "text-slate-300" : "text-slate-600"}">${issue.description}</p>
          <div class="flex items-center justify-between text-[10px] border-t pt-2 ${
            isDark ? "text-slate-400 border-white/5" : "text-slate-500 border-slate-100"
          }">
            <span>❤️ ${issue.upvotes} Upvotes</span>
            <span class="font-semibold text-blue-500 dark:text-blue-400">Inspect Details →</span>
          </div>
        `;

        const openDetail = () => {
          onSelectIssue(issue);
        };

        outerCircle.bindPopup(popupContent, { closeButton: false, offset: L.point(0, 0) });
        innerCircle.bindPopup(popupContent, { closeButton: false, offset: L.point(0, 0) });

        outerCircle.on("popupopen", () => { popupContent.onclick = openDetail; });
        innerCircle.on("popupopen", () => { popupContent.onclick = openDetail; });

        outerCircle.addTo(markerGroup);
        innerCircle.addTo(markerGroup);
      } else {
        // Standard high-tech markers
        let statusSymbol = "⚠️";
        if (issue.status === "Resolved") statusSymbol = "✅";
        if (issue.status === "In Progress") statusSymbol = "⚙️";

        const divIcon = L.divIcon({
          className: "custom-issue-marker",
          html: `
            <div class="relative group cursor-pointer flex items-center justify-center">
              <span class="absolute inline-flex h-6 w-6 animate-ping rounded-full" style="background-color: ${color}; opacity: 0.3;"></span>
              <div class="relative w-5 h-5 rounded-full border border-white text-white flex items-center justify-center text-[10px] font-bold shadow-lg transition-transform duration-300 hover:scale-125"
                   style="background-color: ${color}; box-shadow: 0 0 10px ${glowColor};">
                ${statusSymbol}
              </div>
            </div>
          `,
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([issue.latitude, issue.longitude], { icon: divIcon });

        const popupContent = document.createElement("div");
        const isDark = theme === "dark";
        popupContent.className = `p-3 font-sans w-64 rounded-lg border transition-colors duration-300 ${
          isDark
            ? "text-slate-100 bg-[#0a0d14] border-white/10"
            : "text-slate-800 bg-white border-slate-200/80 shadow-sm"
        }`;
        popupContent.innerHTML = `
          <div class="flex items-center justify-between mb-1">
            <span class="px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
              isDark
                ? "bg-white/5 text-blue-300 border-white/10"
                : "bg-blue-50 text-blue-600 border-blue-100"
            }">
              ${issue.category}
            </span>
            <span class="px-1.5 py-0.5 text-[9px] font-bold rounded text-white ${
              issue.severity === "Critical"
                ? "bg-rose-500"
                : issue.severity === "High"
                  ? "bg-orange-500"
                  : issue.severity === "Medium"
                    ? "bg-yellow-500"
                    : "bg-emerald-500"
            }">
              ${issue.severity}
            </span>
          </div>
          <h4 class="font-bold text-sm line-clamp-1 mb-1 ${isDark ? "text-white" : "text-slate-900"}">${issue.title}</h4>
          <p class="text-xs line-clamp-2 mb-2 ${isDark ? "text-slate-300" : "text-slate-600"}">${issue.description}</p>
          <div class="flex items-center justify-between text-[10px] border-t pt-2 ${
            isDark ? "text-slate-400 border-white/5" : "text-slate-500 border-slate-100"
          }">
            <span>❤️ ${issue.upvotes} Upvotes</span>
            <span class="font-semibold text-blue-500 dark:text-blue-400">View Details →</span>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: false,
          offset: L.point(0, -5),
        });

        marker.on("popupopen", () => {
          popupContent.onclick = () => {
            onSelectIssue(issue);
          };
        });

        marker.addTo(markerGroup);
      }
    });
  }, [filteredIssues, onSelectIssue, isPickerMode, isHeatmapActive]);

  return (
    <div className={`relative w-full h-full rounded-2xl overflow-hidden border transition-all duration-300 shadow-2xl ${
      isDark ? "border-white/10 shadow-slate-950/50" : "border-slate-200 shadow-slate-200/50"
    }`}>
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Heatmap Toggle Button (Public/Audit View Mode only) */}
      {!isPickerMode && (
        <button
          onClick={() => setIsHeatmapActive((prev) => !prev)}
          className={`absolute top-4 right-4 z-20 backdrop-blur-md border px-3 py-2 rounded-xl text-[11px] font-black flex items-center gap-1.5 shadow-lg transition-all hover:scale-105 cursor-pointer ${
            isHeatmapActive
              ? "bg-rose-500/20 border-rose-500 text-rose-300 shadow-rose-500/20"
              : isDark
                ? "bg-slate-950/90 border-white/10 text-slate-300 hover:bg-slate-900"
                : "bg-white/95 border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
          }`}
        >
          <span>🔥</span>
          <span>{isHeatmapActive ? "Visualizing Heatspots" : "Enable trouble spot heatmap"}</span>
        </button>
      )}

      {/* Floating Instructions Over the Map */}
      {isPickerMode ? (
        <div className={`absolute top-4 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-96 z-20 backdrop-blur-md border p-3 rounded-xl shadow-lg flex items-center gap-3 transition-colors duration-300 ${
          isDark ? "bg-slate-950/90 border-blue-500/40" : "bg-white/95 border-blue-400 shadow-blue-100"
        }`}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-blue-500 dark:text-blue-400 border border-blue-500/30">
            <Shield className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h5 className={`text-xs font-bold ${isDark ? "text-blue-200" : "text-blue-600"}`}>Location Picker Enabled</h5>
            <p className={`text-[10px] ${isDark ? "text-slate-300" : "text-slate-600"}`}>Click anywhere on the map to set coordinates automatically for your report.</p>
          </div>
        </div>
      ) : (
        <div className={`absolute bottom-4 left-4 z-20 backdrop-blur-md border px-3 py-2 rounded-lg text-[10px] flex flex-col gap-1 shadow-lg transition-colors duration-300 ${
          isDark ? "bg-slate-950/80 border-white/5 text-slate-400" : "bg-white/90 border-slate-200 text-slate-600"
        }`}>
          <div className={`font-semibold mb-0.5 ${isDark ? "text-slate-300" : "text-slate-800"}`}>Map Key</div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Critical Severity
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" /> High Severity
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Medium Severity
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Low Severity
          </div>
        </div>
      )}
    </div>
  );
}
