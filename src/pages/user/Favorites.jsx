import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Heart,
  MapPin,
  Star,
  Building2,
  Utensils,
  ShieldCheck,
  Loader2,
  Info,
  ArrowLeft,
  Search,
  Home,
  Users,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// --- UI HELPERS ---
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);

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
      <div className="absolute top-2 right-2 bg-black/90 backdrop-blur-md text-white border border-white/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
        <Star size={10} className="text-yellow-500 fill-yellow-500" /> Premium
      </div>
    );
  if (badge === "green")
    return (
      <div className="absolute top-2 right-2 bg-emerald-500/90 backdrop-blur-md text-white border border-white/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
        <MapPin size={10} /> Prime Loc
      </div>
    );
  if (badge === "blue")
    return (
      <div className="absolute top-2 right-2 bg-blue-500/90 backdrop-blur-md text-white border border-white/20 px-2 py-1 rounded text-[9px] font-black uppercase tracking-widest shadow-md flex items-center gap-1">
        <ShieldCheck size={10} /> Value Pick
      </div>
    );
  return null;
};

export default function Favorites() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState({
    accommodations: [],
    tiffins: [],
  });

  // 3 Tabs: 'pg', 'flats', 'tiffins'
  const [activeTab, setActiveTab] = useState("pg");

  const [toast, setToast] = useState(null);
  const [animatingId, setAnimatingId] = useState(null);

  const showToast = (msg, type = "success", action = null) => {
    setToast({ msg, type, action });
    // Don't auto-dismiss too quickly if there's an undo action
    setTimeout(() => setToast(null), action ? 5000 : 3000);
  };

  useEffect(() => {
    // Scroll to top instantly when page mounts
    window.scrollTo(0, 0);
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        sessionStorage.setItem("returnTo", "/favorites");
        navigate("/login", { replace: true });
        return;
      }

      const { data, error } = await supabase
        .from("saved_favorites")
        .select(
          `
          id,
          listing_id,
          tiffin_id,
          pg_flat_listings (*, listing_media (url, is_primary)),
          tiffin_services (*, tiffin_media (url, is_primary))
        `
        )
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const acc = [];
      const tif = [];

      (data || []).forEach((fav) => {
        if (fav.pg_flat_listings) {
          acc.push({ favId: fav.id, ...fav.pg_flat_listings });
        } else if (fav.tiffin_services) {
          tif.push({ favId: fav.id, ...fav.tiffin_services });
        }
      });

      setFavorites({ accommodations: acc, tiffins: tif });

      // Auto-switch to a populated tab if the default one is empty
      const hasPg = acc.some((a) => a.listing_type === "pg");
      const hasFlats = acc.some((a) =>
        ["flat", "flatmate_spot"].includes(a.listing_type)
      );
      if (!hasPg && hasFlats) setActiveTab("flats");
      else if (!hasPg && !hasFlats && tif.length > 0) setActiveTab("tiffins");
    } catch (error) {
      console.error("Error fetching favorites:", error);
      showToast("Failed to load favorites.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (e, item, category) => {
    e.preventDefault();
    e.stopPropagation();

    const favId = item.favId;

    // Trigger animation
    setAnimatingId(favId);

    // Optimistic UI Update
    setTimeout(() => {
      setFavorites((prev) => ({
        ...prev,
        [category]: prev[category].filter((i) => i.favId !== favId),
      }));
      setAnimatingId(null);
    }, 300);

    const { error } = await supabase
      .from("saved_favorites")
      .delete()
      .eq("id", favId);
    if (error) {
      showToast("Failed to remove favorite.", "error");
      fetchFavorites(); // Revert on failure
    } else {
      showToast("Removed from favorites.", "success", {
        label: "Undo",
        onClick: async () => {
          // Restore Logic
          const {
            data: { session },
          } = await supabase.auth.getSession();
          const payload =
            category === "tiffins"
              ? { user_id: session.user.id, tiffin_id: item.id }
              : { user_id: session.user.id, listing_id: item.id };

          const { data: newFav, error: insertError } = await supabase
            .from("saved_favorites")
            .insert(payload)
            .select()
            .single();

          if (!insertError && newFav) {
            const restoredItem = { ...item, favId: newFav.id };
            setFavorites((prev) => ({
              ...prev,
              [category]: [restoredItem, ...prev[category]],
            }));
            showToast("Favorite restored!", "success");
            setToast(null); // Force clear the undo toast
          } else {
            showToast("Failed to restore.", "error");
          }
        },
      });
    }
  };

  const renderCard = (item, category) => {
    const isTiffin = category === "tiffins";
    const media = isTiffin ? item.tiffin_media : item.listing_media;
    const primaryMedia = media?.find((m) => m.is_primary) || media?.[0];
    const coverImg = primaryMedia
      ? primaryMedia.url.startsWith("http")
        ? primaryMedia.url
        : `${API_BASE}${primaryMedia.url}`
      : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80";

    const title = isTiffin ? item.provider_name : item.title;
    const linkUrl = isTiffin
      ? `/tiffins/view/${item.id}`
      : `/accommodations/view/${item.id}`;
    const isRemoving = animatingId === item.favId;

    return (
      <div
        key={item.favId}
        className={`bg-surface rounded-xl border border-cardBorder shadow-sm flex flex-col group overflow-hidden hover:shadow-lg transition-all duration-300 ${
          isRemoving ? "scale-90 opacity-0" : "scale-100 opacity-100"
        }`}
      >
        <Link
          to={linkUrl}
          className="relative h-40 w-full bg-mainBg overflow-hidden block"
        >
          <img
            src={coverImg}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>

          {item.badge && renderSchemaBadge(item.badge)}

          {/* Remove Button */}
          <button
            onClick={(e) => handleRemoveFavorite(e, item, category)}
            className="absolute top-2 left-2 bg-white/90 backdrop-blur-md hover:bg-red-50 p-1.5 rounded-full transition-colors border border-white/20 shadow-md z-20 group/btn"
            title="Remove from favorites"
          >
            <Heart
              size={14}
              className="text-pink-500 fill-pink-500 group-hover/btn:scale-110 transition-transform"
            />
          </button>
        </Link>

        <div className="p-3.5 flex flex-col flex-grow gap-2.5">
          <div className="flex justify-between items-start gap-2">
            <h3 className="font-black text-sm text-primaryText leading-tight line-clamp-1">
              {title}
            </h3>
            <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-1.5 py-0.5 rounded text-[9px] text-amber-600 font-black shrink-0 shadow-sm">
              <Star size={10} className="fill-amber-500 text-amber-500" />{" "}
              {Number(item.rating_overall) > 0 ? item.rating_overall : "New"}
            </div>
          </div>

          <p className="text-[11px] font-medium text-secondaryText flex items-center gap-1.5">
            <MapPin size={11} className="shrink-0 text-tertiaryText" />{" "}
            {item.locality}, {item.city}
          </p>

          {!isTiffin && (
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex items-center gap-2">
                {renderGender(item.gender_preference)}
                <span className="bg-mainBg border border-cardBorder text-tertiaryText px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
                  {renderOccupant(item.occupant_type)}
                </span>
              </div>

              {/* FLATMATE OCCUPANT INDICATOR */}
              {item.listing_type === "flatmate_spot" && (
                <div className="flex items-center gap-1 bg-sky-50 text-sky-600 border border-sky-100 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider w-fit">
                  <Users size={10} /> {item.current_occupants_count} Living Here
                </div>
              )}
            </div>
          )}

          {isTiffin && (
            <div className="flex flex-wrap gap-2 mt-1">
              <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded text-[10px] font-bold capitalize">
                {(item.food_type || "pure_veg").replace(/_/g, " ")}
              </span>
              {item.jain_available && (
                <span className="bg-mainBg border border-cardBorder text-tertiaryText px-2 py-0.5 rounded text-[10px] font-bold">
                  Jain Available
                </span>
              )}
            </div>
          )}

          <div className="mt-auto pt-3 border-t border-cardBorder flex items-center justify-between">
            <div className="flex flex-col">
              <span className="text-[9px] font-bold text-tertiaryText uppercase tracking-widest">
                Starts From
              </span>
              <div className="text-sm font-black text-primaryText leading-none mt-0.5">
                {formatCurrency(
                  isTiffin ? item.price_per_meal_min : item.price_monthly_min
                )}
                <span className="text-[9px] font-bold text-secondaryText ml-0.5">
                  /{isTiffin ? "meal" : "mo"}
                </span>
              </div>
            </div>
            <Link
              to={linkUrl}
              className="bg-surface border border-cardBorder hover:border-[#5B4EE4] hover:text-[#5B4EE4] text-primaryText font-bold px-3 py-1.5 rounded-lg transition-colors text-[11px] shadow-sm"
            >
              Details
            </Link>
          </div>
        </div>
      </div>
    );
  };

  // Derived filtered items based on the new 3-tab structure
  const activeItems =
    activeTab === "tiffins"
      ? favorites.tiffins
      : activeTab === "pg"
      ? favorites.accommodations.filter((a) => a.listing_type === "pg")
      : favorites.accommodations.filter((a) =>
          ["flat", "flatmate_spot"].includes(a.listing_type)
        );

  const countPg = favorites.accommodations.filter(
    (a) => a.listing_type === "pg"
  ).length;
  const countFlats = favorites.accommodations.filter((a) =>
    ["flat", "flatmate_spot"].includes(a.listing_type)
  ).length;
  const countTiffins = favorites.tiffins.length;

  return (
    <div className="w-full min-h-screen bg-mainBg flex flex-col font-sans animate-in fade-in duration-300 pb-20">
      {/* Toast Notification with Undo Action */}
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
            <button
              onClick={toast.action.onClick}
              className="ml-2 px-3 py-1 bg-white/20 rounded-md border border-emerald-500/20 text-xs font-black shrink-0 hover:bg-white/40 transition-colors"
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}

      {/* Attractive Header Section */}
      <div className="bg-surface border-b border-cardBorder sticky top-0 z-30 shadow-sm relative overflow-hidden">
        {/* Soft Background Gradient for aesthetics */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[#5B4EE4]/5 rounded-full blur-3xl pointer-events-none transform translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-pink-500/5 rounded-full blur-3xl pointer-events-none transform -translate-x-1/2 translate-y-1/2"></div>

        <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-5 sm:py-6 relative z-10">
          <div className="flex items-center gap-4 mb-5">
            <button
              onClick={() => navigate(-1)}
              className="p-2 bg-mainBg border border-cardBorder rounded-full text-secondaryText hover:text-primaryText hover:shadow-sm transition-all shadow-xs"
            >
              <ArrowLeft size={18} />
            </button>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-primaryText tracking-tight flex items-center gap-2">
                <Heart className="text-pink-500 fill-pink-500" size={24} /> My
                Favorites
              </h1>
              <p className="text-[11px] sm:text-xs text-secondaryText font-medium mt-1">
                Shortlisted properties and services saved to your account.
              </p>
            </div>
          </div>

          {/* New 3-Tab Navigation */}
          <div className="flex gap-4 overflow-x-auto no-scrollbar pt-2 px-1">
            {[
              {
                id: "pg",
                icon: <Building2 size={16} />,
                label: "PGs",
                count: countPg,
              },
              {
                id: "flats",
                icon: <Home size={16} />,
                label: "Flats & Flatmates",
                count: countFlats,
              },
              {
                id: "tiffins",
                icon: <Utensils size={16} />,
                label: "Tiffins",
                count: countTiffins,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-2 text-xs sm:text-sm font-black uppercase tracking-widest transition-colors relative whitespace-nowrap flex items-center gap-2 ${
                  activeTab === tab.id
                    ? "text-primaryText"
                    : "text-secondaryText hover:text-primaryText"
                }`}
              >
                {tab.icon} {tab.label}
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-black transition-colors ${
                    activeTab === tab.id
                      ? "bg-[#5B4EE4] text-white shadow-sm"
                      : "bg-mainBg border border-cardBorder text-tertiaryText"
                  }`}
                >
                  {tab.count}
                </span>
                {activeTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-[3px] bg-[#5B4EE4] rounded-t-full shadow-[0_0_8px_rgba(91,78,228,0.5)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="max-w-[1440px] mx-auto px-4 lg:px-8 py-6 sm:py-8 w-full flex-grow flex flex-col">
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6 animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-[320px] bg-surface border border-cardBorder rounded-xl"
              ></div>
            ))}
          </div>
        ) : activeItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-grow py-16 text-center animate-in zoom-in-95 duration-500">
            <div className="w-20 h-20 bg-surface border border-cardBorder rounded-full flex items-center justify-center mb-5 shadow-sm">
              <Heart size={36} className="text-tertiaryText opacity-50" />
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-primaryText mb-2">
              No favorites here
            </h2>
            <p className="text-sm font-medium text-secondaryText max-w-xs mb-8 leading-relaxed">
              You haven't saved any{" "}
              {activeTab === "pg"
                ? "PGs"
                : activeTab === "flats"
                ? "Flats or Flatmates"
                : "Tiffin services"}
              . Browse the market and tap the heart icon to save them here.
            </p>
            <Link
              to={`/${activeTab === "tiffins" ? "tiffins" : "accommodations"}`}
              className="bg-[#5B4EE4] hover:bg-[#4b40ce] text-white px-6 py-3 rounded-xl font-black transition-all shadow-md hover:shadow-lg flex items-center gap-2 text-sm"
            >
              <Search size={16} /> Explore{" "}
              {activeTab === "tiffins" ? "Tiffins" : "Properties"}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
            {activeItems.map((item) =>
              renderCard(
                item,
                activeTab === "tiffins" ? "tiffins" : "accommodations"
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
