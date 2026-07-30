import React, { useState, useEffect, useMemo } from "react";
import {
  useSearchParams,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  GoogleMap,
  useJsApiLoader,
  OverlayView,
  Circle,
  Marker,
} from "@react-google-maps/api";
import {
  MapPin,
  Star,
  Building2,
  Users,
  Home,
  Search,
  Lock,
  ShieldCheck,
  CheckCircle2,
  ChevronDown,
  Crosshair,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const MAP_LIBRARIES = ["places"];

// --- HELPERS ---
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
const formatShortCurrency = (val) => {
  if (val >= 1000) return `₹${(val / 1000).toFixed(val % 1000 !== 0 ? 1 : 0)}k`;
  return `₹${val}`;
};

const renderGender = (pref) => {
  if (pref === "male_only")
    return (
      <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
        Boys
      </span>
    );
  if (pref === "female_only")
    return (
      <span className="bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
        Girls
      </span>
    );
  return (
    <span className="bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
      Unisex
    </span>
  );
};

const renderOccupant = (type) => {
  if (type === "students") return "Students";
  if (type === "working_professionals") return "Professionals";
  return "Students • Professionals";
};

const renderSchemaBadge = (badge) => {
  if (badge === "black")
    return (
      <div className="absolute top-2 right-2 bg-black/90 backdrop-blur-md text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
        <Star size={10} className="text-yellow-500 fill-yellow-500" /> Premium
      </div>
    );
  if (badge === "green")
    return (
      <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-md text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
        <MapPin size={10} /> Prime Loc
      </div>
    );
  if (badge === "blue")
    return (
      <div className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur-md text-white px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
        <ShieldCheck size={10} /> Value Pick
      </div>
    );
  return null;
};

export default function LocationSearch() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const targetLat = searchParams.get("lat");
  const targetLng = searchParams.get("lng");
  const searchQuery = searchParams.get("q") || "your selected location";
  const source = searchParams.get("source");

  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hoveredId, setHoveredId] = useState(null);

  // Horizontal Filter State
  const [activeTab, setActiveTab] = useState("all"); // 'all', 'pg', 'flats', 'flatmate_spot'
  const [filters, setFilters] = useState({
    radiusKm: 3, // Default 3km as requested
    gender: "any",
    maxRent: 50000,
  });

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
    version: "weekly",
  });

  const mapCenter = {
    lat: parseFloat(targetLat) || 23.0225,
    lng: parseFloat(targetLng) || 72.5714,
  };

  useEffect(() => {
    checkAuthAndFetch();
  }, [targetLat, targetLng, filters.radiusKm]); // Re-fetch when radius changes

  const checkAuthAndFetch = async () => {
    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user || null);

    if (targetLat && targetLng) {
      try {
        const { data: nearbyData, error: rpcError } = await supabase.rpc(
          "get_nearby_listing_ids",
          {
            target_lat: parseFloat(targetLat),
            target_lng: parseFloat(targetLng),
            radius_meters: filters.radiusKm * 1000,
          }
        );

        if (rpcError) throw rpcError;

        if (!nearbyData || nearbyData.length === 0) {
          setListings([]);
          setLoading(false);
          return;
        }

        const ids = nearbyData.map((n) => n.id);
        const { data: listingsData, error: dbError } = await supabase
          .from("pg_flat_listings")
          .select(`*, listing_media (url, is_primary)`)
          .in("id", ids)
          .eq("status", "active");

        if (dbError) throw dbError;

        const mergedData = listingsData.map((listing) => {
          const distInfo = nearbyData.find((n) => n.id === listing.id);
          return { ...listing, dist_meters: distInfo?.dist_meters || 0 };
        });

        setListings(mergedData.sort((a, b) => a.dist_meters - b.dist_meters));
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    }
  };

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (activeTab !== "all" && l.listing_type !== activeTab) return false;
      if (l.price_monthly_min > filters.maxRent) return false;
      if (
        filters.gender !== "any" &&
        l.gender_preference !== filters.gender &&
        l.gender_preference !== "any"
      )
        return false;
      return true;
    });
  }, [listings, activeTab, filters]);

  // If no lat/lng is provided, this page shouldn't be accessed directly.
  if (!targetLat || !targetLng) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center bg-mainBg">
        <MapPin size={48} className="text-tertiaryText mb-4 opacity-50" />
        <h1 className="text-xl font-black text-primaryText mb-2">
          Location Required
        </h1>
        <p className="text-sm text-secondaryText mb-6">
          Please search for a location to use the map view.
        </p>
        <button
          onClick={() => navigate("/accommodations")}
          className="bg-[#5B4EE4] text-white px-6 py-3 rounded-xl font-bold"
        >
          Go to Directory
        </button>
      </div>
    );
  }

  return (
    <div className="w-full min-h-screen bg-mainBg flex flex-col font-sans animate-in fade-in pb-20">
      {/* 1. TOP PANEL: SPLIT INFO & MAP */}
      <div className="w-full bg-surface border-b border-cardBorder">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row h-auto md:h-[350px]">
          {/* Left: Info & Radius Control (40%) */}
          <div className="w-full md:w-[40%] p-6 md:p-8 flex flex-col justify-center gap-4">
            <div>
              <span className="text-[10px] font-black text-accentBlue uppercase tracking-widest bg-accentBlue/10 px-2.5 py-1 rounded-md inline-block mb-3">
                {source === "gps" ? "Current Location" : "Map Search"}
              </span>
              <h1 className="text-2xl md:text-3xl font-black text-primaryText leading-tight">
                Showing{" "}
                <span className="text-accentBlue">
                  {filteredListings.length}
                </span>{" "}
                properties near <br />
                <span
                  className="text-secondaryText truncate inline-block max-w-full"
                  title={searchQuery}
                >
                  "{searchQuery}"
                </span>
              </h1>
            </div>

            <div className="bg-mainBg border border-cardBorder p-4 rounded-2xl mt-2">
              <label className="text-xs font-bold text-secondaryText uppercase tracking-wider flex justify-between mb-3">
                Search Radius{" "}
                <span className="text-primaryText bg-surface px-2 py-0.5 rounded border border-cardBorder">
                  {filters.radiusKm} km
                </span>
              </label>
              <input
                type="range"
                min="1"
                max="15"
                step="1"
                value={filters.radiusKm}
                onChange={(e) =>
                  setFilters({ ...filters, radiusKm: parseInt(e.target.value) })
                }
                className="w-full accent-[#5B4EE4]"
              />
            </div>
          </div>

          {/* Right: Constrained Google Map (60%) */}
          <div className="w-full md:w-[60%] h-[300px] md:h-full border-l border-cardBorder relative bg-zinc-100">
            {isLoaded ? (
              <GoogleMap
                mapContainerStyle={{ width: "100%", height: "100%" }}
                center={mapCenter}
                zoom={13}
                options={{
                  disableDefaultUI: true,
                  zoomControl: true,
                  gestureHandling: "greedy",
                  mapId: "bachelorbase_public_map",
                }}
              >
                {/* Center Target Indicator */}
                <Marker
                  position={mapCenter}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: 7,
                    fillColor: "#2563eb",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                  }}
                />

                {/* Radius Circle */}
                <Circle
                  center={mapCenter}
                  radius={filters.radiusKm * 1000}
                  options={{
                    fillColor: "#5B4EE4",
                    fillOpacity: 0.08,
                    strokeColor: "#5B4EE4",
                    strokeOpacity: 0.6,
                    strokeWeight: 2,
                  }}
                />

                {/* Bright Square Property Pins */}
                {user &&
                  filteredListings.map((listing) => (
                    <OverlayView
                      key={listing.id}
                      position={{
                        lat: parseFloat(listing.latitude),
                        lng: parseFloat(listing.longitude),
                      }}
                      mapPaneName={OverlayView.OVERLAY_MOUSE_TARGET}
                    >
                      <div
                        onClick={() =>
                          navigate(`/accommodations/view/${listing.id}`)
                        }
                        className={`cursor-pointer px-2 py-1 rounded-md text-[11px] font-black shadow-[0_4px_10px_rgba(0,0,0,0.3)] border-2 transition-all flex items-center justify-center transform -translate-x-1/2 -translate-y-full ${
                          hoveredId === listing.id
                            ? "bg-zinc-900 text-white border-white scale-110 z-50"
                            : "bg-[#FF2E51] text-white border-white hover:scale-110 z-40"
                        }`}
                      >
                        {formatShortCurrency(listing.price_monthly_min)}
                      </div>
                    </OverlayView>
                  ))}
              </GoogleMap>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-tertiaryText">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span className="text-sm font-bold">Loading Map...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. HORIZONTAL FILTER BAR */}
      <div className="bg-surface border-b border-cardBorder sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Main Category Tabs */}
          <div className="flex gap-2 bg-mainBg p-1 rounded-lg border border-cardBorder w-fit overflow-x-auto no-scrollbar">
            {[
              { id: "all", label: "All" },
              { id: "pg", label: "PGs" },
              { id: "flat", label: "Flats" },
              { id: "flatmate_spot", label: "Flatmates" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-1.5 rounded-md text-xs font-black uppercase tracking-wider transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? "bg-surface text-primaryText shadow-sm border border-cardBorder"
                    : "text-secondaryText hover:text-primaryText"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1 sm:pb-0 shrink-0">
            <select
              value={filters.gender}
              onChange={(e) =>
                setFilters({ ...filters, gender: e.target.value })
              }
              className="bg-mainBg border border-cardBorder rounded-lg px-3 py-2 text-xs font-bold text-primaryText outline-none focus:border-[#5B4EE4]"
            >
              <option value="any">Gender: Any</option>
              <option value="male_only">Boys Only</option>
              <option value="female_only">Girls Only</option>
            </select>

            <select
              value={filters.maxRent}
              onChange={(e) =>
                setFilters({ ...filters, maxRent: parseInt(e.target.value) })
              }
              className="bg-mainBg border border-cardBorder rounded-lg px-3 py-2 text-xs font-bold text-primaryText outline-none focus:border-[#5B4EE4]"
            >
              <option value="50000">Max Rent: Any</option>
              <option value="15000">Up to ₹15k</option>
              <option value="25000">Up to ₹25k</option>
              <option value="35000">Up to ₹35k</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. PROPERTY GRID (Same aesthetic as Home/Favorites) */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 w-full relative flex-grow">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-72 bg-surface border border-cardBorder rounded-2xl"
              ></div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Search size={48} className="text-tertiaryText mb-4 opacity-50" />
            <h2 className="text-xl font-black text-primaryText mb-2">
              No properties found here
            </h2>
            <p className="text-sm font-medium text-secondaryText max-w-sm">
              Try increasing your search radius or modifying your filters to see
              more results.
            </p>
          </div>
        ) : (
          <div className="relative">
            {/* THE GLASSMORPHISM TEASER FOR LOGGED OUT USERS */}
            {!user && (
              <div className="absolute inset-0 z-30 bg-surface/50 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 border border-cardBorder text-center shadow-2xl">
                <Lock
                  size={56}
                  className="text-[#5B4EE4] mb-4 drop-shadow-md"
                />
                <h2 className="text-2xl sm:text-3xl font-black text-primaryText mb-3 drop-shadow-md">
                  Unlock Map & Details
                </h2>
                <p className="text-sm sm:text-base text-primaryText font-bold mb-8 max-w-md drop-shadow-md">
                  Join BachelorBase to instantly view contact details, exact
                  pricing, and interact with the map pins in this area.
                </p>
                <div className="flex gap-4 w-full max-w-sm">
                  <button
                    onClick={() => {
                      sessionStorage.setItem(
                        "returnTo",
                        location.pathname + location.search
                      );
                      navigate("/login");
                    }}
                    className="flex-1 bg-[#5B4EE4] text-white py-3.5 rounded-xl font-black text-sm shadow-xl hover:bg-[#4b40ce] transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate("/register")}
                    className="flex-1 bg-white text-zinc-900 border border-cardBorder py-3.5 rounded-xl font-black text-sm shadow-lg hover:bg-mainBg transition-colors"
                  >
                    Register
                  </button>
                </div>
              </div>
            )}

            <div
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${
                !user ? "opacity-40 grayscale-[30%] pointer-events-none" : ""
              }`}
            >
              {filteredListings.map((listing) => {
                const primaryMedia =
                  listing.listing_media?.find((m) => m.is_primary) ||
                  listing.listing_media?.[0];
                const coverImg = primaryMedia
                  ? primaryMedia.url.startsWith("http")
                    ? primaryMedia.url
                    : `${API_BASE}${primaryMedia.url}`
                  : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80";

                return (
                  <div
                    key={listing.id}
                    onMouseEnter={() => setHoveredId(listing.id)}
                    onMouseLeave={() => setHoveredId(null)}
                    onClick={() =>
                      user
                        ? navigate(`/accommodations/view/${listing.id}`)
                        : null
                    }
                    className="bg-surface rounded-2xl border border-cardBorder shadow-sm flex flex-col group overflow-hidden hover:shadow-xl hover:border-[#5B4EE4]/50 transition-all duration-300 cursor-pointer"
                  >
                    <div className="relative h-44 w-full bg-mainBg overflow-hidden block">
                      <img
                        src={coverImg}
                        alt="Cover"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      {listing.badge && renderSchemaBadge(listing.badge)}
                    </div>

                    <div className="p-4 flex flex-col flex-grow gap-2.5">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="font-black text-sm text-primaryText leading-tight line-clamp-1">
                          {listing.title}
                        </h3>
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[9px] text-amber-600 font-black shrink-0 shadow-sm">
                          <Star size={10} className="fill-amber-500" />{" "}
                          {Number(listing.rating_overall) > 0
                            ? listing.rating_overall
                            : "New"}
                        </div>
                      </div>

                      <p className="text-[11px] font-medium text-secondaryText flex items-center gap-1.5">
                        <MapPin size={11} className="shrink-0 text-[#5B4EE4]" />{" "}
                        {listing.locality}
                        {listing.dist_meters > 0 && (
                          <span className="text-tertiaryText">
                            • {(listing.dist_meters / 1000).toFixed(1)}km away
                          </span>
                        )}
                      </p>

                      <div className="flex flex-col gap-1.5 mt-1">
                        <div className="flex items-center gap-2">
                          {renderGender(listing.gender_preference)}
                          {listing.listing_type === "flat" && (
                            <span className="bg-mainBg border border-cardBorder text-primaryText px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                              {listing.bhk_type}
                            </span>
                          )}
                          {listing.listing_type === "pg" && (
                            <span className="bg-mainBg border border-cardBorder text-tertiaryText px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
                              {renderOccupant(listing.occupant_type)}
                            </span>
                          )}
                        </div>

                        {listing.listing_type === "flatmate_spot" && (
                          <div className="flex items-center gap-1 bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider w-fit">
                            <Users size={10} />{" "}
                            {listing.current_occupants_count} Living Here
                          </div>
                        )}
                      </div>

                      <div className="mt-auto pt-3 border-t border-cardBorder flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[9px] font-bold text-tertiaryText uppercase tracking-widest">
                            Starts From
                          </span>
                          <div className="text-sm font-black text-primaryText leading-none mt-0.5">
                            {formatCurrency(listing.price_monthly_min)}
                            <span className="text-[9px] font-bold text-secondaryText ml-0.5">
                              /mo
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
