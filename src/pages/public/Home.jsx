import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  useSearchParams,
  useNavigate,
  Link,
  useLocation,
} from "react-router-dom";
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
  Loader2,
  ArrowUp,
  Compass,
  Ticket,
  Calendar,
  IndianRupee,
  ArrowRight,
  Map as MapIcon,
  ImageOff,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import PhoneVerificationModal from "../../components/auth/PhoneVerificationModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const LIMIT = 12;

// --- UNIFIED HELPERS ---
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

const getImageUrl = (url) => {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_BASE}${url}`;
};

const formatDate = (dateString) => {
  if (!dateString) return "TBD";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const renderGender = (pref) => {
  if (pref === "male_only")
    return (
      <span className="bg-blue-50 text-blue-600 border border-blue-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase">
        Boys
      </span>
    );
  if (pref === "female_only")
    return (
      <span className="bg-pink-50 text-pink-600 border border-pink-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase">
        Girls
      </span>
    );
  return (
    <span className="bg-purple-50 text-purple-600 border border-purple-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase">
      Unisex
    </span>
  );
};

const renderOccupant = (type) => {
  if (type === "students") return "Students";
  if (type === "working_professionals") return "Professionals";
  return "Students • Professionals";
};

const renderVerticalBadges = (badges) => {
  if (!badges || !Array.isArray(badges) || badges.length === 0) return null;
  return (
    <div className="absolute bottom-3 left-3 bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 p-1 rounded-full flex flex-col gap-1.5 z-20 shadow-[0_8px_16px_rgba(0,0,0,0.2)]">
      {badges.includes("black") && (
        <div
          className="w-7 h-7 bg-black/90 rounded-full flex items-center justify-center shadow-sm"
          title="Premium Property"
        >
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
        </div>
      )}
      {badges.includes("green") && (
        <div
          className="w-7 h-7 bg-emerald-500/95 rounded-full flex items-center justify-center shadow-sm"
          title="Prime Location"
        >
          <MapPin size={14} className="text-white" />
        </div>
      )}
      {badges.includes("blue") && (
        <div
          className="w-7 h-7 bg-blue-500/95 rounded-full flex items-center justify-center shadow-sm"
          title="Value Pick"
        >
          <ShieldCheck size={14} className="text-white" />
        </div>
      )}
    </div>
  );
};

const renderDietBadge = (dietType) => {
  if (dietType === "pure_veg")
    return (
      <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Pure
        Veg
      </span>
    );
  if (dietType === "veg_nonveg_both")
    return (
      <span className="bg-red-50 text-red-600 border border-red-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Veg &
        Non-Veg
      </span>
    );
  return null;
};

const renderDeliveryBadge = (available, charges) => {
  if (!available)
    return (
      <span className="bg-zinc-100 text-zinc-600 border border-zinc-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase">
        Pickup Only
      </span>
    );
  if (charges === 0)
    return (
      <span className="bg-sky-50 text-sky-600 border border-sky-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
        <Truck size={10} /> Free Delivery
      </span>
    );
  return (
    <span className="bg-orange-50 text-orange-600 border border-orange-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
      <Truck size={10} /> Delivery Available
    </span>
  );
};

// --- APP TABS CONFIGURATION ---
const APP_TABS = [
  { id: "pg", icon: <Building2 size={18} />, label: "PGs", color: "blue" },
  {
    id: "flat",
    icon: <HomeIcon size={18} />,
    label: "Flats",
    color: "emerald",
  },
  {
    id: "tiffin",
    icon: <Utensils size={18} />,
    label: "Tiffins",
    color: "orange",
  },
  { id: "fun", icon: <Compass size={18} />, label: "Fun", color: "pink" },
  {
    id: "offers",
    icon: <BadgeCheck size={18} />,
    label: "Offers",
    color: "violet",
  },
  {
    id: "institutes",
    icon: <GraduationCap size={18} />,
    label: "Institutes",
    color: "indigo",
  },
];

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "pg";

  const [libraries] = useState(["places"]);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    version: "weekly",
  });

  const [locationInput, setLocationInput] = useState("");
  const [locationSuggestions, setLocationSuggestions] = useState([]);
  const typingTimeoutRef = useRef(null);
  const locationSearchContainerRef = useRef(null);
  const [isLocating, setIsLocating] = useState(false);

  // UI STATES
  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [toast, setToast] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  // AUTH & FAVORITES
  const [savedFavorites, setSavedFavorites] = useState(new Set());
  const [animatingHeart, setAnimatingHeart] = useState(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // INFINITE SCROLL STATES
  const [listings, setListings] = useState([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef();

  // RACE CONDITION LOCK
  const fetchIdRef = useRef(0);

  // FILTERS
  const defaultFilters = {
    searchQuery: "",
    maxRent: 75000,
    maxTiffinPrice: 5000,
    minRating: 0,
    gender: "any",
    badges: [],
    showOnlyFlatmates: false,
    foodIncluded: "all",
    bhk: "all",
    furnishing: "all",
    diet: "all",
    jainRequired: false,
    delivery: "all",
    funType: "all",
  };
  const [filters, setFilters] = useState(defaultFilters);
  const [debouncedFilters, setDebouncedFilters] = useState(filters);

  const showToast = (msg, type = "success", action = null) => {
    setToast({ msg, type, action });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchBanners = async () => {
      const { data } = await supabase
        .from("hero_banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (data) setBanners(data);
    };
    const fetchUserFavorites = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("saved_favorites")
        .select("listing_id, tiffin_id")
        .eq("user_id", session.user.id);
      if (data)
        setSavedFavorites(
          new Set(data.map((item) => item.listing_id || item.tiffin_id))
        );
    };
    fetchBanners();
    fetchUserFavorites();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(
      () =>
        setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1)),
      5000
    );
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const handleScroll = () => setShowScrollTop(window.scrollY > 400);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedFilters(filters), 400);
    return () => clearTimeout(handler);
  }, [filters]);

  // --- THE SUPER FEED ENGINE ---
  const fetchFeedData = async (pageIndex, isNewSearch = false) => {
    const fetchId = ++fetchIdRef.current;

    if (isNewSearch) setLoading(true);
    else setLoadingMore(true);

    try {
      let query;
      let finalData = [];
      const from = pageIndex * LIMIT;
      const to = from + LIMIT - 1;

      // 1. TIFFIN LOGIC
      if (activeTab === "tiffin") {
        query = supabase
          .from("tiffin_services")
          .select("*, tiffin_media(url, is_primary)")
          .eq("status", "active");
        if (debouncedFilters.searchQuery)
          query = query.or(
            `provider_name.ilike.%${debouncedFilters.searchQuery}%,locality.ilike.%${debouncedFilters.searchQuery}%`
          );
        if (debouncedFilters.maxTiffinPrice < 5000)
          query = query.lte(
            "price_monthly_min",
            debouncedFilters.maxTiffinPrice
          );
        if (debouncedFilters.minRating > 0)
          query = query.gte("rating_overall", debouncedFilters.minRating);
        if (debouncedFilters.diet !== "all")
          query = query.eq("food_type", debouncedFilters.diet);
        if (debouncedFilters.jainRequired)
          query = query.eq("jain_available", true);
        if (debouncedFilters.delivery === "free")
          query = query
            .eq("delivery_available", true)
            .eq("delivery_charges", 0);
        if (debouncedFilters.delivery === "available")
          query = query.eq("delivery_available", true);
        if (debouncedFilters.delivery === "pickup")
          query = query.eq("delivery_available", false);

        query = query.order("created_at", { ascending: false });
        const { data, error } = await query.range(from, to);
        if (error) throw error;
        finalData = data || [];

        // 2. FUN LOGIC (EVENTS & TRIPS)
      } else if (activeTab === "fun") {
        query = supabase
          .from("events_and_trips")
          .select("*")
          .eq("status", "active");

        if (debouncedFilters.searchQuery) {
          query = query.or(
            `title.ilike.%${debouncedFilters.searchQuery}%,location_city.ilike.%${debouncedFilters.searchQuery}%,category.ilike.%${debouncedFilters.searchQuery}%`
          );
        }
        if (debouncedFilters.funType !== "all") {
          query = query.eq("listing_class", debouncedFilters.funType);
        }

        query = query.order("created_at", { ascending: false });
        const { data, error } = await query.range(from, to);
        if (error) throw error;
        finalData = data || [];

        // 3. OFFERS LOGIC
      } else if (activeTab === "offers") {
        query = supabase
          .from("local_offers")
          .select("*")
          .eq("status", "active");
        if (debouncedFilters.searchQuery) {
          query = query.or(
            `offer_headline.ilike.%${debouncedFilters.searchQuery}%,business_name.ilike.%${debouncedFilters.searchQuery}%`
          );
        }
        query = query.order("created_at", { ascending: false });
        const { data, error } = await query.range(from, to);
        if (error) throw error;
        finalData = data || [];

        // 4. INSTITUTES LOGIC
      } else if (activeTab === "institutes") {
        query = supabase
          .from("institutes_directory")
          .select("*")
          .eq("status", "active");
        if (debouncedFilters.searchQuery) {
          query = query.or(
            `institute_name.ilike.%${debouncedFilters.searchQuery}%,category.ilike.%${debouncedFilters.searchQuery}%,city.ilike.%${debouncedFilters.searchQuery}%`
          );
        }
        query = query.order("created_at", { ascending: false });
        const { data, error } = await query.range(from, to);
        if (error) throw error;
        finalData = data || [];

        // 5. ACCOMMODATION LOGIC (PGs & FLATS)
      } else {
        query = supabase
          .from("pg_flat_listings")
          .select("*, listing_media(url, is_primary), listing_amenities(*)")
          .eq("status", "active");

        if (activeTab === "flat") {
          if (debouncedFilters.showOnlyFlatmates)
            query = query.eq("listing_type", "flatmate_spot");
          else query = query.in("listing_type", ["flat", "flatmate_spot"]);
        } else {
          query = query.eq("listing_type", activeTab);
        }

        if (debouncedFilters.searchQuery)
          query = query.or(
            `title.ilike.%${debouncedFilters.searchQuery}%,locality.ilike.%${debouncedFilters.searchQuery}%`
          );
        if (debouncedFilters.maxRent < 75000)
          query = query.lte("price_monthly_min", debouncedFilters.maxRent);
        if (debouncedFilters.minRating > 0)
          query = query.gte("rating_overall", debouncedFilters.minRating);
        if (debouncedFilters.gender !== "any")
          query = query.eq("gender_preference", debouncedFilters.gender);
        if (activeTab === "pg" && debouncedFilters.badges.length > 0)
          query = query.overlaps("badges", debouncedFilters.badges);
        if (activeTab === "flat" || activeTab === "flatmate_spot") {
          if (debouncedFilters.bhk !== "all")
            query = query.eq("bhk_type", debouncedFilters.bhk);
          if (debouncedFilters.furnishing !== "all")
            query = query.eq("furnishing_status", debouncedFilters.furnishing);
        }

        query = query
          .order("home_display_order", { ascending: true })
          .order("created_at", { ascending: false });
        const { data, error } = await query.range(from, to);
        if (error) throw error;

        finalData = data || [];
        if (activeTab === "pg" && debouncedFilters.foodIncluded !== "all") {
          finalData = finalData.filter((item) => {
            const am = Array.isArray(item.listing_amenities)
              ? item.listing_amenities[0]
              : item.listing_amenities;
            const isIncluded = am?.food_included === true;
            return debouncedFilters.foodIncluded === "true"
              ? isIncluded
              : !isIncluded;
          });
        }
      }

      if (fetchId !== fetchIdRef.current) return;

      if (isNewSearch) {
        setListings(finalData);
        if (pageIndex === 0) window.scrollTo({ top: 350, behavior: "smooth" });
      } else {
        setListings((prev) => [...prev, ...finalData]);
      }
      setHasMore(finalData.length === LIMIT);
    } catch (error) {
      console.error("Feed Fetch Error:", error);
    } finally {
      if (fetchId === fetchIdRef.current) {
        setLoading(false);
        setLoadingMore(false);
      }
    }
  };

  useEffect(() => {
    setPage(0);
    setHasMore(true);
    fetchFeedData(0, true);
  }, [activeTab, debouncedFilters]);

  useEffect(() => {
    if (page > 0) fetchFeedData(page, false);
  }, [page]);

  const lastElementRef = useCallback(
    (node) => {
      if (loading || loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) setPage((prev) => prev + 1);
      });
      if (node) observer.current.observe(node);
    },
    [loading, loadingMore, hasMore]
  );

  const handleTabChange = (tabId) => {
    setSearchParams({ tab: tabId }, { replace: true });
    setFilters(defaultFilters);
    setDebouncedFilters(defaultFilters);
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
    if (!profile?.is_phone_verified && !session.user.phone) {
      setPendingAction(() => () => actionCallback(session.user.id));
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

      let payloadMatch = {};
      if (activeTab === "tiffin")
        payloadMatch = { user_id: userId, tiffin_id: id };
      else if (
        activeTab === "fun" ||
        activeTab === "offers" ||
        activeTab === "institutes"
      )
        return;
      else payloadMatch = { user_id: userId, listing_id: id };

      if (isFav) {
        setSavedFavorites((prev) => {
          const n = new Set(prev);
          n.delete(id);
          return n;
        });
        await supabase.from("saved_favorites").delete().match(payloadMatch);
        showToast("Removed from favorites", "success");
      } else {
        setSavedFavorites((prev) => {
          const n = new Set(prev);
          n.add(id);
          return n;
        });
        await supabase.from("saved_favorites").insert(payloadMatch);
        showToast("Added to favorites!", "success", {
          label: "View",
          url: "/favorites",
        });
      }
    });
  };

  // --- LOCATION SEARCH LOGIC ---
  const handleLocationInputChange = (e) => {
    const val = e.target.value;
    setLocationInput(val);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (!val) {
      setLocationSuggestions([]);
      return;
    }
    typingTimeoutRef.current = setTimeout(async () => {
      if (window.google?.maps?.places?.AutocompleteSuggestion) {
        try {
          const res =
            await window.google.maps.places.AutocompleteSuggestion.fetchAutocompleteSuggestions(
              { input: val, includedRegionCodes: ["in"] }
            );
          if (res?.suggestions) setLocationSuggestions(res.suggestions);
          else setLocationSuggestions([]);
        } catch (err) {}
      }
    }, 300);
  };

  const handleLocationSelect = async (suggestion) => {
    const txt = suggestion.placePrediction.text.text;
    setLocationInput(txt);
    setLocationSuggestions([]);
    try {
      const place = suggestion.placePrediction.toPlace();
      await place.fetchFields({ fields: ["location"] });
      navigate(
        `/location-search?lat=${place.location.lat()}&lng=${place.location.lng()}&source=search`
      );
    } catch (error) {}
  };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        locationSearchContainerRef.current &&
        !locationSearchContainerRef.current.contains(e.target)
      )
        setLocationSuggestions([]);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleUseCurrentLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          navigate(
            `/location-search?lat=${position.coords.latitude}&lng=${position.coords.longitude}&source=gps`
          );
        },
        () => {
          alert("Please allow location access.");
          setIsLocating(false);
        }
      );
    } else alert("Geolocation is not supported.");
  };

  const handleLocationSearchSubmit = () => {
    if (locationInput.trim() !== "")
      navigate(`/location-search?q=${encodeURIComponent(locationInput)}`);
  };

  useEffect(() => {
    if (isFilterOpen) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isFilterOpen]);

  return (
    <div className="w-full min-h-screen bg-mainBg flex flex-col overflow-hidden relative pb-10">
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onSuccess={() => {
          setIsPhoneModalOpen(false);
          if (pendingAction) pendingAction();
        }}
      />

      <button
        onClick={scrollToTop}
        className={`fixed z-[90] right-4 lg:right-8 bottom-24 lg:bottom-10 bg-[#5B4EE4] hover:bg-[#4b40ce] text-white p-3.5 rounded-full shadow-[0_8px_20px_rgba(91,78,228,0.4)] transition-all duration-300 transform ${
          showScrollTop
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-12 opacity-0 scale-50 pointer-events-none"
        }`}
      >
        <ArrowUp size={22} strokeWidth={3} />
      </button>

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

      {/* HERO BANNERS */}
      <section className="relative w-full max-w-[1440px] mx-auto px-4 lg:px-8 mt-3 md:mt-4 mb-24 md:mb-16 flex flex-col">
        <div className="relative w-full h-[320px] sm:h-[380px] md:h-auto md:aspect-[16/9] lg:aspect-[21/9] max-h-[480px] rounded-2xl md:rounded-3xl overflow-hidden bg-zinc-900 border border-cardBorder shadow-sm">
          {banners.length > 0 &&
            banners.map((banner, index) => {
              const imgSource = banner.image_url.startsWith("http")
                ? banner.image_url
                : `${API_BASE}${banner.image_url}`;
              return (
                <div
                  key={banner.id}
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                    index === currentSlide
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }`}
                >
                  <img
                    src={imgSource}
                    alt={banner.title || "Banner"}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10 pointer-events-none"></div>
                  {banner.is_verified && (
                    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 pointer-events-none flex items-center bg-[#2563eb] rounded-full p-1 shadow-lg shadow-blue-500/30 border border-blue-400/50">
                      <div className="bg-white rounded-full p-1 flex items-center justify-center shrink-0">
                        <BadgeCheck className="text-[#2563eb] fill-white w-3 h-3 sm:w-4 sm:h-4 drop-shadow-sm" />
                      </div>
                      <span className="text-white font-black text-[9px] sm:text-[10px] md:text-[11px] uppercase tracking-widest pl-2 pr-3 drop-shadow-md">
                        BB Verified
                      </span>
                    </div>
                  )}
                  <div className="absolute bottom-20 md:bottom-24 left-4 md:left-10 z-20 pr-6 flex flex-col gap-1.5 pointer-events-none">
                    {banner.title && (
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white drop-shadow-lg leading-tight">
                        {banner.title}
                      </h1>
                    )}
                    {banner.subtitle && (
                      <p className="text-gray-200 text-xs sm:text-sm font-medium max-w-xl drop-shadow-md line-clamp-2">
                        {banner.subtitle}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
        </div>

        <div className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 w-[92%] md:w-[88%] max-w-4xl z-30">
          <div className="flex flex-col md:flex-row items-center bg-surface rounded-2xl md:rounded-full p-2 shadow-[0_15px_30px_-10px_rgba(0,0,0,0.1)] border border-cardBorder gap-2 md:gap-0 relative">
            <div
              className="flex-1 flex flex-col w-full relative"
              ref={locationSearchContainerRef}
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
                  value={locationInput}
                  onChange={handleLocationInputChange}
                  disabled={!isLoaded || !!loadError}
                  className="w-full bg-transparent border-none outline-none text-primaryText placeholder-tertiaryText font-semibold text-sm md:text-base disabled:opacity-50"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleLocationSearchSubmit();
                  }}
                />
              </div>
              {locationSuggestions.length > 0 && (
                <div className="absolute top-full left-0 mt-3 w-full md:w-[125%] bg-surface border border-cardBorder rounded-2xl shadow-2xl overflow-hidden z-50 flex flex-col max-h-64 overflow-y-auto">
                  {locationSuggestions.map((suggestion) => (
                    <button
                      key={suggestion.placePrediction.placeId}
                      onClick={() => handleLocationSelect(suggestion)}
                      className="flex items-start gap-3 w-full px-4 py-3.5 text-left hover:bg-mainBg transition-colors border-b border-cardBorder last:border-0 group"
                    >
                      <MapPin
                        size={18}
                        className="text-tertiaryText shrink-0 mt-0.5 group-hover:text-[#5B4EE4] transition-colors"
                      />
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-primaryText leading-snug">
                          {suggestion.placePrediction.mainText.text}
                        </span>
                        {suggestion.placePrediction.secondaryText && (
                          <span className="text-xs text-secondaryText font-medium mt-0.5 leading-tight">
                            {suggestion.placePrediction.secondaryText.text}
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="w-full h-px md:w-px md:h-7 bg-cardBorder mx-1 hidden md:block"></div>
            <div className="w-full md:w-auto flex gap-2 md:contents px-1 pb-1 md:p-0">
              <button
                onClick={handleUseCurrentLocation}
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-primaryText font-bold text-xs md:text-sm px-4 py-3.5 hover:bg-mainBg rounded-full md:rounded-full transition-colors border border-cardBorder md:border-transparent shrink-0"
              >
                <Crosshair
                  size={16}
                  className={`text-[#5B4EE4] ${
                    isLocating ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden md:inline">
                  {isLocating ? "Locating..." : "Locate Me"}
                </span>
                <span className="md:hidden">
                  {isLocating ? "Locating..." : "Locate Me"}
                </span>
              </button>
              <button
                onClick={handleLocationSearchSubmit}
                className="flex-1 md:flex-none bg-[#2563eb] text-white font-black py-3.5 px-5 rounded-full md:rounded-full shadow-md hover:bg-[#4b40ce] active:scale-95 transition-all shrink-0 text-sm"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 2. THE STICKY APP HEADER (Local Search + Filters) */}
      <div className="sticky top-[56px] md:top-[64px] lg:top-[72px] z-40 bg-surface border-b border-cardBorder py-2.5 shadow-sm transition-all">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex items-center justify-center">
          <div className="flex items-center gap-2 w-full max-w-3xl">
            <div className="relative flex-grow">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiaryText"
              />
              <input
                type="text"
                placeholder={`Search ${
                  activeTab === "fun"
                    ? "events and trips"
                    : activeTab === "institutes"
                    ? "institutes"
                    : "directory"
                }...`}
                value={filters.searchQuery}
                onChange={(e) =>
                  setFilters({ ...filters, searchQuery: e.target.value })
                }
                className="w-full bg-mainBg border border-cardBorder rounded-full pl-10 pr-4 py-2.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all"
              />
            </div>
            {(activeTab === "pg" ||
              activeTab === "flat" ||
              activeTab === "tiffin") && (
              <button
                onClick={() => setIsFilterOpen(true)}
                className="flex items-center justify-center gap-2 px-4 md:px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border shrink-0 bg-mainBg text-primaryText border-cardBorder hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm active:scale-95"
              >
                <SlidersHorizontal size={16} className="text-[#5B4EE4]" />
                <span className="hidden sm:inline">Filters</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABS & INLINE FILTERS */}
      <div className="max-w-[1440px] w-full mx-auto px-4 lg:px-8 pt-4 flex flex-col gap-3">
        <div
          className={`border-b border-cardBorder w-full block ${
            activeTab === "pg" || activeTab === "flat" || activeTab === "fun"
              ? "pb-3"
              : "pb-4"
          }`}
        >
          {/* VIBRANT 3x2 MOBILE GRID */}
          <div className="sm:hidden w-full grid grid-cols-3 gap-2">
            {APP_TABS.map((tab) => {
              // Dynamic colors for the mobile grid based on the tab's brand color
              const isActive = activeTab === tab.id;
              let activeGradient = "";
              let inactiveTint = "";

              if (tab.color === "blue") {
                activeGradient = "bg-gradient-to-br from-blue-500 to-cyan-500";
                inactiveTint =
                  "bg-blue-50/50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:text-blue-700 border-blue-100 dark:border-blue-500/20";
              } else if (tab.color === "emerald") {
                activeGradient =
                  "bg-gradient-to-br from-emerald-500 to-teal-500";
                inactiveTint =
                  "bg-emerald-50/50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 border-emerald-100 dark:border-emerald-500/20";
              } else if (tab.color === "orange") {
                activeGradient =
                  "bg-gradient-to-br from-orange-500 to-amber-500";
                inactiveTint =
                  "bg-orange-50/50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 hover:text-orange-700 border-orange-100 dark:border-orange-500/20";
              } else if (tab.color === "pink") {
                activeGradient = "bg-gradient-to-br from-pink-500 to-rose-500";
                inactiveTint =
                  "bg-pink-50/50 dark:bg-pink-500/10 text-pink-600 dark:text-pink-400 hover:text-pink-700 border-pink-100 dark:border-pink-500/20";
              } else if (tab.color === "violet") {
                activeGradient =
                  "bg-gradient-to-br from-violet-500 to-purple-500";
                inactiveTint =
                  "bg-violet-50/50 dark:bg-violet-500/10 text-violet-600 dark:text-violet-400 hover:text-violet-700 border-violet-100 dark:border-violet-500/20";
              } else if (tab.color === "indigo") {
                activeGradient =
                  "bg-gradient-to-br from-indigo-500 to-blue-600";
                inactiveTint =
                  "bg-indigo-50/50 dark:bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 border-indigo-100 dark:border-indigo-500/20";
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex flex-col items-center justify-center py-3 px-1 gap-1.5 rounded-2xl transition-all duration-300 active:scale-95 border ${
                    isActive
                      ? `${activeGradient} text-white shadow-md border-transparent`
                      : `${inactiveTint} border`
                  }`}
                >
                  <div className={`${isActive ? "text-white" : ""}`}>
                    {tab.icon}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-tight truncate w-full text-center leading-none">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Desktop Pill Layout */}
          <div className="hidden sm:inline-flex items-center gap-1.5 w-auto bg-surface p-1.5 rounded-full border border-cardBorder shadow-sm">
            {APP_TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-black text-sm transition-all duration-300 active:scale-95 ${
                  activeTab === tab.id
                    ? "bg-[#5B4EE4] text-white shadow-lg shadow-[#5B4EE4]/30 border-transparent"
                    : "bg-transparent border-transparent text-secondaryText hover:text-primaryText hover:bg-zinc-100 dark:hover:bg-zinc-800/50"
                }`}
              >
                {tab.icon}{" "}
                <span className="whitespace-nowrap">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* INLINE QUICK FILTERS */}
        <div className="flex flex-wrap items-center gap-2 pb-1">
          {(activeTab === "pg" || activeTab === "flat") && (
            <div className="flex bg-surface border border-cardBorder rounded-xl p-1 shadow-sm w-fit shrink-0 mr-1">
              <button
                onClick={() => setFilters({ ...filters, gender: "any" })}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                  filters.gender === "any"
                    ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm"
                    : "text-secondaryText hover:text-primaryText hover:bg-mainBg"
                }`}
              >
                Unisex
              </button>
              <button
                onClick={() => setFilters({ ...filters, gender: "male_only" })}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                  filters.gender === "male_only"
                    ? "bg-blue-500 text-white shadow-sm"
                    : "text-secondaryText hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
                }`}
              >
                Boys
              </button>
              <button
                onClick={() =>
                  setFilters({ ...filters, gender: "female_only" })
                }
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                  filters.gender === "female_only"
                    ? "bg-pink-500 text-white shadow-sm"
                    : "text-secondaryText hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10"
                }`}
              >
                Girls
              </button>
            </div>
          )}

          {activeTab === "pg" && (
            <>
              {[
                {
                  id: "black",
                  label: "Premium",
                  icon: (
                    <Star
                      size={14}
                      className={
                        filters.badges.includes("black")
                          ? "text-yellow-400 fill-yellow-400"
                          : "text-yellow-500 fill-yellow-500"
                      }
                    />
                  ),
                },
                {
                  id: "green",
                  label: "Prime Loc",
                  icon: (
                    <MapPin
                      size={14}
                      className={
                        filters.badges.includes("green")
                          ? "text-white"
                          : "text-emerald-500"
                      }
                    />
                  ),
                },
                {
                  id: "blue",
                  label: "Value Pick",
                  icon: (
                    <ShieldCheck
                      size={14}
                      className={
                        filters.badges.includes("blue")
                          ? "text-white"
                          : "text-blue-500"
                      }
                    />
                  ),
                },
              ].map((b) => (
                <button
                  key={b.id}
                  onClick={() => {
                    setFilters((prev) => ({
                      ...prev,
                      badges: prev.badges.includes(b.id)
                        ? prev.badges.filter((x) => x !== b.id)
                        : [...prev.badges, b.id],
                    }));
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold border transition-colors shadow-sm active:scale-95 ${
                    filters.badges.includes(b.id)
                      ? "bg-[#5B4EE4] text-white border-[#5B4EE4]"
                      : "bg-surface text-secondaryText border-cardBorder hover:border-[#5B4EE4]/50"
                  }`}
                >
                  {b.icon} {b.label}
                </button>
              ))}
            </>
          )}

          {activeTab === "flat" && (
            <button
              onClick={() =>
                setFilters((prev) => ({
                  ...prev,
                  showOnlyFlatmates: !prev.showOnlyFlatmates,
                }))
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-xs font-bold border transition-colors shadow-sm active:scale-95 ${
                filters.showOnlyFlatmates
                  ? "bg-[#5B4EE4] text-white border-[#5B4EE4]"
                  : "bg-surface text-secondaryText border-cardBorder hover:border-[#5B4EE4]/50"
              }`}
            >
              <Users
                size={14}
                className={
                  filters.showOnlyFlatmates
                    ? "text-white"
                    : "text-secondaryText"
                }
              />{" "}
              Show Only Flats Needing Flatmates
            </button>
          )}

          {activeTab === "fun" && (
            <div className="flex bg-surface border border-cardBorder rounded-xl p-1 shadow-sm w-fit shrink-0">
              <button
                onClick={() => setFilters({ ...filters, funType: "all" })}
                className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                  filters.funType === "all"
                    ? "bg-zinc-800 dark:bg-zinc-200 text-white dark:text-zinc-900 shadow-sm"
                    : "text-secondaryText hover:text-primaryText hover:bg-mainBg"
                }`}
              >
                All Fun
              </button>
              <button
                onClick={() => setFilters({ ...filters, funType: "trip" })}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                  filters.funType === "trip"
                    ? "bg-[#5B4EE4] text-white shadow-sm"
                    : "text-secondaryText hover:text-[#5B4EE4] hover:bg-[#5B4EE4]/10"
                }`}
              >
                <MapIcon
                  size={14}
                  className={
                    filters.funType === "trip" ? "text-white" : "text-[#5B4EE4]"
                  }
                />{" "}
                Trips
              </button>
              <button
                onClick={() => setFilters({ ...filters, funType: "event" })}
                className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-black rounded-lg transition-all ${
                  filters.funType === "event"
                    ? "bg-pink-500 text-white shadow-sm"
                    : "text-secondaryText hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-500/10"
                }`}
              >
                <Ticket
                  size={14}
                  className={
                    filters.funType === "event" ? "text-white" : "text-pink-500"
                  }
                />{" "}
                Events
              </button>
            </div>
          )}
        </div>
      </div>

      {/* FILTER DRAWER OVERLAY */}
      {isFilterOpen &&
        (activeTab === "pg" ||
          activeTab === "flat" ||
          activeTab === "tiffin") && (
          <div className="fixed inset-0 z-[200] flex justify-end">
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
              onClick={() => setIsFilterOpen(false)}
            />
            <div className="relative w-full md:w-[420px] h-[85vh] md:h-full mt-auto md:mt-0 bg-surface rounded-t-3xl md:rounded-none md:rounded-l-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full md:slide-in-from-right-full duration-300 ease-out">
              <div className="flex justify-between items-center p-5 md:p-6 border-b border-cardBorder">
                <div>
                  <h2 className="text-xl font-black text-primaryText">
                    Refine Results
                  </h2>
                  <p className="text-xs font-medium text-secondaryText mt-0.5">
                    Filter the {activeTab} directory
                  </p>
                </div>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="p-2 bg-mainBg rounded-full border border-cardBorder text-tertiaryText hover:text-primaryText transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-6">
                <div className="flex flex-col bg-mainBg border border-cardBorder p-4 rounded-2xl shadow-sm">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-xs font-black text-secondaryText uppercase tracking-widest">
                      Max Budget
                    </label>
                    <span className="text-sm font-black text-[#5B4EE4] bg-[#5B4EE4]/10 px-2 py-1 rounded-md">
                      {activeTab === "tiffin"
                        ? filters.maxTiffinPrice >= 5000
                          ? "Any"
                          : `₹${filters.maxTiffinPrice}`
                        : filters.maxRent >= 75000
                        ? "Any"
                        : `₹${filters.maxRent}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={activeTab === "tiffin" ? "1500" : "5000"}
                    max={activeTab === "tiffin" ? "5000" : "75000"}
                    step={activeTab === "tiffin" ? "100" : "1000"}
                    value={
                      activeTab === "tiffin"
                        ? filters.maxTiffinPrice
                        : filters.maxRent
                    }
                    onChange={(e) =>
                      activeTab === "tiffin"
                        ? setFilters({
                            ...filters,
                            maxTiffinPrice: parseInt(e.target.value),
                          })
                        : setFilters({
                            ...filters,
                            maxRent: parseInt(e.target.value),
                          })
                    }
                    className="w-full accent-[#5B4EE4] h-1.5 bg-cardBorder rounded-lg appearance-none cursor-pointer"
                  />
                </div>
                <div className="relative">
                  <label className="block text-xs font-black text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                    Minimum Rating
                  </label>
                  <select
                    value={filters.minRating}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        minRating: Number(e.target.value),
                      })
                    }
                    className="w-full bg-mainBg border border-cardBorder rounded-xl px-4 py-3.5 text-sm font-bold text-primaryText outline-none shadow-sm appearance-none"
                  >
                    <option value={0}>Show All Ratings</option>
                    <option value={4.5}>4.5+ Stars (Excellent)</option>
                    <option value={4}>4.0+ Stars (Very Good)</option>
                  </select>
                  <ChevronDown
                    size={18}
                    className="absolute right-4 top-[36px] text-tertiaryText pointer-events-none"
                  />
                </div>
                {activeTab !== "tiffin" && (
                  <div className="relative">
                    <label className="block text-xs font-black text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                      Gender Preference
                    </label>
                    <select
                      value={filters.gender}
                      onChange={(e) =>
                        setFilters({ ...filters, gender: e.target.value })
                      }
                      className="w-full bg-mainBg border border-cardBorder rounded-xl px-4 py-3.5 text-sm font-bold text-primaryText outline-none shadow-sm appearance-none"
                    >
                      <option value="any">Unisex / Any Allowed</option>
                      <option value="male_only">Boys Only Properties</option>
                      <option value="female_only">Girls Only Properties</option>
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-[36px] text-tertiaryText pointer-events-none"
                    />
                  </div>
                )}
                {activeTab === "pg" && (
                  <div className="relative mt-4">
                    <label className="block text-xs font-black text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                      Food Facility
                    </label>
                    <select
                      value={filters.foodIncluded}
                      onChange={(e) =>
                        setFilters({ ...filters, foodIncluded: e.target.value })
                      }
                      className="w-full bg-mainBg border border-cardBorder rounded-xl px-4 py-3.5 text-sm font-bold text-primaryText outline-none shadow-sm appearance-none"
                    >
                      <option value="all">Any Preference</option>
                      <option value="true">Food Included in Rent</option>
                      <option value="false">No Food Included</option>
                    </select>
                    <ChevronDown
                      size={18}
                      className="absolute right-4 top-[36px] text-tertiaryText pointer-events-none"
                    />
                  </div>
                )}
                {(activeTab === "flat" || activeTab === "flatmate_spot") && (
                  <>
                    <div className="relative">
                      <label className="block text-xs font-black text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                        Configuration
                      </label>
                      <select
                        value={filters.bhk}
                        onChange={(e) =>
                          setFilters({ ...filters, bhk: e.target.value })
                        }
                        className="w-full bg-mainBg border border-cardBorder rounded-xl px-4 py-3.5 text-sm font-bold text-primaryText outline-none shadow-sm appearance-none"
                      >
                        <option value="all">Any Configuration</option>
                        <option value="1 RK">1 RK</option>
                        <option value="1 BHK">1 BHK</option>
                        <option value="2 BHK">2 BHK</option>
                        <option value="3 BHK">3 BHK</option>
                      </select>
                      <ChevronDown
                        size={18}
                        className="absolute right-4 top-[36px] text-tertiaryText pointer-events-none"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-black text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                        Furnishing
                      </label>
                      <select
                        value={filters.furnishing}
                        onChange={(e) =>
                          setFilters({ ...filters, furnishing: e.target.value })
                        }
                        className="w-full bg-mainBg border border-cardBorder rounded-xl px-4 py-3.5 text-sm font-bold text-primaryText outline-none shadow-sm appearance-none"
                      >
                        <option value="all">Any Furnishing</option>
                        <option value="fully_furnished">Fully Furnished</option>
                        <option value="semi_furnished">Semi Furnished</option>
                        <option value="unfurnished">Unfurnished</option>
                      </select>
                      <ChevronDown
                        size={18}
                        className="absolute right-4 top-[36px] text-tertiaryText pointer-events-none"
                      />
                    </div>
                  </>
                )}
                {activeTab === "tiffin" && (
                  <>
                    <div className="relative">
                      <label className="block text-xs font-black text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                        Diet Preference
                      </label>
                      <select
                        value={filters.diet}
                        onChange={(e) =>
                          setFilters({ ...filters, diet: e.target.value })
                        }
                        className="w-full bg-mainBg border border-cardBorder rounded-xl px-4 py-3.5 text-sm font-bold text-primaryText outline-none shadow-sm appearance-none"
                      >
                        <option value="all">Any Diet</option>
                        <option value="pure_veg">Pure Veg Only</option>
                        <option value="veg_nonveg_both">
                          Veg & Non-Veg Both
                        </option>
                      </select>
                      <ChevronDown
                        size={18}
                        className="absolute right-4 top-[36px] text-tertiaryText pointer-events-none"
                      />
                    </div>
                    <div className="relative">
                      <label className="block text-xs font-black text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                        Delivery Options
                      </label>
                      <select
                        value={filters.delivery}
                        onChange={(e) =>
                          setFilters({ ...filters, delivery: e.target.value })
                        }
                        className="w-full bg-mainBg border border-cardBorder rounded-xl px-4 py-3.5 text-sm font-bold text-primaryText outline-none shadow-sm appearance-none"
                      >
                        <option value="all">Any Option</option>
                        <option value="free">Free Delivery</option>
                        <option value="pickup">Pickup Only</option>
                      </select>
                      <ChevronDown
                        size={18}
                        className="absolute right-4 top-[36px] text-tertiaryText pointer-events-none"
                      />
                    </div>
                    <div
                      className="flex items-center justify-between bg-mainBg border border-cardBorder p-4 rounded-xl cursor-pointer"
                      onClick={() =>
                        setFilters({
                          ...filters,
                          jainRequired: !filters.jainRequired,
                        })
                      }
                    >
                      <div>
                        <span className="block text-sm font-black text-primaryText">
                          Jain Food Available
                        </span>
                        <span className="text-[11px] font-medium text-secondaryText">
                          Strictly without onion/garlic
                        </span>
                      </div>
                      <div
                        className={`w-10 h-6 rounded-full flex items-center p-1 transition-colors ${
                          filters.jainRequired
                            ? "bg-[#5B4EE4]"
                            : "bg-cardBorder"
                        }`}
                      >
                        <div
                          className={`w-4 h-4 bg-white rounded-full transition-transform ${
                            filters.jainRequired
                              ? "translate-x-4"
                              : "translate-x-0"
                          }`}
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="p-5 border-t border-cardBorder bg-surface grid grid-cols-2 gap-3 pb-safe">
                <button
                  onClick={() => setFilters(defaultFilters)}
                  className="py-3.5 rounded-xl font-black text-sm text-secondaryText bg-mainBg border border-cardBorder hover:text-primaryText transition-colors"
                >
                  Reset All
                </button>
                <button
                  onClick={() => setIsFilterOpen(false)}
                  className="py-3.5 rounded-xl font-black text-sm text-white bg-gradient-to-r from-[#5B4EE4] to-[#7E73ED] shadow-lg shadow-[#5B4EE4]/30 active:scale-95 transition-all"
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

      {/* 5. MAIN SUPER FEED GRID */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-2 w-full flex-grow">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="bg-surface rounded-2xl border border-cardBorder h-[360px] animate-pulse overflow-hidden"
              >
                <div className="h-48 bg-black/5 dark:bg-white/5"></div>
              </div>
            ))}
          </div>
        ) : listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-surface border border-cardBorder rounded-full flex items-center justify-center mb-5 shadow-sm">
              <Search size={36} className="text-tertiaryText opacity-50" />
            </div>
            <h2 className="text-xl font-black text-primaryText mb-2">
              No results found
            </h2>
            <p className="text-sm text-secondaryText mb-6 max-w-sm">
              Try adjusting your filters or checking a different category.
            </p>
            <button
              onClick={() => {
                setFilters(defaultFilters);
                setSearchQuery("");
              }}
              className="bg-[#5B4EE4] text-white px-8 py-3 rounded-xl font-black shadow-md"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {listings.map((item, index) => {
              const isLastItem = index === listings.length - 1;

              // --- RENDER DYNAMIC CARD BASED ON ACTIVE TAB ---

              // INSTITUTES
              if (activeTab === "institutes") {
                const mediaArray = Array.isArray(item.media_urls)
                  ? item.media_urls
                  : [];
                const coverImage =
                  mediaArray.length > 0 ? getImageUrl(mediaArray[0]) : null;
                const courses = Array.isArray(item.courses_offered)
                  ? item.courses_offered
                  : [];

                return (
                  <div
                    key={item.id}
                    ref={isLastItem ? lastElementRef : null}
                    onClick={() => navigate(`/institutes/view/${item.id}`)}
                    className="bg-surface rounded-2xl border border-cardBorder shadow-sm flex flex-col group overflow-hidden hover:shadow-xl hover:border-indigo-500/50 transition-all duration-300 cursor-pointer relative"
                  >
                    <div className="w-full h-48 bg-mainBg relative border-b border-cardBorder overflow-hidden shrink-0 p-2">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt="Cover"
                          className="w-full h-full rounded-2xl object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full rounded-2xl flex flex-col items-center justify-center text-tertiaryText bg-zinc-100 dark:bg-zinc-800">
                          <ImageOff size={28} opacity={0.5} />
                        </div>
                      )}
                      <div className="absolute bottom-4 left-4 bg-indigo-600/90 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1.5">
                        <BookOpen size={12} className="text-white" />{" "}
                        {item.category}
                      </div>
                      {item.is_verified && (
                        <div
                          className="absolute top-4 right-4 bg-blue-600 text-white p-1.5 rounded-full shadow-lg border border-blue-400"
                          title="Verified Institute"
                        >
                          <BadgeCheck size={16} />
                        </div>
                      )}
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-base font-black text-primaryText line-clamp-1 mb-2 group-hover:text-indigo-500 transition-colors leading-tight">
                        {item.institute_name}
                      </h3>
                      <div className="flex flex-col gap-2 mb-4">
                        <span className="text-xs font-bold text-secondaryText flex items-center gap-2 truncate">
                          <MapPin
                            size={14}
                            className="text-rose-500 shrink-0"
                          />{" "}
                          {item.city}
                        </span>
                      </div>
                      <div className="mt-auto pt-3 border-t border-cardBorder flex items-center gap-1.5 flex-wrap">
                        {courses.length > 0 ? (
                          courses.slice(0, 2).map((c, i) => (
                            <span
                              key={i}
                              className="text-[9px] font-black px-2 py-1 rounded border uppercase tracking-wider truncate max-w-[120px] bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10 dark:text-indigo-400 dark:border-indigo-500/30"
                            >
                              {c}
                            </span>
                          ))
                        ) : (
                          <span className="text-[10px] font-black text-tertiaryText italic">
                            No courses listed
                          </span>
                        )}
                        {courses.length > 2 && (
                          <span className="text-[10px] font-black text-tertiaryText">
                            +{courses.length - 2}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              }

              // FUN (Events & Trips)
              if (activeTab === "fun") {
                const isTrip = item.listing_class === "trip";
                const mediaArray = Array.isArray(item.media_urls)
                  ? item.media_urls
                  : [];
                const coverImage =
                  mediaArray.length > 0 ? getImageUrl(mediaArray[0]) : null;
                const routeArray = Array.isArray(item.route_stops)
                  ? item.route_stops
                  : [];
                const displayStart =
                  routeArray.length > 0 ? routeArray[0] : "TBD";
                const displayEnd =
                  routeArray.length > 1
                    ? routeArray[routeArray.length - 1]
                    : "TBD";

                return (
                  <div
                    key={item.id}
                    ref={isLastItem ? lastElementRef : null}
                    onClick={() => navigate(`/events/view/${item.id}`)}
                    className="bg-surface rounded-2xl border border-cardBorder shadow-sm flex flex-col group overflow-hidden hover:shadow-xl hover:border-[#5B4EE4]/50 transition-all duration-300 cursor-pointer relative"
                  >
                    <div className="w-full h-48 bg-mainBg relative border-b border-cardBorder overflow-hidden shrink-0">
                      {coverImage ? (
                        <img
                          src={coverImage}
                          alt="Cover"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-tertiaryText">
                          <ImageOff size={28} opacity={0.5} />
                        </div>
                      )}
                      <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-sm border border-white/20 flex items-center gap-1.5">
                        {isTrip ? (
                          <MapIcon size={12} className="text-white" />
                        ) : (
                          <Ticket size={12} className="text-white" />
                        )}{" "}
                        {item.category}
                      </div>
                    </div>
                    <div className="p-4 flex flex-col flex-1">
                      <h3 className="text-base font-black text-primaryText line-clamp-2 mb-3 group-hover:text-[#5B4EE4] transition-colors leading-tight">
                        {item.title}
                      </h3>
                      <div className="flex flex-col gap-2 mb-4">
                        <span className="text-xs font-bold text-secondaryText flex items-center gap-2 truncate">
                          <MapPin
                            size={14}
                            className="text-rose-500 shrink-0"
                          />
                          {isTrip
                            ? `${displayStart} ➔ ${displayEnd}`
                            : `${item.venue_name || "TBD"}, ${
                                item.location_city
                              }`}
                        </span>
                        <span className="text-xs font-bold text-secondaryText flex items-center gap-2">
                          <Calendar
                            size={14}
                            className="text-sky-500 shrink-0"
                          />{" "}
                          {formatDate(item.start_date || item.event_date)}
                        </span>
                      </div>
                      <div className="mt-auto pt-3 border-t border-cardBorder flex items-center justify-between">
                        <span className="text-xs font-bold text-secondaryText">
                          From{" "}
                          <span className="text-base font-black text-primaryText ml-1">
                            {item.price_min > 0
                              ? formatCurrency(item.price_min)
                              : "Free"}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }

              // OFFERS
              if (activeTab === "offers") {
                return (
                  <div
                    key={item.id}
                    className="bg-surface rounded-2xl border border-cardBorder p-6 shadow-sm flex flex-col items-center text-center group cursor-pointer hover:border-[#5B4EE4] transition-colors"
                  >
                    <Ticket size={40} className="text-pink-500 mb-3" />
                    <h3 className="text-lg font-black text-primaryText mb-1">
                      {item.offer_headline}
                    </h3>
                    <p className="text-sm font-bold text-secondaryText">
                      {item.business_name}
                    </p>
                  </div>
                );
              }

              // --- DEFAULT ACCOMMODATION / TIFFIN RENDERER ---
              const isTiffin = activeTab === "tiffin";
              const primaryMedia = isTiffin
                ? item.tiffin_media?.find((m) => m.is_primary) ||
                  item.tiffin_media?.[0]
                : item.listing_media?.find((m) => m.is_primary) ||
                  item.listing_media?.[0];
              const coverImg = primaryMedia
                ? getImageUrl(primaryMedia.url)
                : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80";
              const title = isTiffin ? item.provider_name : item.title;
              const linkUrl = isTiffin
                ? `/tiffins/view/${item.id}`
                : `/accommodations/view/${item.id}`;
              const isFav = savedFavorites.has(item.id);
              const isAnimating = animatingHeart === item.id;

              return (
                <div
                  key={item.id}
                  ref={isLastItem ? lastElementRef : null}
                  onClick={() => navigate(linkUrl)}
                  className="bg-surface rounded-2xl border border-cardBorder shadow-sm flex flex-col group overflow-hidden hover:shadow-xl hover:border-[#5B4EE4]/50 transition-all duration-300 cursor-pointer relative"
                >
                  <div className="relative h-48 w-full bg-mainBg overflow-hidden shrink-0">
                    <img
                      src={coverImg}
                      alt="Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {!isTiffin &&
                      item.badges?.length > 0 &&
                      renderVerticalBadges(item.badges)}
                    <button
                      onClick={(e) => handleFavoriteClick(e, item.id)}
                      className="absolute top-3 right-3 bg-black/40 backdrop-blur-md hover:bg-black/60 p-2 rounded-full transition-colors border border-white/20 shadow-sm z-20 group/btn"
                    >
                      <Heart
                        size={16}
                        className={`transition-transform duration-300 ease-out ${
                          isAnimating ? "scale-[1.7]" : "scale-100"
                        } ${
                          isFav
                            ? "text-pink-500 fill-pink-500 group-hover/btn:scale-110"
                            : "text-white"
                        }`}
                      />
                    </button>
                  </div>
                  <div className="p-4 flex flex-col flex-grow gap-2.5">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-base text-primaryText leading-tight line-clamp-1">
                        {title}
                      </h3>
                      <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[10px] text-amber-600 font-black shrink-0 shadow-sm">
                        <Star
                          size={10}
                          className="fill-amber-500 text-amber-500"
                        />{" "}
                        {Number(item.rating_overall) > 0
                          ? item.rating_overall
                          : "New"}
                      </div>
                    </div>
                    <p className="text-[11px] font-bold text-secondaryText flex items-center gap-1.5 truncate">
                      <MapPin
                        size={12}
                        className="shrink-0 text-tertiaryText"
                      />{" "}
                      {item.locality}, {item.city}
                    </p>
                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {!isTiffin && renderGender(item.gender_preference)}
                        {activeTab === "flat" && (
                          <span className="bg-mainBg border border-cardBorder text-primaryText px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                            {item.bhk_type}
                          </span>
                        )}
                        {activeTab === "pg" && (
                          <span className="bg-mainBg border border-cardBorder text-tertiaryText px-2 py-0.5 rounded text-[10px] font-black tracking-wide">
                            {renderOccupant(item.occupant_type)}
                          </span>
                        )}
                        {isTiffin && renderDietBadge(item.food_type)}
                        {isTiffin && item.jain_available && (
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
                            <Leaf size={10} /> Jain
                          </span>
                        )}
                      </div>
                      {activeTab === "flat" && (
                        <>
                          {item.listing_type === "flatmate_spot" ||
                          (item.current_occupants_count &&
                            item.current_occupants_count > 0) ? (
                            <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider w-fit shadow-xs">
                              <Users size={14} className="shrink-0" />
                              <span>
                                {item.current_occupants_count || 1} Already
                                Living Here • Looking for Flatmates
                              </span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider w-fit shadow-xs">
                              <HomeIcon size={14} className="shrink-0" />
                              <span>Completely Empty Flat</span>
                            </div>
                          )}
                        </>
                      )}
                      {activeTab === "flatmate_spot" && (
                        <div className="flex items-center gap-1.5 bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 px-2.5 py-1 rounded-md text-xs font-black uppercase tracking-wider w-fit shadow-xs">
                          <Users size={14} className="shrink-0" />
                          <span>
                            {item.current_occupants_count || 1} Already Living
                            Here • Looking for Flatmates
                          </span>
                        </div>
                      )}
                      {isTiffin && (
                        <div className="flex flex-wrap items-center gap-2">
                          {renderDeliveryBadge(
                            item.delivery_available,
                            item.delivery_charges
                          )}
                        </div>
                      )}
                    </div>
                    <div className="mt-auto pt-3 border-t border-cardBorder flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-tertiaryText uppercase tracking-widest">
                          {isTiffin
                            ? item.price_monthly_min
                              ? "Monthly From"
                              : "Per Meal"
                            : "Monthly Rent"}
                        </span>
                        <div className="text-base sm:text-lg font-black text-primaryText leading-none mt-0.5">
                          {isTiffin
                            ? item.price_monthly_min
                              ? formatCurrency(item.price_monthly_min)
                              : formatCurrency(item.price_per_meal_min)
                            : formatCurrency(item.price_monthly_min)}
                          <span className="text-[10px] font-bold text-secondaryText ml-0.5">
                            /
                            {isTiffin && !item.price_monthly_min
                              ? "meal"
                              : "mo"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        {loadingMore && (
          <div className="w-full flex justify-center py-6">
            <Loader2 className="animate-spin text-[#5B4EE4]" size={24} />
          </div>
        )}
      </div>
    </div>
  );
}
