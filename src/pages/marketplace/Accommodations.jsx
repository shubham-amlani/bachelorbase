import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  MapPin,
  Star,
  Building2,
  Users,
  Home as HomeIcon,
  Search,
  ShieldCheck,
  ChevronDown,
  Heart,
  Info,
  SlidersHorizontal,
  Map,
} from "lucide-react";
import PhoneVerificationModal from "../../components/auth/PhoneVerificationModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// --- HELPERS ---
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

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
      <div className="absolute top-2 right-2 bg-black/90 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
        <Star size={10} className="text-yellow-500 fill-yellow-500" /> Premium
      </div>
    );
  if (badge === "green")
    return (
      <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
        <MapPin size={10} /> Prime Loc
      </div>
    );
  if (badge === "blue")
    return (
      <div className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur-md text-white border border-white/20 px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest shadow-lg flex items-center gap-1">
        <ShieldCheck size={10} /> Value Pick
      </div>
    );
  return null;
};

const badgeWeights = { black: 1, green: 2, blue: 3, null: 4 };

export default function AccommodationsDirectory() {
  const navigate = useNavigate();
  const location = useLocation();

  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  // States for Dynamic Favorites
  const [savedFavorites, setSavedFavorites] = useState(new Set());
  const [animatingHeart, setAnimatingHeart] = useState(null);
  const [toast, setToast] = useState(null);

  // Modal State for Phone Verification
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // UI States
  const [activeTab, setActiveTab] = useState("pg");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Master Filter State
  const [filters, setFilters] = useState({
    searchQuery: "",
    maxRent: 75000,
    minRating: 0,
    gender: "any",
    badge: "all",
    foodIncluded: "all",
    bhk: "all",
    furnishing: "all",
  });

  const showToast = (msg, type = "success", action = null) => {
    setToast({ msg, type, action });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAllListings();
    fetchUserFavorites();
  }, []);

  const fetchAllListings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("pg_flat_listings")
        .select(
          `*, listing_media (url, is_primary), listing_amenities (food_included)`
        )
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

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

  // --- SECURE FAVORITE ACTION WRAPPER ---
  const requireVerifiedPhone = async (actionCallback) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      sessionStorage.setItem("returnTo", location.pathname);
      showToast("Please login to save favorites", "error");
      setTimeout(() => {
        window.scrollTo({ top: 0, behavior: "instant" });
        navigate("/login");
      }, 1500);
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
        const { error } = await supabase
          .from("saved_favorites")
          .delete()
          .match({ user_id: userId, listing_id: listingId });
        if (error) showToast("Failed to remove.", "error");
        else showToast("Removed from favorites", "success");
      } else {
        setSavedFavorites((prev) => {
          const n = new Set(prev);
          n.add(listingId);
          return n;
        });
        const { error } = await supabase
          .from("saved_favorites")
          .insert({ user_id: userId, listing_id: listingId });
        if (error && error.code !== "23505")
          showToast("Failed to save.", "error");
        else
          showToast("Added to favorites!", "success", {
            label: "View",
            url: "/favorites",
          });
      }
    });
  };

  // --- FILTER & SORT LOGIC ---
  const filteredAndSortedListings = useMemo(() => {
    let result = listings.filter((l) => {
      // 1. Strict Tab Filtering
      if (l.listing_type !== activeTab) return false;

      // 2. Search Query Filtering
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (
          !l.title.toLowerCase().includes(q) &&
          !l.locality.toLowerCase().includes(q)
        )
          return false;
      }

      // 3. Rent Filtering
      if (l.price_monthly_min > filters.maxRent) return false;

      // 4. Universal Rating Filter
      if (filters.minRating > 0) {
        const rating = Number(l.rating_overall) || 0;
        if (rating < filters.minRating) return false;
      }

      // 5. Gender Filtering
      if (
        filters.gender !== "any" &&
        l.gender_preference !== filters.gender &&
        l.gender_preference !== "any"
      )
        return false;

      // 6. Contextual Filtering: PGs
      if (activeTab === "pg") {
        if (filters.badge !== "all" && l.badge !== filters.badge) return false;

        if (filters.foodIncluded !== "all") {
          const amenities = Array.isArray(l.listing_amenities)
            ? l.listing_amenities[0]
            : l.listing_amenities;
          const isFoodIncluded = amenities?.food_included === true;
          if (filters.foodIncluded === "true" && !isFoodIncluded) return false;
          if (filters.foodIncluded === "false" && isFoodIncluded) return false;
        }
      }

      // 7. Contextual Filtering: Flats
      if (activeTab === "flat") {
        if (filters.bhk !== "all" && l.bhk_type !== filters.bhk) return false;
        if (
          filters.furnishing !== "all" &&
          l.furnishing_status !== filters.furnishing
        )
          return false;
      }

      return true;
    });

    // Sort by Badge Quality
    result.sort((a, b) => {
      const badgeA = badgeWeights[a.badge] || badgeWeights.null;
      const badgeB = badgeWeights[b.badge] || badgeWeights.null;
      return badgeA - badgeB;
    });

    return result;
  }, [listings, activeTab, filters]);

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      maxRent: 75000,
      minRating: 0,
      gender: "any",
      badge: "all",
      foodIncluded: "all",
      bhk: "all",
      furnishing: "all",
    });
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

      {/* TOAST NOTIFICATION */}
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

      {/* 1. HERO HEADER WITH LOCATION REDIRECT */}
      <div className="bg-surface border-b border-cardBorder relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5B4EE4]/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-8 md:py-10 relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-black text-primaryText tracking-tight">
              Explore the Directory
            </h1>
            <p className="text-sm font-medium text-secondaryText max-w-xl">
              Browse our complete catalog of verified PGs, independent flats,
              and flatmate vacancies.
            </p>
          </div>

          {/* Location Search Redirect Card */}
          <div className="bg-mainBg border border-cardBorder p-4 sm:p-5 rounded-2xl flex flex-col gap-3 w-full md:w-80 shrink-0 shadow-sm mt-2 md:mt-0">
            <span className="text-[10px] font-black text-secondaryText uppercase tracking-widest flex items-center gap-1.5">
              <Map size={14} className="text-[#5B4EE4]" /> Power Search
            </span>
            <p className="text-xs font-bold text-primaryText leading-tight">
              Find properties exactly where you need them using our interactive
              map.
            </p>
            <button
              onClick={() => navigate("/location-search")}
              className="w-full bg-[#5B4EE4] hover:bg-[#4b40ce] text-white py-2.5 rounded-xl text-sm font-black transition-colors shadow-md flex items-center justify-center gap-2 mt-1"
            >
              <Search size={16} /> Search by Area / College
            </button>
          </div>
        </div>
      </div>

      {/* 2. THE ONLY STICKY ELEMENT: SEARCH BAR (Fixed Gap Issue) */}
      <div className="sticky top-[56px] md:top-[64px] z-40 bg-surface border-b border-cardBorder py-3 shadow-sm transition-all">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex items-center justify-center">
          <div className="relative w-full max-w-2xl">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiaryText"
            />
            <input
              type="text"
              placeholder="Search by property name, society, or locality..."
              value={filters.searchQuery}
              onChange={(e) =>
                setFilters({ ...filters, searchQuery: e.target.value })
              }
              className="w-full bg-mainBg border border-cardBorder rounded-full pl-12 pr-4 py-3 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all"
            />
          </div>
        </div>
      </div>

      {/* 3. TABS & COLLAPSIBLE FILTERS (NOT STICKY) */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 flex flex-col gap-5">
        {/* Responsive, Beautiful Rounded Tabs & Filter Toggle */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 border-b border-cardBorder pb-4 w-full">
          {/* Beautiful Left-Aligned Tabs - Responsive for iPhone SE */}
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
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    // Reset contextual filters when switching main categories
                    setFilters({
                      ...filters,
                      badge: "all",
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

          {/* Filter Button - Scaled down for mobile */}
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-2.5 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider transition-all border shrink-0 w-full sm:w-auto ${
              isFilterOpen
                ? "bg-zinc-900 text-white border-zinc-900 shadow-md"
                : "bg-surface text-primaryText border-cardBorder hover:bg-mainBg shadow-sm"
            }`}
          >
            <SlidersHorizontal size={14} className="sm:w-4 sm:h-4" />{" "}
            {isFilterOpen ? "Close Filters" : "Advanced Filters"}
          </button>
        </div>

        {/* Collapsible Filter Panel */}
        {isFilterOpen && (
          <div className="bg-surface border border-cardBorder rounded-2xl p-6 shadow-sm animate-in slide-in-from-top-2 duration-200 mt-2">
            <div className="flex items-center justify-between mb-5 border-b border-cardBorder pb-4">
              <span className="text-[10px] font-black text-secondaryText uppercase tracking-widest flex items-center gap-2">
                <SlidersHorizontal size={14} /> Refine your search results
              </span>
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-[#5B4EE4] hover:underline"
              >
                Reset All Filters
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Universal: Max Rent Slider (Upgraded UX) */}
              <div className="flex flex-col justify-center bg-mainBg border border-cardBorder p-4 rounded-xl">
                <div className="flex justify-between items-center mb-3">
                  <label className="text-[10px] font-bold text-secondaryText uppercase tracking-wider">
                    Max Rent
                  </label>
                  <span className="text-sm font-black text-[#5B4EE4] bg-[#5B4EE4]/10 px-2 py-0.5 rounded">
                    {filters.maxRent >= 75000
                      ? "Any Price"
                      : `₹${filters.maxRent.toLocaleString()}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="5000"
                  max="75000"
                  step="1000"
                  value={filters.maxRent}
                  onChange={(e) =>
                    setFilters({
                      ...filters,
                      maxRent: parseInt(e.target.value),
                    })
                  }
                  className="w-full accent-[#5B4EE4] h-2 bg-cardBorder rounded-lg appearance-none cursor-pointer mt-1"
                />
              </div>

              {/* Universal: Minimum Rating */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
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
                  className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                >
                  <option value={0}>Any Rating</option>
                  <option value={4.5}>4.5+ Stars (Excellent)</option>
                  <option value={4}>4.0+ Stars (Very Good)</option>
                  <option value={3}>3.0+ Stars (Good)</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-[35px] text-tertiaryText pointer-events-none"
                />
              </div>

              {/* Universal: Gender */}
              <div className="relative">
                <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                  Gender Preference
                </label>
                <select
                  value={filters.gender}
                  onChange={(e) =>
                    setFilters({ ...filters, gender: e.target.value })
                  }
                  className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                >
                  <option value="any">Allowed: Unisex / Any</option>
                  <option value="male_only">Allowed: Boys Only</option>
                  <option value="female_only">Allowed: Girls Only</option>
                </select>
                <ChevronDown
                  size={16}
                  className="absolute right-4 top-[35px] text-tertiaryText pointer-events-none"
                />
              </div>

              {/* Contextual: PGs */}
              {activeTab === "pg" && (
                <>
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                      Property Class
                    </label>
                    <select
                      value={filters.badge}
                      onChange={(e) =>
                        setFilters({ ...filters, badge: e.target.value })
                      }
                      className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                    >
                      <option value="all">Any Class</option>
                      <option value="black">Premium (Black Badge)</option>
                      <option value="green">Prime Loc (Green Badge)</option>
                      <option value="blue">Value Pick (Blue Badge)</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-[35px] text-tertiaryText pointer-events-none"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                      Food Facility
                    </label>
                    <select
                      value={filters.foodIncluded}
                      onChange={(e) =>
                        setFilters({ ...filters, foodIncluded: e.target.value })
                      }
                      className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                    >
                      <option value="all">Any</option>
                      <option value="true">Food Included in Rent</option>
                      <option value="false">No Food Included</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-[35px] text-tertiaryText pointer-events-none"
                    />
                  </div>
                </>
              )}

              {/* Contextual: Flats */}
              {activeTab === "flat" && (
                <>
                  <div className="relative">
                    <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                      Configuration
                    </label>
                    <select
                      value={filters.bhk}
                      onChange={(e) =>
                        setFilters({ ...filters, bhk: e.target.value })
                      }
                      className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
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
                      className="absolute right-4 top-[35px] text-tertiaryText pointer-events-none"
                    />
                  </div>

                  <div className="relative">
                    <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                      Furnishing Status
                    </label>
                    <select
                      value={filters.furnishing}
                      onChange={(e) =>
                        setFilters({ ...filters, furnishing: e.target.value })
                      }
                      className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                    >
                      <option value="all">Any Furnishing</option>
                      <option value="fully_furnished">Fully Furnished</option>
                      <option value="semi_furnished">Semi Furnished</option>
                      <option value="unfurnished">Unfurnished</option>
                    </select>
                    <ChevronDown
                      size={16}
                      className="absolute right-4 top-[35px] text-tertiaryText pointer-events-none"
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 4. MAIN PROPERTY GRID (Locked to 4 Columns max for Desktop) */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-2 w-full flex-grow">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-[360px] bg-surface border border-cardBorder rounded-2xl"
              ></div>
            ))}
          </div>
        ) : filteredAndSortedListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-surface border border-cardBorder rounded-full flex items-center justify-center mb-5 shadow-sm">
              <Search size={36} className="text-tertiaryText opacity-50" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-primaryText mb-2">
              No properties match your filters
            </h2>
            <p className="text-sm font-medium text-secondaryText max-w-sm mb-6">
              Try adjusting your max rent slider, changing your rating
              preference, or clearing filters entirely.
            </p>
            <button
              onClick={clearFilters}
              className="bg-[#5B4EE4] text-white px-8 py-3.5 rounded-xl font-black hover:bg-[#4b40ce] transition-colors shadow-md"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAndSortedListings.map((listing) => {
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
                  onClick={() => navigate(`/accommodations/view/${listing.id}`)}
                  className="bg-surface rounded-2xl border border-cardBorder shadow-sm flex flex-col group overflow-hidden hover:shadow-xl hover:border-[#5B4EE4]/50 transition-all duration-300 cursor-pointer relative"
                >
                  <div className="relative h-48 w-full bg-mainBg overflow-hidden block shrink-0">
                    <img
                      src={coverImg}
                      alt="Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {listing.badge && renderSchemaBadge(listing.badge)}

                    {/* Accurate Favorite Button (Home.jsx Replica) */}
                    <button
                      onClick={(e) => handleFavoriteClick(e, listing.id)}
                      className="absolute top-3 left-3 bg-black/40 backdrop-blur-md hover:bg-black/60 p-2 rounded-full transition-colors border border-white/20 shadow-sm z-20 group/btn"
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

                  <div className="p-4 sm:p-5 flex flex-col flex-grow gap-3">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className="font-black text-base text-primaryText leading-tight line-clamp-1">
                        {listing.title}
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

                    <p className="text-xs font-bold text-secondaryText flex items-center gap-1.5 truncate">
                      <MapPin
                        size={12}
                        className="shrink-0 text-tertiaryText"
                      />{" "}
                      {listing.locality}, {listing.city}
                    </p>

                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderGender(listing.gender_preference)}
                        {listing.listing_type === "flat" && (
                          <span className="bg-mainBg border border-cardBorder text-primaryText px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider">
                            {listing.bhk_type}
                          </span>
                        )}
                        {listing.listing_type === "pg" && (
                          <span className="bg-mainBg border border-cardBorder text-tertiaryText px-2 py-0.5 rounded text-[10px] font-black tracking-wide">
                            {renderOccupant(listing.occupant_type)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-cardBorder flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-tertiaryText uppercase tracking-widest">
                          Starts From
                        </span>
                        <div className="text-lg font-black text-primaryText leading-none mt-0.5">
                          {formatCurrency(listing.price_monthly_min)}
                          <span className="text-[10px] font-bold text-secondaryText ml-0.5">
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
        )}
      </div>
    </div>
  );
}
