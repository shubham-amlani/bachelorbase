import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  MapPin,
  Star,
  Search,
  ChevronDown,
  Heart,
  Info,
  SlidersHorizontal,
  ChefHat,
  Truck,
  Leaf,
  X,
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

export default function Tiffins() {
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
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Master Filter State for Tiffins
  const [filters, setFilters] = useState({
    searchQuery: "",
    maxMonthlyPrice: 5000,
    minRating: 0,
    diet: "all", // all, pure_veg, veg_nonveg_both
    jainRequired: false,
    delivery: "all", // all, free, available, pickup
  });

  const showToast = (msg, type = "success", action = null) => {
    setToast({ msg, type, action });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAllTiffins();
    fetchUserFavorites();
  }, []);

  const fetchAllTiffins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("tiffin_services")
        .select(`*, tiffin_media (url, is_primary)`)
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
      .select("tiffin_id")
      .eq("user_id", session.user.id)
      .not("tiffin_id", "is", null);
    if (data) {
      setSavedFavorites(new Set(data.map((item) => item.tiffin_id)));
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

  const handleFavoriteClick = async (e, tiffinId) => {
    e.preventDefault();
    e.stopPropagation();

    requireVerifiedPhone(async (userId) => {
      const isFav = savedFavorites.has(tiffinId);

      setAnimatingHeart(tiffinId);
      setTimeout(() => setAnimatingHeart(null), 300);

      if (isFav) {
        setSavedFavorites((prev) => {
          const n = new Set(prev);
          n.delete(tiffinId);
          return n;
        });
        const { error } = await supabase
          .from("saved_favorites")
          .delete()
          .match({ user_id: userId, tiffin_id: tiffinId });
        if (error) showToast("Failed to remove.", "error");
        else showToast("Removed from favorites", "success");
      } else {
        setSavedFavorites((prev) => {
          const n = new Set(prev);
          n.add(tiffinId);
          return n;
        });
        const { error } = await supabase
          .from("saved_favorites")
          .insert({ user_id: userId, tiffin_id: tiffinId });
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
  const filteredListings = useMemo(() => {
    return listings.filter((l) => {
      if (filters.searchQuery) {
        const q = filters.searchQuery.toLowerCase();
        if (
          !l.provider_name.toLowerCase().includes(q) &&
          !l.locality?.toLowerCase().includes(q)
        )
          return false;
      }

      if (l.price_monthly_min && l.price_monthly_min > filters.maxMonthlyPrice)
        return false;

      if (filters.minRating > 0) {
        const rating = Number(l.rating_overall) || 0;
        if (rating < filters.minRating) return false;
      }

      if (filters.diet !== "all" && l.food_type !== filters.diet) return false;

      if (filters.jainRequired && !l.jain_available) return false;

      if (filters.delivery !== "all") {
        if (
          filters.delivery === "free" &&
          (!l.delivery_available || l.delivery_charges > 0)
        )
          return false;
        if (filters.delivery === "available" && !l.delivery_available)
          return false;
        if (filters.delivery === "pickup" && l.delivery_available) return false;
      }

      return true;
    });
  }, [listings, filters]);

  const clearFilters = () => {
    setFilters({
      searchQuery: "",
      maxMonthlyPrice: 5000,
      minRating: 0,
      diet: "all",
      jainRequired: false,
      delivery: "all",
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

      {/* 1. COMPACT HERO HEADER */}
      <div className="bg-surface border-b border-cardBorder relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5B4EE4]/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-3 md:py-4 relative z-10 flex flex-col gap-1">
          <h1 className="text-xl md:text-2xl font-black text-primaryText tracking-tight">
            Homestyle Tiffin Services
          </h1>
          <p className="text-xs font-medium text-secondaryText max-w-xl">
            Discover verified, hygienic, and affordable meal providers
            delivering right to your door.
          </p>
        </div>
      </div>

      {/* 2. STICKY SEARCH BAR + FILTERS */}
      <div className="sticky top-[56px] md:top-[64px] z-40 bg-surface border-b border-cardBorder py-2.5 shadow-sm transition-all">
        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 flex items-center justify-center">
          <div className="flex items-center gap-2 w-full max-w-3xl">
            <div className="relative flex-grow">
              <Search
                size={16}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-tertiaryText"
              />
              <input
                type="text"
                placeholder="Search by provider name or locality..."
                value={filters.searchQuery}
                onChange={(e) =>
                  setFilters({ ...filters, searchQuery: e.target.value })
                }
                className="w-full bg-mainBg border border-cardBorder rounded-full pl-10 pr-4 py-2.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all"
              />
            </div>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`flex items-center justify-center gap-2 px-3 md:px-5 py-2.5 rounded-full text-xs font-black uppercase tracking-wider transition-all border shrink-0 ${
                isFilterOpen
                  ? "bg-zinc-900 text-white border-zinc-900 shadow-md dark:bg-white dark:text-zinc-900"
                  : "bg-mainBg text-primaryText border-cardBorder hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-sm"
              }`}
            >
              {isFilterOpen ? <X size={16} /> : <SlidersHorizontal size={16} />}
              <span className="hidden md:inline">
                {isFilterOpen ? "Close" : "Filters"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. COLLAPSIBLE FILTERS */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-8 pt-4 flex flex-col gap-4">
        {isFilterOpen && (
          <>
            {/* Mobile Backdrop overlay */}
            <div
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] md:hidden"
              onClick={() => setIsFilterOpen(false)}
            ></div>

            <div className="fixed inset-x-0 bottom-0 z-[101] bg-surface rounded-t-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom-full md:static md:z-auto md:bg-surface md:border md:border-cardBorder md:rounded-2xl md:p-6 md:shadow-sm md:animate-in md:slide-in-from-top-2 md:mt-2 md:mb-2">
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

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
                <div className="flex flex-col justify-center bg-mainBg border border-cardBorder p-4 rounded-xl">
                  <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] font-bold text-secondaryText uppercase tracking-wider">
                      Max Monthly
                    </label>
                    <span className="text-sm font-black text-[#5B4EE4] bg-[#5B4EE4]/10 px-2 py-0.5 rounded">
                      {filters.maxMonthlyPrice >= 5000
                        ? "Any Price"
                        : `₹${filters.maxMonthlyPrice.toLocaleString()}`}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="1500"
                    max="5000"
                    step="100"
                    value={filters.maxMonthlyPrice}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        maxMonthlyPrice: parseInt(e.target.value),
                      })
                    }
                    className="w-full accent-[#5B4EE4] h-2 bg-cardBorder rounded-lg appearance-none cursor-pointer mt-1"
                  />
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                    Food Preference
                  </label>
                  <select
                    value={filters.diet}
                    onChange={(e) =>
                      setFilters({ ...filters, diet: e.target.value })
                    }
                    className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                  >
                    <option value="all">Any Preference</option>
                    <option value="pure_veg">Pure Veg Only</option>
                    <option value="veg_nonveg_both">Veg & Non-Veg Both</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-[35px] text-tertiaryText pointer-events-none"
                  />
                </div>

                <div
                  className="flex items-center justify-start bg-mainBg border border-cardBorder p-4 rounded-xl cursor-pointer"
                  onClick={() =>
                    setFilters({
                      ...filters,
                      jainRequired: !filters.jainRequired,
                    })
                  }
                >
                  <div className="flex items-center gap-3 w-full">
                    <input
                      type="checkbox"
                      checked={filters.jainRequired}
                      onChange={() => {}} // Handled by div click
                      className="w-5 h-5 rounded border-cardBorder text-[#5B4EE4] focus:ring-[#5B4EE4] pointer-events-none"
                    />
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-primaryText">
                        Jain Food Required
                      </span>
                      <span className="text-[10px] text-secondaryText">
                        Show only Jain options
                      </span>
                    </div>
                  </div>
                </div>

                <div className="relative">
                  <label className="block text-[10px] font-bold text-secondaryText uppercase tracking-widest mb-1.5 pl-1">
                    Delivery Option
                  </label>
                  <select
                    value={filters.delivery}
                    onChange={(e) =>
                      setFilters({ ...filters, delivery: e.target.value })
                    }
                    className="appearance-none w-full bg-mainBg border border-cardBorder rounded-xl pl-4 pr-10 py-3.5 text-xs font-bold text-primaryText outline-none focus:border-[#5B4EE4] shadow-sm transition-all cursor-pointer"
                  >
                    <option value="all">Any Delivery Status</option>
                    <option value="free">Free Delivery Only</option>
                    <option value="available">Delivery Available (Any)</option>
                    <option value="pickup">Pickup Only</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-[35px] text-tertiaryText pointer-events-none"
                  />
                </div>

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
                    <option value="all">Any Rating</option>
                    <option value={4.5}>4.5+ Stars (Excellent)</option>
                    <option value={4}>4.0+ Stars (Very Good)</option>
                    <option value={3}>3.0+ Stars (Good)</option>
                  </select>
                  <ChevronDown
                    size={16}
                    className="absolute right-4 top-[35px] text-tertiaryText pointer-events-none"
                  />
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* 4. MAIN TIFFIN GRID */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-4 lg:px-8 py-2 w-full flex-grow">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full">
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
                  <div className="mt-auto pt-4 border-t border-cardBorder flex items-center justify-between">
                    <div className="flex flex-col gap-1.5 w-full">
                      <div className="h-3 w-16 bg-black/5 dark:bg-white/5 rounded-md"></div>
                      <div className="h-5 w-24 bg-black/5 dark:bg-white/5 rounded-md"></div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredListings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-surface border border-cardBorder rounded-full flex items-center justify-center mb-5 shadow-sm">
              <ChefHat size={36} className="text-tertiaryText opacity-50" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-primaryText mb-2">
              No tiffin services match your filters
            </h2>
            <p className="text-sm font-medium text-secondaryText max-w-sm mb-6">
              Try adjusting your price slider, diet preference, or clearing
              filters entirely.
            </p>
            <button
              onClick={clearFilters}
              className="bg-[#5B4EE4] text-white px-8 py-3.5 rounded-xl font-black hover:bg-[#4b40ce] transition-colors shadow-md"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {filteredListings.map((listing) => {
              const primaryMedia =
                listing.tiffin_media?.find((m) => m.is_primary) ||
                listing.tiffin_media?.[0];
              const coverImg = primaryMedia
                ? primaryMedia.url.startsWith("http")
                  ? primaryMedia.url
                  : `${API_BASE}${primaryMedia.url}`
                : "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=600&q=80";

              const isFav = savedFavorites.has(listing.id);
              const isAnimating = animatingHeart === listing.id;

              return (
                <div
                  key={listing.id}
                  onClick={() => navigate(`/tiffins/view/${listing.id}`)}
                  className="bg-surface rounded-2xl border border-cardBorder shadow-sm flex flex-col group overflow-hidden hover:shadow-xl hover:border-[#5B4EE4]/50 transition-all duration-300 cursor-pointer relative"
                >
                  <div className="relative h-48 w-full bg-mainBg overflow-hidden block shrink-0">
                    <img
                      src={coverImg}
                      alt="Tiffin Food Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

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
                        {listing.provider_name}
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

                    <p className="text-xs font-bold text-secondaryText flex items-center gap-1.5 truncate -mt-1">
                      <MapPin
                        size={12}
                        className="shrink-0 text-tertiaryText"
                      />{" "}
                      {listing.locality}, {listing.city}
                    </p>

                    <div className="flex flex-col gap-2 mt-1">
                      <div className="flex flex-wrap items-center gap-2">
                        {renderDietBadge(listing.food_type)}
                        {listing.jain_available && (
                          <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-black tracking-wide uppercase flex items-center gap-1">
                            <Leaf size={10} /> Jain Available
                          </span>
                        )}
                        {renderDeliveryBadge(
                          listing.delivery_available,
                          listing.delivery_charges
                        )}
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-cardBorder flex items-center justify-between">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-bold text-tertiaryText uppercase tracking-widest">
                          {listing.price_monthly_min
                            ? "Monthly Rent From"
                            : "Price Per Meal"}
                        </span>
                        <div className="flex items-end gap-1.5 mt-0.5">
                          <div className="text-lg font-black text-primaryText leading-none">
                            {listing.price_monthly_min
                              ? formatCurrency(listing.price_monthly_min)
                              : formatCurrency(listing.price_per_meal_min)}
                            <span className="text-[10px] font-bold text-secondaryText ml-0.5">
                              {listing.price_monthly_min ? "/mo" : "/meal"}
                            </span>
                          </div>
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
