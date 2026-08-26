import React, { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { useLoadScript } from "@react-google-maps/api";
import {
  Search,
  Crosshair,
  MapPin,
  Building2,
  Users,
  Utensils,
  Home as HomeIcon,
  Heart,
  Star,
  ShieldCheck,
  BadgeCheck,
  Info,
  SlidersHorizontal,
  ChevronDown,
  X,
  Truck,
  Leaf,
  Loader2
} from "lucide-react";
import PhoneVerificationModal from "../../components/auth/PhoneVerificationModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const LIMIT = 12; // Items per infinite scroll chunk

// --- UNIFIED HELPERS ---
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

const renderGender = (pref) => {
  if (pref === "male_only")
    return <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase">Boys</span>;
  if (pref === "female_only")
    return <span className="bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase">Girls</span>;
  return <span className="bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase">Unisex</span>;
};

const renderOccupant = (type) => {
  if (type === "students") return "Students";
  if (type === "working_professionals") return "Professionals";
  return "Students • Professionals";
};

const renderSchemaBadge = (badge) => {
  if (badge === "black")
    return <div className="absolute top-2 right-2 bg-black/90 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1"><Star size={10} className="text-yellow-500 fill-yellow-500" /> Premium</div>;
  if (badge === "green")
    return <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1"><MapPin size={10} /> Prime Loc</div>;
  if (badge === "blue")
    return <div className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1"><ShieldCheck size={10} /> Value Pick</div>;
  return null;
};

const renderDietBadge = (dietType) => {
  if (dietType === "pure_veg")
    return <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Pure Veg</span>;
  if (dietType === "veg_nonveg_both")
    return <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Veg & Non-Veg</span>;
  return null;
};

const renderDeliveryBadge = (available, charges) => {
  if (!available) return <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase">Pickup Only</span>;
  if (charges === 0) return <span className="bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1"><Truck size={10} /> Free Delivery</span>;
  return <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1"><Truck size={10} /> Delivery Available</span>;
};

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "pg";

  // --- API & SEARCH STATES ---
  const [libraries] = useState(["places"]);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    version: "weekly",
  });
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const typingTimeoutRef = useRef(null);
  const searchContainerRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);

  // --- UI STATES ---
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toast, setToast] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // --- AUTH & FAVORITES ---
  const [savedFavorites, setSavedFavorites] = useState(new Set());
  const [animatingHeart, setAnimatingHeart] = useState(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // --- INFINITE SCROLL FEED STATES ---
  const [listings, setListings] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  // --- UNIFIED FILTER STATE ---
  const defaultFilters = {
    searchQuery: "",
    maxRent: 75000,
    maxTiffinPrice: 5000,
    minRating: 0,
    gender: "any",
    badge: "all",
    foodIncluded: "all",
    bhk: "all",
    furnishing: "all",
    diet: "all",
    jainRequired: false,
    delivery: "all",
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  // --- TOAST WRAPPER ---
  const showToast = (msg, type = "success", action = null) => {
    setToast({ msg, type, action });
    setTimeout(() => setToast(null), 3500);
  };

  // --- INITIALIZERS ---
  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase.from("hero_banners").select("*").eq("is_active", true).order("display_order", { ascending: true });
      if (data) setBanners(data);
    };
    const fetchUserFavorites = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("saved_favorites").select("listing_id, tiffin_id").eq("user_id", session.user.id);
      if (data) setSavedFavorites(new Set(data.map((item) => item.listing_id || item.tiffin_id)));
    };
    fetchBanners();
    fetchUserFavorites();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1)), 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  // --- DEBOUNCE FILTERS FOR DATABASE ---
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(handler);
  }, [filters]);

  // --- THE SUPER FEED ENGINE (Infinite Scroll Fetcher) ---
  const fetchFeedData = async (pageIndex, isNewSearch = false) => {
    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);

    try {
      let query;
      if (activeTab === "tiffin") {
        query = supabase.from("tiffin_services").select("*, tiffin_media(url, is_primary)").eq("status", "active");
        
        if (debouncedFilters.searchQuery) query = query.or(`provider_name.ilike.%${debouncedFilters.searchQuery}%,locality.ilike.%${debouncedFilters.searchQuery}%`);
        if (debouncedFilters.maxTiffinPrice < 5000) query = query.lte("price_monthly_min", debouncedFilters.maxTiffinPrice);
        if (debouncedFilters.minRating > 0) query = query.gte("rating_overall", debouncedFilters.minRating);
        if (debouncedFilters.diet !== "all") query = query.eq("food_type", debouncedFilters.diet);
        if (debouncedFilters.jainRequired) query = query.eq("jain_available", true);
        if (debouncedFilters.delivery === "free") query = query.eq("delivery_available", true).eq("delivery_charges", 0);
        if (debouncedFilters.delivery === "available") query = query.eq("delivery_available", true);
        if (debouncedFilters.delivery === "pickup") query = query.eq("delivery_available", false);
        
        query = query.order("created_at", { ascending: false });
      } else {
        query = supabase.from("pg_flat_listings").select("*, listing_media(url, is_primary), listing_amenities(*)").eq("status", "active").eq("listing_type", activeTab);
        
        if (debouncedFilters.searchQuery) query = query.or(`title.ilike.%${debouncedFilters.searchQuery}%,locality.ilike.%${debouncedFilters.searchQuery}%`);
        if (debouncedFilters.maxRent < 75000) query = query.lte("price_monthly_min", debouncedFilters.maxRent);
        if (debouncedFilters.minRating > 0) query = query.gte("rating_overall", debouncedFilters.minRating);
        if (debouncedFilters.gender !== "any") query = query.eq("gender_preference", debouncedFilters.gender);
        
        if (activeTab === "pg") {
          if (debouncedFilters.badge !== "all") query = query.eq("badge", debouncedFilters.badge);
        }
        if (activeTab === "flat" || activeTab === "flatmate_spot") {
          if (debouncedFilters.bhk !== "all") query = query.eq("bhk_type", debouncedFilters.bhk);
          if (debouncedFilters.furnishing !== "all") query = query.eq("furnishing_status", debouncedFilters.furnishing);
        }
        
        // Dynamic ordering for quality
        query = query.order("home_display_order", { ascending: true }).order("created_at", { ascending: false });
      }

      // Execute Chunk Request
      const from = pageIndex * LIMIT;
      const to = from + LIMIT - 1;
      const { data, error } = await query.range(from, to);

      if (error) throw error;

      // In-memory filter fallback for complex joins (foodIncluded in PG amenities array)
      let finalData = data || [];
      if (activeTab === "pg" && debouncedFilters.foodIncluded !== "all") {
        finalData = finalData.filter(item => {
          const am = Array.isArray(item.listing_amenities) ? item.listing_amenities[0] : item.listing_amenities;
          const isIncluded = am?.food_included === true;
          return debouncedFilters.foodIncluded === "true" ? isIncluded : !isIncluded;
        });
      }

      if (isNewSearch) {
        setListings(finalData);
        window.scrollTo({ top: 0, behavior: "smooth" });
      } else {
        setListings((prev) => [...prev, ...finalData]);
      }

      setHasMore((data || []).length === LIMIT);
    } catch (error) {
      console.error("Feed Fetch Error:", error);
      showToast("Error loading properties", "error");
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  // Reset feed when tab or filters change
  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchFeedData(0, true);
  }, [activeTab, debouncedFilters]);

  // Fetch next chunk when page increments
  useEffect(() => {
    if (page > 0) fetchFeedData(page, false);
  }, [page]);

  // Intersection Observer hook
  const lastElementRef = useCallback((node) => {
    if (loading || loadingMore) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && hasMore) {
        setPage((prev) => prev + 1);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, loadingMore, hasMore]);

  // --- ACTIONS & HANDLERS ---
  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId });
    setFilters(defaultFilters);
    setInputValue("");
  };

  const requireVerifiedPhone = async (actionCallback) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      sessionStorage.setItem("returnTo", location.pathname + location.search);
      showToast("Please login to save favorites", "error");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
    const { data: profile } = await supabase.from("users").select("is_phone_verified").eq("id", session.user.id).single();
    if (!profile?.is_phone_verified && !session.user.phone) {
      setPendingAction(() => actionCallback);
      setIsPhoneModalOpen(true);
      return;
    }
    actionCallback(session.user.id);
  };

  const handleFavoriteClick = async (e, id) => {
    e.preventDefault();
    e.stopPropagation();
    requireVerifiedPhone(async (userId) => {
      const isFav = savedFavorites.has(id);
      setAnimatingHeart(id);
      setTimeout(() => setAnimatingHeart(null), 300);

      const payloadMatch = activeTab === "tiffin" ? { user_id: userId, tiffin_id: id } : { user_id: userId, listing_id: id };

      if (isFav) {
        setSavedFavorites((prev) => { const n = new Set(prev); n.delete(id); return n; });
        await supabase.from("saved_favorites").delete().match(payloadMatch);
        showToast("Removed from favorites", "success");
      } else {
        setSavedFavorites((prev) => { const n = new Set(prev); n.add(id); return n; });
        await supabase.from("saved_favorites").insert(payloadMatch);
        showToast("Added to favorites!", "success", { label: "View", url: "/favorites" });
      }
    });
  };

  // Google Search Handlers
  const handleInputChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    setFilters({ ...filters, searchQuery: val });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!val) { setSuggestions([]); return; }
    typingTimeoutRef.current = setTimeout(async () => {
      if (window.google?.maps?.places?.AutocompleteSuggestion) {
        try {
          const res = await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions({ input: val, includedRegionCodes: ["in"] });
          if (res?.suggestions) setSuggestions(res.suggestions);
          else setSuggestions([]);
        } catch (err) {}
      }
    }, 300);
  };

  const handleSelect = async (suggestion) => {
    const txt = suggestion.placePrediction.text.text;
    setInputValue(txt);
    setFilters({ ...filters, searchQuery: txt });
    setSuggestions([]);
  };

  return (
    <div className="w-full min-h-screen bg-mainBg flex flex-col pb-16 overflow-hidden relative">
      <PhoneVerificationModal isOpen={isPhoneModalOpen} onClose={() => setIsPhoneModalOpen(false)} onSuccess={() => { setIsPhoneModalOpen(false); if (pendingAction) pendingAction(); }} />

      {toast && (
        <div className={`fixed bottom-10 left-1/2 -translate-x-1/2 z-[500] border shadow-2xl px-6 py-3.5 rounded-full flex items-center gap-2.5 max-w-[90vw] whitespace-nowrap overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 ease-out ${toast.type === "error" ? "bg-red-50 text-red-600 border-red-200" : "bg-emerald-50 border-emerald-200 text-emerald-600"}`}>
          <Info size={18} className="shrink-0" />
          <span className="text-sm font-black tracking-wide truncate">{toast.msg}</span>
          {toast.action && <Link to={toast.action.url} className="ml-2 text-xs font-black underline shrink-0 hover:opacity-80">{toast.action.label}</Link>}
        </div>
      )}

      {/* 1. HERO BANNERS */}
      <section className="relative w-full max-w-[1440px] mx-auto px-4 lg:px-8 mt-3 md:mt-4 mb-4 flex flex-col">
        <div className="relative w-full h-[280px] sm:h-[380px] md:h-auto md:aspect-[16/9] lg:aspect-[21/9] max-h-[450px] rounded-2xl md:rounded-3xl overflow-hidden bg-zinc-900 border border-cardBorder shadow-sm">
          {banners.length > 0 && banners.map((banner, index) => {
            const imgSource = banner.image_url.startsWith("http") ? banner.image_url : `${API_BASE}${banner.image_url}`;
            return (
              <div key={banner.id} className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${index === currentSlide ? "opacity-100 z-10" : "opacity-0 z-0"}`}>
                <img src={imgSource} alt={banner.title || "Banner"} className="absolute inset-0 w-full h-full object-cover z-0" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10 pointer-events-none"></div>
                <div className="absolute bottom-6 left-4 md:bottom-10 md:left-10 z-20 pr-6 flex flex-col gap-1.5 pointer-events-none">
                  {banner.title && <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-lg leading-tight">{banner.title}</h1>}
                  {banner.subtitle && <p className="text-gray-200 text-xs sm:text-sm font-medium max-w-xl drop-shadow-md line-clamp-2">{banner.subtitle}</p>}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 2. THE STICKY APP HEADER (Search, Filters, Tabs) */}
      <div className="sticky top-[56px] md:top-[64px] lg:top-[72px] z-40 bg-surface/95 backdrop-blur-xl border-b border-cardBorder shadow-sm transition-all pb-1 pt-3">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex flex-col gap-3">
          
          {/* Universal Search & Filter Bar */}
          <div className="flex items-center gap-2 w-full max-w-4xl mx-auto">
            <div className="relative flex-grow" ref={searchContainerRef}>
              <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiaryText" />
              <input
                type="text"
                placeholder={activeTab === "tiffin" ? "Search specific tiffins or areas..." : "Search properties, societies, localities..."}
                value={inputValue}
                onChange={handleInputChange}
                className="w-full bg-mainBg border border-cardBorder rounded-full pl-10 pr-4 py-2.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all"
              />
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-2 w-full bg-surface border border-cardBorder rounded-xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-64 overflow-y-auto">
                  {suggestions.map((suggestion) => (
                    <button key={suggestion.placePrediction.placeId} onClick={() => handleSelect(suggestion)} className="flex items-start gap-3 w-full px-4 py-3 text-left hover:bg-mainBg border-b border-cardBorder group">
                      <MapPin size={16} className="text-tertiaryText shrink-0 mt-0.5 group-hover:text-accentBlue" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-primaryText leading-snug">{suggestion.placePrediction.mainText.text}</span>
                        {suggestion.placePrediction.secondaryText && <span className="text-[11px] text-secondaryText font-medium mt-0.5 leading-tight">{suggestion.placePrediction.secondaryText.text}</span>}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-center gap-2 px-3 sm:px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border shrink-0 ${isFilterOpen ? "bg-zinc-900 text-white border-zinc-900 shadow-md dark:bg-white dark:text-zinc-900" : "bg-mainBg text-primaryText border-cardBorder hover:bg-zinc-100 shadow-sm"}`}
            >
              {isFilterOpen ? <X size={16} /> : <SlidersHorizontal size={16} />}
              <span className="hidden sm:inline">{isFilterOpen ? "Close" : "Filters"}</span>
            </button>
          </div>

          {/* Prominent App Pills (Tabs) */}
          <div className="flex gap-2 sm:gap-3 overflow-x-auto no-scrollbar max-w-4xl mx-auto w-full px-1 pb-2 mask-edges">
            {[
              { id: "pg", icon: <Building2 size={16} />, label: "PGs" },
              { id: "flat", icon: <HomeIcon size={16} />, label: "Flats" },
              { id: "flatmate_spot", icon: <Users size={16} />, label: "Flatmates" },
              { id: "tiffin", icon: <Utensils size={16} />, label: "Tiffins" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-2xl whitespace-nowrap font-black text-xs sm:text-sm transition-all duration-300 active:scale-95 ${
                  activeTab === tab.id
                    ? "bg-[#5B4EE4] text-white shadow-lg shadow-[#5B4EE4]/30"
                    : "bg-mainBg border border-cardBorder text-secondaryText hover:text-primaryText hover:bg-zinc-100 dark:hover:bg-zinc-800"
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* 3. DYNAMIC FILTER DRAWER */}
        {isFilterOpen && (
          <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pb-4 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-mainBg border border-cardBorder rounded-2xl p-4 sm:p-5 shadow-inner mt-2 max-w-4xl mx-auto flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-cardBorder pb-3">
                <span className="text-[10px] font-black text-secondaryText uppercase tracking-widest">Refine Options</span>
                <button onClick={() => setFilters(defaultFilters)} className="text-[10px] font-black text-[#5B4EE4] uppercase hover:underline">Reset</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {/* Dynamic Price Slider */}
                <div className="flex flex-col bg-surface border border-cardBorder p-3 rounded-xl shadow-sm">
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[10px] font-bold text-secondaryText uppercase">Max Budget</label>
                    <span className="text-[10px] font-black text-[#5B4EE4] bg-[#5B4EE4]/10 px-1.5 py-0.5 rounded">
                      {activeTab === "tiffin" 
                        ? (filters.maxTiffinPrice >= 5000 ? "Any" : `₹${filters.maxTiffinPrice}`)
                        : (filters.maxRent >= 75000 ? "Any" : `₹${filters.maxRent}`)}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={activeTab === "tiffin" ? "1500" : "5000"}
                    max={activeTab === "tiffin" ? "5000" : "75000"}
                    step={activeTab === "tiffin" ? "100" : "1000"}
                    value={activeTab === "tiffin" ? filters.maxTiffinPrice : filters.maxRent}
                    onChange={(e) => activeTab === "tiffin" ? setFilters({...filters, maxTiffinPrice: parseInt(e.target.value)}) : setFilters({...filters, maxRent: parseInt(e.target.value)})}
                    className="w-full accent-[#5B4EE4] h-1.5 bg-cardBorder rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                {/* Common Rating */}
                <div className="relative">
                  <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1 pl-1">Min Rating</label>
                  <select value={filters.minRating} onChange={(e) => setFilters({...filters, minRating: Number(e.target.value)})} className="w-full bg-surface border border-cardBorder rounded-xl px-3 py-2.5 text-xs font-bold text-primaryText outline-none shadow-sm appearance-none">
                    <option value={0}>Any Rating</option>
                    <option value={4.5}>4.5+ (Excellent)</option>
                    <option value={4}>4.0+ (Good)</option>
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-[26px] text-tertiaryText pointer-events-none" />
                </div>

                {/* Conditional Fields based on Tab */}
                {activeTab !== "tiffin" && (
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1 pl-1">Gender</label>
                    <select value={filters.gender} onChange={(e) => setFilters({...filters, gender: e.target.value})} className="w-full bg-surface border border-cardBorder rounded-xl px-3 py-2.5 text-xs font-bold text-primaryText outline-none shadow-sm appearance-none">
                      <option value="any">Unisex / Any</option>
                      <option value="male_only">Boys Only</option>
                      <option value="female_only">Girls Only</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-[26px] text-tertiaryText pointer-events-none" />
                  </div>
                )}

                {activeTab === "pg" && (
                  <>
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1 pl-1">Property Class</label>
                      <select value={filters.badge} onChange={(e) => setFilters({...filters, badge: e.target.value})} className="w-full bg-surface border border-cardBorder rounded-xl px-3 py-2.5 text-xs font-bold text-primaryText outline-none shadow-sm appearance-none">
                        <option value="all">Any Class</option>
                        <option value="black">Premium (Black)</option>
                        <option value="green">Prime Loc (Green)</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-[26px] text-tertiaryText pointer-events-none" />
                    </div>
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1 pl-1">Food</label>
                      <select value={filters.foodIncluded} onChange={(e) => setFilters({...filters, foodIncluded: e.target.value})} className="w-full bg-surface border border-cardBorder rounded-xl px-3 py-2.5 text-xs font-bold text-primaryText outline-none shadow-sm appearance-none">
                        <option value="all">Any</option>
                        <option value="true">Food Included</option>
                        <option value="false">No Food Included</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-[26px] text-tertiaryText pointer-events-none" />
                    </div>
                  </>
                )}

                {(activeTab === "flat" || activeTab === "flatmate_spot") && (
                  <>
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1 pl-1">BHK</label>
                      <select value={filters.bhk} onChange={(e) => setFilters({...filters, bhk: e.target.value})} className="w-full bg-surface border border-cardBorder rounded-xl px-3 py-2.5 text-xs font-bold text-primaryText outline-none shadow-sm appearance-none">
                        <option value="all">Any</option>
                        <option value="1 RK">1 RK</option>
                        <option value="1 BHK">1 BHK</option>
                        <option value="2 BHK">2 BHK</option>
                        <option value="3 BHK">3 BHK</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-[26px] text-tertiaryText pointer-events-none" />
                    </div>
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1 pl-1">Furnishing</label>
                      <select value={filters.furnishing} onChange={(e) => setFilters({...filters, furnishing: e.target.value})} className="w-full bg-surface border border-cardBorder rounded-xl px-3 py-2.5 text-xs font-bold text-primaryText outline-none shadow-sm appearance-none">
                        <option value="all">Any</option>
                        <option value="fully_furnished">Fully Furnished</option>
                        <option value="semi_furnished">Semi Furnished</option>
                        <option value="unfurnished">Unfurnished</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-[26px] text-tertiaryText pointer-events-none" />
                    </div>
                  </>
                )}

                {activeTab === "tiffin" && (
                  <>
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1 pl-1">Diet</label>
                      <select value={filters.diet} onChange={(e) => setFilters({...filters, diet: e.target.value})} className="w-full bg-surface border border-cardBorder rounded-xl px-3 py-2.5 text-xs font-bold text-primaryText outline-none shadow-sm appearance-none">
                        <option value="all">Any</option>
                        <option value="pure_veg">Pure Veg</option>
                        <option value="veg_nonveg_both">Veg & Non-Veg</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-[26px] text-tertiaryText pointer-events-none" />
                    </div>
                    <div className="relative">
                      <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1 pl-1">Delivery</label>
                      <select value={filters.delivery} onChange={(e) => setFilters({...filters, delivery: e.target.value})} className="w-full bg-surface border border-cardBorder rounded-xl px-3 py-2.5 text-xs font-bold text-primaryText outline-none shadow-sm appearance-none">
                        <option value="all">Any</option>
                        <option value="free">Free Delivery</option>
                        <option value="pickup">Pickup Only</option>
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-[26px] text-tertiaryText pointer-events-none" />
                    </div>
                    <div className="flex items-center bg-surface border border-cardBorder p-3 rounded-xl cursor-pointer" onClick={() => setFilters({...filters, jainRequired: !filters.jainRequired})}>
                      <input type="checkbox" checked={filters.jainRequired} readOnly className="w-4 h-4 rounded text-[#5B4EE4]" />
                      <span className="ml-2 text-xs font-bold text-primaryText">Jain Food Available</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN SUPER FEED GRID */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 pt-6 pb-2 w-full flex-grow">
        
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="bg-surface rounded-2xl border border-cardBorder h-[360px] animate-pulse overflow-hidden"><div className="h-48 bg-black/5 dark:bg-white/5"></div></div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-surface border border-cardBorder rounded-full flex items-center justify-center mb-5 shadow-sm">
              <Search size={36} className="text-tertiaryText opacity-50" />
            </div>
            <h2 className="text-xl font-black text-primaryText mb-2">No results found in this category</h2>
            <p className="text-sm text-secondaryText mb-6 max-w-sm">Try adjusting your filters or search terms.</p>
            <button onClick={() => setFilters(defaultFilters)} className="bg-[#5B4EE4] text-white px-8 py-3 rounded-xl font-black shadow-md">Clear Filters</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {listings.map((item, index) => {
              const isLastItem = index === listings.length - 1;
              const isTiffin = activeTab === "tiffin";
              const primaryMedia = isTiffin ? (item.tiffin_media?.find(m => m.is_primary) || item.tiffin_media?.[0]) : (item.listing_media?.find(m => m.is_primary) || item.listing_media?.[0]);
              const coverImg = primaryMedia ? (primaryMedia.url.startsWith("http") ? primaryMedia.url : `${API_BASE}${primaryMedia.url}`) : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80";
              const title = isTiffin ? item.provider_name : item.title;
              const linkUrl = isTiffin ? `/tiffins/view/${item.id}` : `/accommodations/view/${item.id}`;
              const isFav = savedFavorites.has(item.id);
              const isAnimating = animatingHeart === item.id;

              return (
                <div
                  key={item.id}
                  ref={isLastItem ? lastElementRef : null}
                  onClick={() => navigate(linkUrl)}
                  className="bg-surface rounded-2xl border border-cardBorder shadow-sm flex flex-col group overflow-hidden hover:shadow-xl hover:border-[#5B4EE4]/50 transition-all duration-300 cursor-pointer relative"
                >
                  {/* Card Image */}
                  <div className="relative h-48 w-full bg-mainBg overflow-hidden shrink-0">
                    <img src={coverImg} alt="Cover" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {!isTiffin && item.badge && renderSchemaBadge(item.badge)}

                    <button
                      onClick={(e) => handleFavoriteClick(e, item.id)}
                      className="absolute top-3 left-3 bg-black/40 backdrop-blur-md hover:bg-black/60 p-2 rounded-full transition-colors border border-white/20 shadow-sm z-20 group/btn"
                    >
                      <Heart size={16} className={`transition-transform duration-300 ease-out ${isAnimating ? "scale-[1.7]" : "scale-100"} ${isFav ? "text-pink-500 fill-pink-500 group-hover/btn:scale-110" : "text-white"}`} />
                    </button>
                  </div>

                  {/* Card Content */}
                  <div className="p-4 sm:p-5 flex flex-col flex-grow gap-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-base text-primaryText leading-tight line-clamp-1">{title}</h3>
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[10px] text-amber-600 font-black shrink-0 shadow-sm">
                        <Star size={10} className="fill-amber-500 text-amber-500" /> {Number(item.rating_overall) > 0 ? item.rating_overall : "New"}
                      </div>
                    </div>

                    <p className="text-[11px] font-bold text-secondaryText flex items-center gap-1.5 truncate">
                      <MapPin size={12} className="shrink-0 text-tertiaryText" /> {item.locality}, {item.city}
                    </p>

                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {!isTiffin && renderGender(item.gender_preference)}
                        {activeTab === "flat" && <span className="bg-mainBg border border-cardBorder text-primaryText px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">{item.bhk_type}</span>}
                        {activeTab === "pg" && <span className="bg-mainBg border border-cardBorder text-tertiaryText px-2 py-0.5 rounded text-[10px] font-black tracking-wide">{renderOccupant(item.occupant_type)}</span>}
                        
                        {isTiffin && renderDietBadge(item.food_type)}
                        {isTiffin && item.jain_available && <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1"><Leaf size={10} /> Jain</span>}
                      </div>
                      
                      {activeTab === "flatmate_spot" && (
                        <div className="flex items-center gap-1 bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider w-fit">
                          <Users size={12} className="inline mr-1 -mt-0.5" /> {item.current_occupants_count} Living Here
                        </div>
                      )}
                      {isTiffin && <div className="flex flex-wrap items-center gap-2">{renderDeliveryBadge(item.delivery_available, item.delivery_charges)}</div>}
                    </div>

                    <div className="mt-auto pt-3 border-t border-cardBorder flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-tertiaryText uppercase tracking-widest">
                          {isTiffin ? (item.price_monthly_min ? "Monthly From" : "Per Meal") : "Monthly Rent"}
                        </span>
                        <div className="text-base sm:text-lg font-black text-primaryText leading-none mt-0.5">
                          {isTiffin ? (item.price_monthly_min ? formatCurrency(item.price_monthly_min) : formatCurrency(item.price_per_meal_min)) : formatCurrency(item.price_monthly_min)}
                          <span className="text-[10px] font-bold text-secondaryText ml-0.5">/{isTiffin && !item.price_monthly_min ? "meal" : "mo"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Loading More Indicator */}
        {loadingMore && (
          <div className="w-full flex justify-center py-6">
            <Loader2 className="animate-spin text-[#5B4EE4]" size={24} />
          </div>
        )}
      </div>
    </div>
  );
}