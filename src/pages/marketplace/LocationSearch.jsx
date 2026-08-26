import React, { useState, useEffect, useMemo, useRef } from "react";
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
  Home as HomeIcon,
  Search,
  Lock,
  ShieldCheck,
  Loader2,
  Crosshair,
  SlidersHorizontal,
  X,
  ChevronDown,
  Map as MapIcon,
  BadgeCheck,
  Heart,
  Info
} from "lucide-react";
import PhoneVerificationModal from "../../components/auth/PhoneVerificationModal";

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
      <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
        Boys
      </span>
    );
  if (pref === "female_only")
    return (
      <span className="bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
        Girls
      </span>
    );
  return (
    <span className="bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
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
      <div className="absolute top-2 right-2 bg-black/90 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 z-10">
        <Star size={10} className="text-yellow-500 fill-yellow-500" /> Premium
      </div>
    );
  if (badge === "green")
    return (
      <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 z-10">
        <MapPin size={10} /> Prime Loc
      </div>
    );
  if (badge === "blue")
    return (
      <div className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1 z-10">
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
  const searchQuery = searchParams.get("q") || "";
  const source = searchParams.get("source");

  const [user, setUser] = useState(null);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hoveredId, setHoveredId] = useState(null);

  // States for Dynamic Favorites
  const [savedFavorites, setSavedFavorites] = useState(new Set());
  const [animatingHeart, setAnimatingHeart] = useState(null);
  const [toast, setToast] = useState(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // --- SEARCH BAR STATES ---
  const [inputValue, setInputValue] = useState(searchQuery || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isLocating, setIsLocating] = useState(false);
  const searchContainerRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // --- FILTER STATES ---
  const [activeTab, setActiveTab] = useState("pg");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filters, setFilters] = useState({
    radiusKm: 3,
    maxRent: "",
    minRating: 0,
    gender: "all",
    foodIncluded: "all",
    bhk: "all",
    furnishing: "all",
  });

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
    version: "weekly",
  });

  const mapCenter = {
    lat: parseFloat(targetLat) || 23.0225,
    lng: parseFloat(targetLng) || 72.5714,
  };

  const showToast = (msg, type = "success", action = null) => {
    setToast({ msg, type, action });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    checkAuthAndFetch();
    fetchUserFavorites();
  }, [targetLat, targetLng, filters.radiusKm]);

  const fetchUserFavorites = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) return;
    const { data } = await supabase
      .from("saved_favorites")
      .select("listing_id")
      .eq("user_id", session.user.id)
      .not("listing_id", "is", null);
    if (data) {
      setSavedFavorites(new Set(data.map((item) => item.listing_id)));
    }
  };

  const requireVerifiedPhone = async (actionCallback) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      sessionStorage.setItem("returnTo", location.pathname + location.search);
      showToast("Please login to save favorites", "error");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
    const { data: profile } = await supabase
      .from("users")
      .select("is_phone_verified")
      .eq("id", session.user.id)
      .single();
    const isVerified = profile?.is_phone_verified || !!session.user.phone;
    if (!isVerified) {
      setPendingAction(() => actionCallback);
      setIsPhoneModalOpen(true);
      return;
    }
    actionCallback(session.user.id);
  };

  const handleFavoriteClick = async (e, listingId) => {
    e.preventDefault();
    e.stopPropagation();
    requireVerifiedPhone(async (userId) => {
      const isFav = savedFavorites.has(listingId);
      setAnimatingHeart(listingId);
      setTimeout(() => setAnimatingHeart(null), 300);

      if (isFav) {
        setSavedFavorites((prev) => {
          const n = new Set(prev);
          n.delete(listingId);
          return n;
        });
        await supabase
          .from("saved_favorites")
          .delete()
          .match({ user_id: userId, listing_id: listingId });
        showToast("Removed from favorites", "success");
      } else {
        setSavedFavorites((prev) => {
          const n = new Set(prev);
          n.add(listingId);
          return n;
        });
        await supabase
          .from("saved_favorites")
          .insert({ user_id: userId, listing_id: listingId });
        showToast("Added to favorites!", "success", {
          label: "View",
          url: "/favorites",
        });
      }
    });
  };

  const checkAuthAndFetch = async () => {
    if (!targetLat || !targetLng) return;

    setLoading(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    setUser(session?.user || null);

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

      const selectQuery = session?.user
        ? `*, listing_media (url, is_primary), listing_amenities (food_included)`
        : `id, latitude, longitude, price_monthly_min, price_monthly_max, listing_type, gender_preference, occupant_type, bhk_type, furnishing_status, badge, title, locality, city`;

      const { data: listingsData, error: dbError } = await supabase
        .from("pg_flat_listings")
        .select(selectQuery)
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
  };

  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (l.listing_type !== activeTab) return false;
      if (filters.maxRent && l.price_monthly_min > Number(filters.maxRent))
        return false;
      if (filters.minRating > 0) {
        const rating = Number(l.rating_overall) || 0;
        if (rating < filters.minRating) return false;
      }
      if (filters.gender !== "all") {
        if (l.gender_preference !== filters.gender) return false;
      }
      if (activeTab === "pg") {
        if (filters.foodIncluded !== "all") {
          const isFoodIncluded =
            l.listing_amenities?.[0]?.food_included === true;
          if (filters.foodIncluded === "true" && !isFoodIncluded) return false;
          if (filters.foodIncluded === "false" && isFoodIncluded) return false;
        }
      }
      if (activeTab === "flat" || activeTab === "flatmate_spot") {
        if (filters.bhk !== "all" && l.bhk_type !== filters.bhk) return false;
        if (
          filters.furnishing !== "all" &&
          l.furnishing_status !== filters.furnishing
        )
          return false;
      }
      return true;
    });
  }, [listings, activeTab, filters]);

  // Group listings by badge for categorized display
  const groupedListings = useMemo(() => {
    return {
      prime: filteredListings.filter((l) => l.badge === "green"),
      premium: filteredListings.filter((l) => l.badge === "black"),
      value: filteredListings.filter((l) => l.badge === "blue"),
      other: filteredListings.filter((l) => !l.badge),
    };
  }, [filteredListings]);

  // --- AUTOCOMPLETE LOGIC ---
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!val) {
      setSuggestions([]);
      return;
    }
    typingTimeoutRef.current = setTimeout(async () => {
      if (window.google && window.google.maps.places.AutocompleteSuggestion) {
        try {
          const request = { input: val, includedRegionCodes: ["in"] };
          const response =
            await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
              request
            );
          if (response && response.suggestions)
            setSuggestions(response.suggestions);
          else setSuggestions([]);
        } catch (error) {
          console.error("Places API Fetch Error:", error);
        }
      }
    }, 300);
  };

  const handleSelect = async (suggestion) => {
    const displayText = suggestion.placePrediction.text.text;
    setInputValue(displayText);
    setSuggestions([]);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ["location"] });
      const lat = place.location.lat();
      const lng = place.location.lng();
      navigate(
        `/location-search?lat=${lat}&lng=${lng}&q=${encodeURIComponent(
          displayText
        )}&source=search`
      );
    } catch (error) {
      console.error("Error fetching exact location details:", error);
    }
  };

  const handleSearchSubmit = () => {
    if (inputValue.trim() !== "")
      navigate(`/location-search?q=${encodeURIComponent(inputValue)}`);
  };

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      // Forced high accuracy to prevent ISP IP routing offsets on PC
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          setInputValue("");
          navigate(
            `/location-search?lat=${position.coords.latitude}&lng=${position.coords.longitude}&source=gps`
          );
        },
        (error) => {
          setIsLocating(false);
          if (error.code === 1) {
            alert(
              "Location access denied. Please allow location access in your browser settings to use this feature."
            );
          } else if (error.code === 2) {
            alert(
              "Position unavailable. If you are on a PC without GPS hardware, your network may not provide accurate coordinates. Please search your area manually."
            );
          } else {
            alert(
              "Location request timed out. Please try again or search manually."
            );
          }
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setSuggestions([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const clearFilters = () => {
    setFilters({
      radiusKm: 3,
      maxRent: "",
      minRating: 0,
      gender: "all",
      foodIncluded: "all",
      bhk: "all",
      furnishing: "all",
    });
  };

  // Structured Layout Fix for Top Left Box
  const renderPanelText = () => {
    if (!targetLat || !targetLng) {
      return (
        <div className="flex flex-col gap-2 w-full">
          <h1 className="text-lg md:text-xl font-black text-primaryText leading-snug">
            Please <span className="text-[#5B4EE4]">search a location</span>
          </h1>
          <p className="text-xs font-bold text-secondaryText leading-relaxed">
            Or allow current location access to explore verified properties
            nearby.
          </p>
        </div>
      );
    }
    if (source === "gps") {
      return (
        <div className="flex flex-col gap-1 w-full">
          <h1 className="text-lg md:text-xl font-black text-primaryText leading-snug">
            Showing{" "}
            <span className="text-[#5B4EE4]">{filteredListings.length}</span>{" "}
            properties
          </h1>
          <p className="text-xs font-bold text-secondaryText uppercase tracking-widest mt-1">
            Near your current location
          </p>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-1.5 w-full">
        <h1 className="text-lg md:text-xl font-black text-primaryText leading-snug">
          Showing{" "}
          <span className="text-[#5B4EE4]">{filteredListings.length}</span>{" "}
          properties
        </h1>
        <p className="text-xs font-bold text-secondaryText leading-relaxed break-words pr-2">
          Near "{searchQuery}"
        </p>
      </div>
    );
  };

  // Helper to render sections
  const renderGridSection = (items, title, icon, emptyMsg = false) => {
    if (items.length === 0 && !emptyMsg) return null;
    return (
      <div className="flex flex-col gap-4 mb-10 last:mb-0">
        <h2 className="text-sm sm:text-base font-black text-primaryText flex items-center gap-2 border-b border-cardBorder pb-3 uppercase tracking-wider">
          {icon} {title}
          <span className="text-[10px] text-secondaryText bg-surface px-2 py-0.5 rounded border border-cardBorder">
            {items.length}
          </span>
        </h2>

        {items.length === 0 && emptyMsg ? (
          <div className="bg-surface border border-cardBorder rounded-2xl py-12 flex flex-col items-center text-center shadow-sm">
            <Star size={32} className="text-tertiaryText mb-2 opacity-50" />
            <span className="text-sm font-bold text-secondaryText">
              No specific properties found for this category.
            </span>
          </div>
        ) : (
          <div
            className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 ${
              !user ? "opacity-40 grayscale-[30%] pointer-events-none" : ""
            }`}
          >
            {items.map((listing) => {
              const primaryMedia =
                listing.listing_media?.find((m) => m.is_primary) ||
                listing.listing_media?.[0];
              const coverImg = primaryMedia
                ? primaryMedia.url.startsWith("http")
                  ? primaryMedia.url
                  : `${API_BASE}${primaryMedia.url}`
                : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80";
              const isFav = savedFavorites.has(listing.id);
              const isAnimating = animatingHeart === listing.id;

              return (
                <div
                  key={listing.id}
                  onMouseEnter={() => setHoveredId(listing.id)}
                  onMouseLeave={() => setHoveredId(null)}
                  onClick={() =>
                    user ? navigate(`/accommodations/view/${listing.id}`) : null
                  }
                  className="bg-surface rounded-2xl border border-cardBorder shadow-sm flex flex-col group overflow-hidden hover:shadow-xl hover:border-[#5B4EE4]/50 transition-all duration-300 cursor-pointer relative"
                >
                  <div className="relative h-44 w-full bg-mainBg overflow-hidden block shrink-0">
                    <img
                      src={coverImg}
                      alt="Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {listing.badge && renderSchemaBadge(listing.badge)}

                    {/* Floating Favorite Button */}
                    <button
                      onClick={(e) => handleFavoriteClick(e, listing.id)}
                      className="absolute top-3 left-3 bg-black/40 backdrop-blur-md hover:bg-black/60 p-2 rounded-full transition-colors border border-white/20 shadow-sm z-20 group/btn"
                    >
                      <Heart
                        size={16}
                        className={`transition-transform duration-300 ease-out ${
                          isAnimating ? "scale-[1.7]" : "scale-100"
                        }`}
                        fill={isFav ? "#ec4899" : "transparent"}
                        color={isFav ? "#ec4899" : "white"}
                      />
                    </button>
                  </div>

                  <div className="p-4 flex flex-col flex-grow gap-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-sm text-primaryText leading-tight line-clamp-1">
                        {listing.title || "Hidden Property"}
                      </h3>
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[10px] text-amber-600 font-black shrink-0 shadow-sm">
                        <Star
                          size={10}
                          className="fill-amber-500 text-amber-500"
                        />{" "}
                        {Number(listing.rating_overall) > 0
                          ? listing.rating_overall
                          : "New"}
                      </div>
                    </div>

                    <p className="text-[11px] font-medium text-secondaryText flex items-center gap-1.5 truncate">
                      <MapPin size={11} className="shrink-0 text-[#5B4EE4]" />{" "}
                      {listing.locality || "Location Hidden"}
                      {listing.dist_meters > 0 && (
                        <span className="text-tertiaryText">
                          • {(listing.dist_meters / 1000).toFixed(1)}km away
                        </span>
                      )}
                    </p>

                    <div className="flex flex-col gap-1.5 mt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderGender(listing.gender_preference)}
                        {listing.listing_type === "flat" &&
                          listing.bhk_type && (
                            <span className="bg-mainBg border border-cardBorder text-primaryText px-2 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase">
                              {listing.bhk_type}
                            </span>
                          )}
                        {listing.listing_type === "pg" &&
                          listing.occupant_type && (
                            <span className="bg-mainBg border border-cardBorder text-tertiaryText px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
                              {renderOccupant(listing.occupant_type)}
                            </span>
                          )}
                      </div>
                    </div>

                    {/* Lower Footer with "View Details" button */}
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

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (user)
                            navigate(`/accommodations/view/${listing.id}`);
                        }}
                        className="bg-mainBg border border-cardBorder hover:border-[#5B4EE4] hover:text-[#5B4EE4] text-secondaryText font-bold px-3 py-1.5 rounded-lg transition-colors text-[10px] uppercase tracking-wide shadow-sm"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full min-h-screen bg-mainBg flex flex-col font-sans animate-in fade-in pb-20">
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onSuccess={() => {
          setIsPhoneModalOpen(false);
          if (pendingAction) pendingAction();
        }}
      />

      {toast && (
        <div
          className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[500] border shadow-2xl px-6 py-3.5 rounded-full flex items-center gap-2.5 max-w-[90vw] whitespace-nowrap overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 ease-out ${
            toast.type === "error"
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-emerald-50 border-emerald-200 text-emerald-600"
          }`}
        >
          <Info size={18} className="shrink-0" />
          <span className="text-sm font-black tracking-wide truncate">
            {toast.msg}
          </span>
          {toast.action && (
            <Link
              to={toast.action.url}
              className="ml-2 text-xs font-black underline shrink-0 hover:opacity-80"
            >
              {toast.action.label}
            </Link>
          )}
        </div>
      )}

      {/* 1. EMBEDDED LOCATION SEARCH BAR */}
      <div className="bg-surface border-b border-cardBorder py-4 md:py-6">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8">
          <div className="flex flex-col md:flex-row items-center bg-mainBg rounded-2xl md:rounded-full p-2 shadow-sm border border-cardBorder gap-2 md:gap-0 relative">
            <div
              className="flex-1 flex flex-col w-full relative"
              ref={searchContainerRef}
            >
              <div className="flex items-center px-4 py-2.5 w-full">
                <Search className="text-[#5B4EE4] mr-3 shrink-0" size={18} />
                <input
                  type="text"
                  placeholder={
                    isLoaded
                      ? "Search College, Landmark, or Area"
                      : "Connecting to Maps API..."
                  }
                  value={inputValue}
                  onChange={handleInputChange}
                  disabled={!isLoaded || !!loadError}
                  className="w-full bg-transparent border-none outline-none text-primaryText placeholder-tertiaryText font-semibold text-sm disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearchSubmit();
                  }}
                />
              </div>

              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-full md:w-[125%] bg-surface border border-cardBorder rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion) => {
                    const mainText = suggestion.placePrediction.mainText.text;
                    const secondaryText = suggestion.placePrediction
                      .secondaryText
                      ? suggestion.placePrediction.secondaryText.text
                      : "";
                    return (
                      <button
                        key={suggestion.placePrediction.placeId}
                        onClick={() => handleSelect(suggestion)}
                        className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-mainBg transition-colors border-b border-cardBorder last:border-0 group"
                      >
                        <MapPin
                          size={16}
                          className="text-tertiaryText shrink-0 mt-0.5 group-hover:text-[#5B4EE4] transition-colors"
                        />
                        <div className="flex flex-col">
                          <span className="text-xs md:text-sm font-bold text-primaryText leading-snug">
                            {mainText}
                          </span>
                          {secondaryText && (
                            <span className="text-[11px] text-secondaryText font-medium mt-0.5 leading-tight">
                              {secondaryText}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="w-full h-px md:w-px md:h-7 bg-cardBorder mx-1 hidden md:block"></div>

            <div className="w-full md:w-auto flex gap-2 md:contents px-1 pb-1 md:p-0">
              <button
                onClick={handleUseCurrentLocation}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-primaryText font-bold text-xs px-3.5 py-3 hover:bg-surface rounded-xl md:rounded-full transition-colors border border-cardBorder md:border-transparent shrink-0"
              >
                <Crosshair
                  size={15}
                  className={`text-[#5B4EE4] ${
                    isLocating ? "animate-spin" : ""
                  }`}
                />
                <span>{isLocating ? "Locating..." : "Locate Me"}</span>
              </button>
              <button
                onClick={handleSearchSubmit}
                className="flex-1 md:flex-none bg-[#5B4EE4] text-white font-bold py-3 px-6 rounded-xl md:rounded-full shadow-md hover:bg-[#4b40ce] active:scale-95 transition-all shrink-0 text-xs md:text-sm"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 2. MAP & RADIUS PANEL BOX */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 mt-4 md:mt-6 w-full">
        <div className="bg-surface border border-cardBorder rounded-2xl md:rounded-3xl overflow-hidden shadow-sm flex flex-col md:flex-row h-auto md:h-[350px]">
          {/* Left Panel: Info & Radius */}
          <div className="w-full md:w-[35%] lg:w-[30%] p-6 md:p-8 flex flex-col justify-center gap-4 bg-surface z-10 shadow-[4px_0_15px_rgba(0,0,0,0.03)]">
            {renderPanelText()}

            <div className="bg-mainBg border border-cardBorder p-4 rounded-2xl mt-1">
              <label className="text-xs font-bold text-secondaryText uppercase tracking-wider flex justify-between mb-3">
                Search Radius{" "}
                <span className="text-[#5B4EE4] bg-[#5B4EE4]/10 px-2 py-0.5 rounded border border-[#5B4EE4]/20 font-black">
                  {filters.radiusKm} KM
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
                disabled={!targetLat}
              />
            </div>
          </div>

          {/* Right Panel: Google Map */}
          <div className="w-full md:w-[65%] lg:w-[70%] h-[300px] md:h-full bg-zinc-100 relative border-t md:border-t-0 md:border-l border-cardBorder overflow-hidden">
            {isLoaded ? (
              targetLat && targetLng ? (
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
                  <Marker
                    position={mapCenter}
                    icon={{
                      path: window.google.maps.SymbolPath.CIRCLE,
                      scale: 7,
                      fillColor: "#5B4EE4",
                      fillOpacity: 1,
                      strokeColor: "#ffffff",
                      strokeWeight: 2,
                    }}
                  />
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

                  {/* Visual Radius Indicator inside Map */}
                  <div className="absolute top-4 right-4 bg-surface/95 backdrop-blur-md px-3 py-2 rounded-xl shadow-[0_4px_15px_rgba(0,0,0,0.1)] border border-cardBorder flex items-center gap-2 z-[10] pointer-events-none">
                    <Crosshair size={14} className="text-[#5B4EE4]" />
                    <span className="text-xs font-black text-primaryText tracking-wide">
                      {filters.radiusKm} km Radius
                    </span>
                  </div>

                  {filteredListings.map((listing) => (
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
                          user
                            ? navigate(`/accommodations/view/${listing.id}`)
                            : null
                        }
                        onMouseEnter={() => setHoveredId(listing.id)}
                        onMouseLeave={() => setHoveredId(null)}
                        className="relative cursor-pointer group flex flex-col items-center justify-center transform -translate-x-1/2 -translate-y-full"
                      >
                        <div
                          className={`px-3 py-1.5 rounded-lg text-xs font-black shadow-lg border-2 transition-all flex items-center justify-center whitespace-nowrap ${
                            hoveredId === listing.id
                              ? "bg-zinc-900 text-white border-white scale-110 z-50"
                              : "bg-[#FF2E51] text-white border-white group-hover:scale-110 z-40"
                          }`}
                        >
                          {formatCurrency(listing.price_monthly_min)}
                        </div>
                        {/* Map Pin Notch */}
                        <div
                          className={`w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent transition-all ${
                            hoveredId === listing.id
                              ? "border-t-white scale-110 z-50"
                              : "border-t-white group-hover:scale-110 z-40"
                          }`}
                        ></div>
                        <div
                          className={`absolute bottom-[2px] w-0 h-0 border-l-[4px] border-r-[4px] border-t-[6px] border-l-transparent border-r-transparent transition-all ${
                            hoveredId === listing.id
                              ? "border-t-zinc-900 scale-110 z-50"
                              : "border-t-[#FF2E51] group-hover:scale-110 z-40"
                          }`}
                        ></div>
                      </div>
                    </OverlayView>
                  ))}
                </GoogleMap>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-mainBg text-tertiaryText">
                  <MapIcon size={48} className="opacity-20" />
                </div>
              )
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-tertiaryText bg-mainBg">
                <Loader2 size={32} className="animate-spin mb-2" />
                <span className="text-sm font-bold">Loading Map...</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABS & COLLAPSIBLE FILTERS */}
      {targetLat && targetLng && (
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-6 flex flex-col gap-4 w-full">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-cardBorder pb-4 w-full">
            <div className="w-full sm:w-auto max-w-full overflow-x-auto no-scrollbar pb-1 sm:pb-0">
              <div className="flex gap-1.5 bg-surface p-1.5 rounded-full border border-cardBorder shadow-sm w-max mx-auto sm:mx-0">
                {[
                  {
                    id: "pg",
                    label: "Premium PGs",
                    icon: <Building2 size={14} className="sm:w-4 sm:h-4" />,
                  },
                  {
                    id: "flat",
                    label: "Flats",
                    icon: <HomeIcon size={14} className="sm:w-4 sm:h-4" />,
                  },
                  {
                    id: "flatmate_spot",
                    label: "Flatmates",
                    icon: <Users size={14} className="sm:w-4 sm:h-4" />,
                  },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => {
                      setActiveTab(tab.id);
                      setFilters({
                        ...filters,
                        foodIncluded: "all",
                        bhk: "all",
                        furnishing: "all",
                      });
                    }}
                    className={`flex items-center justify-center gap-1.5 sm:gap-2 px-5 py-2 sm:px-6 sm:py-2.5 rounded-full text-[12px] sm:text-sm font-black transition-all whitespace-nowrap ${
                      activeTab === tab.id
                        ? "bg-[#5B4EE4] text-white shadow-md transform scale-100"
                        : "text-secondaryText hover:text-primaryText hover:bg-mainBg scale-95"
                    }`}
                  >
                    {tab.icon} {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all border shrink-0 w-full sm:w-auto ${
                isFilterOpen
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-md dark:bg-white dark:text-zinc-900"
                  : "bg-surface text-primaryText border-cardBorder hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm"
              }`}
            >
              {isFilterOpen ? (
                <X size={14} className="sm:w-4 sm:h-4" />
              ) : (
                <SlidersHorizontal size={14} className="sm:w-4 sm:h-4" />
              )}
              <span className="hidden md:inline">
                {isFilterOpen ? "Close Filters" : "Advanced Filters"}
              </span>
            </button>
          </div>

          {/* Filter Panel */}
          {isFilterOpen && (
            <>
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
                onClick={() => setIsFilterOpen(false)}
              ></div>

              <div className="fixed inset-x-0 bottom-0 z-[101] bg-surface rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full md:static md:z-auto md:bg-surface md:border md:border-cardBorder md:rounded-2xl md:p-6 md:shadow-sm md:animate-in md:slide-in-from-top-2 md:mt-2">
                <div className="flex items-center justify-between mb-5 border-b border-cardBorder pb-4">
                  <span className="text-[10px] font-black text-secondaryText uppercase tracking-widest flex items-center gap-2">
                    <SlidersHorizontal size={14} /> Refine your search results
                  </span>
                  <div className="flex items-center gap-4">
                    <button
                      onClick={clearFilters}
                      className="text-xs font-bold text-[#5B4EE4] hover:underline"
                    >
                      Reset All Filters
                    </button>
                    <button
                      onClick={() => setIsFilterOpen(false)}
                      className="md:hidden p-1.5 bg-mainBg border border-cardBorder rounded-full text-secondaryText active:scale-95 transition-transform"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Max Rent (Number Input) */}
                  <div className="flex flex-col gap-1.5 justify-center">
                    <label className="text-[10px] font-bold text-secondaryText uppercase tracking-wider pl-1">
                      Max Rent (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 15000"
                      value={filters.maxRent}
                      onChange={(e) =>
                        setFilters({ ...filters, maxRent: e.target.value })
                      }
                      className="w-full bg-mainBg border border-cardBorder rounded-xl px-4 py-3 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all"
                    />
                  </div>

                  <div className="relative flex flex-col gap-1.5 justify-center">
                    <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest pl-1">
                      Minimum Rating
                    </label>
                    <div className="relative w-full">
                      <select
                        value={filters.minRating}
                        onChange={(e) =>
                          setFilters({
                            ...filters,
                            minRating: Number(e.target.value),
                          })
                        }
                        className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                      >
                        <option value={0}>Any Rating</option>
                        <option value={4.5}>4.5+ Stars (Excellent)</option>
                        <option value={4}>4.0+ Stars (Very Good)</option>
                        <option value={3}>3.0+ Stars (Good)</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-[14px] text-tertiaryText pointer-events-none"
                      />
                    </div>
                  </div>

                  <div className="relative flex flex-col gap-1.5 justify-center">
                    <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest pl-1">
                      Gender Preference
                    </label>
                    <div className="relative w-full">
                      <select
                        value={filters.gender}
                        onChange={(e) =>
                          setFilters({ ...filters, gender: e.target.value })
                        }
                        className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                      >
                        <option value="all">Any</option>
                        <option value="male_only">Boys Only</option>
                        <option value="female_only">Girls Only</option>
                        <option value="any">Unisex</option>
                      </select>
                      <ChevronDown
                        size={16}
                        className="absolute right-4 top-[14px] text-tertiaryText pointer-events-none"
                      />
                    </div>
                  </div>

                  {activeTab === "pg" && (
                    <div className="relative flex flex-col gap-1.5 justify-center">
                      <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest pl-1">
                        Food Facility
                      </label>
                      <div className="relative w-full">
                        <select
                          value={filters.foodIncluded}
                          onChange={(e) =>
                            setFilters({
                              ...filters,
                              foodIncluded: e.target.value,
                            })
                          }
                          className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                        >
                          <option value="all">Any</option>
                          <option value="true">Food Included in Rent</option>
                          <option value="false">No Food Included</option>
                        </select>
                        <ChevronDown
                          size={16}
                          className="absolute right-4 top-[14px] text-tertiaryText pointer-events-none"
                        />
                      </div>
                    </div>
                  )}

                  {(activeTab === "flat" || activeTab === "flatmate_spot") && (
                    <>
                      <div className="relative flex flex-col gap-1.5 justify-center">
                        <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest pl-1">
                          Configuration
                        </label>
                        <div className="relative w-full">
                          <select
                            value={filters.bhk}
                            onChange={(e) =>
                              setFilters({ ...filters, bhk: e.target.value })
                            }
                            className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                          >
                            <option value="all">Any Configuration</option>
                            <option value="1 RK">1 RK</option>
                            <option value="1 BHK">1 BHK</option>
                            <option value="2 BHK">2 BHK</option>
                            <option value="3 BHK">3 BHK</option>
                            <option value="4 BHK">4 BHK</option>
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-4 top-[14px] text-tertiaryText pointer-events-none"
                          />
                        </div>
                      </div>

                      <div className="relative flex flex-col gap-1.5 justify-center">
                        <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest pl-1">
                          Furnishing Status
                        </label>
                        <div className="relative w-full">
                          <select
                            value={filters.furnishing}
                            onChange={(e) =>
                              setFilters({
                                ...filters,
                                furnishing: e.target.value,
                              })
                            }
                            className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                          >
                            <option value="all">Any Furnishing</option>
                            <option value="fully_furnished">
                              Fully Furnished
                            </option>
                            <option value="semi_furnished">
                              Semi Furnished
                            </option>
                            <option value="unfurnished">Unfurnished</option>
                          </select>
                          <ChevronDown
                            size={16}
                            className="absolute right-4 top-[14px] text-tertiaryText pointer-events-none"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 4. MAIN CATEGORIZED PROPERTY GRID */}
      {targetLat && targetLng && (
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-4 w-full flex-grow relative">
          {!user && (
            <div className="absolute inset-x-4 lg:inset-x-8 top-10 bottom-0 z-30 bg-surface/50 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-6 border border-cardBorder text-center shadow-2xl h-fit py-20">
              <Lock size={56} className="text-[#5B4EE4] mb-4 drop-shadow-md" />
              <h2 className="text-2xl sm:text-3xl font-black text-primaryText mb-3 drop-shadow-md">
                Unlock Map & Details
              </h2>
              <p className="text-sm sm:text-base text-primaryText font-bold mb-8 max-w-md drop-shadow-md">
                Join BachelorBase to instantly view contact details, real
                property images, exact pricing, and interact with the map pins
                in this area.
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
                  className="flex-1 bg-white text-zinc-900 dark:bg-zinc-900 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-800 border border-cardBorder py-3.5 rounded-xl font-black text-sm shadow-lg hover:bg-mainBg transition-colors"
                >
                  Register
                </button>
              </div>
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
              {[...Array(8)].map((_, i) => (
                <div
                  key={i}
                  className="bg-surface rounded-2xl border border-cardBorder shadow-sm flex flex-col overflow-hidden w-full h-[360px] animate-pulse"
                >
                  <div className="h-48 w-full bg-black/5 dark:bg-white/5"></div>
                  <div className="p-4 sm:p-5 flex flex-col flex-grow gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="h-5 w-2/3 bg-black/5 dark:bg-white/5 rounded-md"></div>
                      <div className="h-5 w-10 bg-black/5 dark:bg-white/5 rounded-md"></div>
                    </div>
                    <div className="h-4 w-1/2 bg-black/5 dark:bg-white/5 rounded-md mt-1"></div>
                    <div className="flex gap-2 mt-2">
                      <div className="h-6 w-16 bg-black/5 dark:bg-white/5 rounded-md"></div>
                      <div className="h-6 w-16 bg-black/5 dark:bg-white/5 rounded-md"></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-in zoom-in-95 duration-300">
              <div className="w-20 h-20 bg-surface border border-cardBorder rounded-full flex items-center justify-center mb-5 shadow-sm">
                <Search size={36} className="text-tertiaryText opacity-50" />
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-primaryText mb-2">
                No properties found here
              </h2>
              <p className="text-sm font-medium text-secondaryText max-w-sm mb-6">
                Try increasing your search radius or modifying your filters to
                see more results.
              </p>
              <button
                onClick={clearFilters}
                className="bg-[#5B4EE4] text-white px-8 py-3.5 rounded-xl font-black hover:bg-[#4b40ce] transition-colors shadow-md"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div
              className={`flex flex-col w-full ${
                !user ? "opacity-40 grayscale-[30%] pointer-events-none" : ""
              }`}
            >
              {/* GROUP 1: PRIME LOCATIONS */}
              {renderGridSection(
                groupedListings.prime,
                "Prime Locations",
                <MapPin size={18} className="text-emerald-500" />
              )}

              {/* GROUP 2: PREMIUM PROPERTIES */}
              {renderGridSection(
                groupedListings.premium,
                "Premium Properties",
                <BadgeCheck size={18} className="text-yellow-500" />
              )}

              {/* GROUP 3: VALUE PICKS */}
              {renderGridSection(
                groupedListings.value,
                "Value Picks",
                <ShieldCheck size={18} className="text-blue-500" />
              )}

              {/* GROUP 4: OTHER PROPERTIES */}
              {renderGridSection(
                groupedListings.other,
                "More Properties",
                <Building2 size={18} className="text-tertiaryText" />,
                true
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
