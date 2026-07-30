import { useState, useEffect, useRef } from "react";
import React from "react";
import { supabase } from "../../lib/supabase";
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
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useLoadScript } from "@react-google-maps/api";
import PhoneVerificationModal from "../../components/auth/PhoneVerificationModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

const globalCache = {
  banners: null,
  featured: { pg: null, flat: null, flatmate_spot: null, tiffin: null },
};

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

export default function Home() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLocating, setIsLocating] = useState(false);
  const searchContainerRef = useRef(null);

  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const typingTimeoutRef = useRef(null);

  const [toast, setToast] = useState(null);

  // States for Dynamic Favorites
  const [savedFavorites, setSavedFavorites] = useState(new Set());
  const [animatingHeart, setAnimatingHeart] = useState(null);

  // Modal State for Phone Verification
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const [libraries] = useState(["places"]);
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries,
    version: "weekly",
  });

  const [banners, setBanners] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);

  const [activeTab, setActiveTab] = useState("pg");
  const [featuredListings, setFeaturedListings] = useState([]);
  const [loadingListings, setLoadingListings] = useState(false);

  // Modified Toast to support interactive action links
  const showToast = (msg, type = "success", action = null) => {
    setToast({ msg, type, action });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    const fetchBanners = async () => {
      if (globalCache.banners) {
        setBanners(globalCache.banners);
        return;
      }
      const { data, error } = await supabase
        .from("hero_banners")
        .select("*")
        .eq("is_active", true)
        .order("display_order", { ascending: true });
      if (!error && data) {
        globalCache.banners = data;
        setBanners(data);
      }
    };
    fetchBanners();
  }, []);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev === banners.length - 1 ? 0 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, [banners.length]);

  useEffect(() => {
    const fetchFeatured = async () => {
      if (globalCache.featured[activeTab]) {
        setFeaturedListings(globalCache.featured[activeTab]);
        return;
      }
      setLoadingListings(true);
      if (activeTab === "tiffin") {
        const { data } = await supabase
          .from("tiffin_services")
          .select("*, tiffin_media(url, is_primary)")
          .eq("is_active", true)
          .eq("is_featured_on_home", true)
          .order("home_display_order", { ascending: true });
        globalCache.featured[activeTab] = data || [];
        setFeaturedListings(data || []);
      } else {
        const { data } = await supabase
          .from("pg_flat_listings")
          .select("*, listing_media(url, is_primary), listing_amenities(*)")
          .eq("status", "active")
          .eq("listing_type", activeTab)
          .eq("is_featured_on_home", true)
          .order("home_display_order", { ascending: true });
        globalCache.featured[activeTab] = data || [];
        setFeaturedListings(data || []);
      }
      setLoadingListings(false);
    };
    fetchFeatured();
  }, [activeTab]);

  // Fetch user favorites on load
  useEffect(() => {
    const fetchUserFavorites = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase
        .from("saved_favorites")
        .select("listing_id, tiffin_id")
        .eq("user_id", session.user.id);
      if (data) {
        const favSet = new Set(
          data.map((item) => item.listing_id || item.tiffin_id)
        );
        setSavedFavorites(favSet);
      }
    };
    fetchUserFavorites();
  }, []);

  // --- THE CORE ARCHITECTURE: Secure Action Wrapper ---
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
      // User is logged in but has no verified phone. Trigger Modal!
      setPendingAction(() => actionCallback);
      setIsPhoneModalOpen(true);
      return;
    }

    // User is fully verified. Execute the action immediately.
    actionCallback(session.user.id);
  };

  // Bulletproof Favorite Toggle Logic wrapped in the architecture
  const handleFavoriteClick = async (e, listingId) => {
    e.preventDefault();
    e.stopPropagation();

    requireVerifiedPhone(async (userId) => {
      const isFav = savedFavorites.has(listingId);

      // Trigger animation pop
      setAnimatingHeart(listingId);
      setTimeout(() => setAnimatingHeart(null), 300);

      if (isFav) {
        // Optimistically remove
        setSavedFavorites((prev) => {
          const n = new Set(prev);
          n.delete(listingId);
          return n;
        });
        const { error } = await supabase
          .from("saved_favorites")
          .delete()
          .match({
            user_id: userId,
            [activeTab === "tiffin" ? "tiffin_id" : "listing_id"]: listingId,
          });
        if (error) showToast("Failed to remove.", "error");
        else showToast("Removed from favorites", "success");
      } else {
        // Optimistically add
        setSavedFavorites((prev) => {
          const n = new Set(prev);
          n.add(listingId);
          return n;
        });
        const payload =
          activeTab === "tiffin"
            ? { user_id: userId, tiffin_id: listingId }
            : { user_id: userId, listing_id: listingId };
        const { error } = await supabase
          .from("saved_favorites")
          .insert(payload);
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
      navigate(`/location-search?lat=${lat}&lng=${lng}&source=search`);
    } catch (error) {
      console.error("Error fetching exact location details:", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      )
        setSuggestions([]);
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
        (error) => {
          alert(
            "Please allow location access in your browser to use this feature."
          );
          setIsLocating(false);
        }
      );
    } else alert("Geolocation is not supported by your browser.");
  };

  const handleSearchSubmit = () => {
    if (inputValue.trim() !== "")
      navigate(`/location-search?q=${encodeURIComponent(inputValue)}`);
  };

  return (
    <div className="w-full min-h-screen bg-mainBg flex flex-col pb-16 overflow-hidden">
      <PhoneVerificationModal
        isOpen={isPhoneModalOpen}
        onClose={() => setIsPhoneModalOpen(false)}
        onSuccess={() => {
          setIsPhoneModalOpen(false);
          if (pendingAction) pendingAction();
        }}
      />

      {/* --- FUNKY ANIMATED PILL TOAST WITH ACTION --- */}
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

      {/* PREMIUM HERO SECTION */}
      <section className="relative w-full max-w-[1440px] mx-auto px-4 lg:px-8 mt-3 md:mt-4 mb-32 md:mb-20 flex flex-col">
        <div className="relative w-full h-[380px] md:h-auto md:aspect-[16/9] lg:aspect-[21/9] max-h-[550px] rounded-2xl md:rounded-3xl overflow-hidden bg-zinc-900 border border-cardBorder shadow-sm">
          {banners.length === 0 ? (
            <div className="w-full h-full flex flex-col items-center justify-center bg-surface text-tertiaryText">
              <Building2 size={48} className="mb-4 opacity-50" />
              <h1 className="text-xl md:text-2xl font-black text-primaryText opacity-80">
                Welcome to BachelorBase
              </h1>
            </div>
          ) : (
            banners.map((banner, index) => {
              const hasOverlayText =
                banner.title ||
                banner.subtitle ||
                (banner.tags && banner.tags.length > 0);
              const imgSource = banner.image_url.startsWith("http")
                ? banner.image_url
                : `${API_BASE}${banner.image_url}`;

              const BannerContent = (
                <div
                  className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                    index === currentSlide
                      ? "opacity-100 z-10"
                      : "opacity-0 z-0"
                  }`}
                >
                  <img
                    src={imgSource}
                    alt={banner.title || "Featured Content"}
                    className="absolute inset-0 w-full h-full object-cover z-0"
                  />

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

                  {banner.is_sponsored && (
                    <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 pointer-events-none">
                      <span className="bg-white/10 text-white/90 border border-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] uppercase tracking-widest font-bold shadow-sm">
                        Sponsored
                      </span>
                    </div>
                  )}

                  {hasOverlayText && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent z-10 pointer-events-none"></div>
                      <div className="absolute bottom-16 md:bottom-20 left-4 md:left-10 z-20 pr-6 flex flex-col gap-2 pointer-events-none">
                        {banner.title && (
                          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white drop-shadow-lg leading-tight">
                            {banner.title}
                          </h1>
                        )}
                        {banner.subtitle && (
                          <p className="text-gray-200 text-sm md:text-base font-medium max-w-xl drop-shadow-md line-clamp-2">
                            {banner.subtitle}
                          </p>
                        )}
                        {banner.tags && banner.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {banner.tags.map((tag) => (
                              <span
                                key={tag}
                                className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-full text-[11px] md:text-xs font-bold tracking-wide shadow-sm"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              );

              if (banner.target_url)
                return (
                  <a
                    key={banner.id}
                    href={banner.target_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full cursor-pointer"
                  >
                    {BannerContent}
                  </a>
                );
              return (
                <React.Fragment key={banner.id}>{BannerContent}</React.Fragment>
              );
            })
          )}
        </div>

        {/* Search Bar */}
        <div className="absolute bottom-0 translate-y-1/2 left-1/2 -translate-x-1/2 w-[92%] md:w-[88%] max-w-4xl z-30">
          <div className="flex flex-col md:flex-row items-center bg-surface rounded-2xl md:rounded-full p-2 shadow-xl border border-cardBorder gap-2 md:gap-0 relative">
            <div
              className="flex-1 flex flex-col w-full relative"
              ref={searchContainerRef}
            >
              <div className="flex items-center px-4 py-2.5 w-full">
                <Search className="text-accentBlue mr-3 shrink-0" size={18} />
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
                          className="text-tertiaryText shrink-0 mt-0.5 group-hover:text-accentBlue transition-colors"
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
                className="flex-1 md:flex-none flex items-center justify-center gap-1.5 text-primaryText font-bold text-xs px-3.5 py-3 hover:bg-mainBg rounded-xl md:rounded-full transition-colors border border-cardBorder md:border-transparent shrink-0"
              >
                <Crosshair
                  size={15}
                  className={`text-accentBlue ${
                    isLocating ? "animate-spin" : ""
                  }`}
                />
                <span>{isLocating ? "Locating..." : "Locate Me"}</span>
              </button>
              <button
                onClick={handleSearchSubmit}
                className="flex-1 md:flex-none bg-accentBlue text-white font-bold py-3 px-6 rounded-xl md:rounded-full shadow-md hover:bg-blue-600 active:scale-95 transition-all shrink-0 text-xs md:text-sm"
              >
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* --- QUICK CATEGORIES TABS --- */}
      <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 mb-6 md:mb-8 mt-2">
        <div className="flex gap-6 overflow-x-auto no-scrollbar border-b border-cardBorder pb-2">
          {[
            { id: "pg", icon: <Building2 size={19} />, label: "Premium PGs" },
            { id: "flat", icon: <HomeIcon size={19} />, label: "Flats" },
            {
              id: "flatmate_spot",
              icon: <Users size={19} />,
              label: "Flatmates",
            },
            {
              id: "tiffin",
              icon: <Utensils size={19} />,
              label: "Daily Tiffins",
            },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveTab(cat.id)}
              className={`flex flex-col items-center gap-1 min-w-[70px] transition-colors relative pb-2 ${
                activeTab === cat.id
                  ? "text-primaryText"
                  : "text-tertiaryText hover:text-primaryText"
              }`}
            >
              {cat.icon}
              <span className="text-[11px] font-bold whitespace-nowrap">
                {cat.label}
              </span>
              {activeTab === cat.id && (
                <span className="absolute bottom-0 left-0 w-full h-[2px] bg-primaryText rounded-t-full"></span>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* --- LIVE FEATURED PROPERTY CARDS --- */}
      <section className="w-full max-w-[1440px] mx-auto px-4 lg:px-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg md:text-xl font-bold text-primaryText tracking-tight">
            Featured {activeTab === "tiffin" ? "Services" : "Properties"}
          </h2>
          <Link
            to={`/${activeTab === "tiffin" ? "tiffins" : "accommodations"}`}
            className="text-xs md:text-sm font-bold text-accentBlue hover:underline"
          >
            View All &rarr;
          </Link>
        </div>

        {loadingListings ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-80 bg-surface border border-cardBorder rounded-xl"
              />
            ))}
          </div>
        ) : featuredListings.length === 0 ? (
          <div className="bg-surface border border-cardBorder rounded-2xl py-12 flex flex-col items-center text-center shadow-sm">
            <Star size={32} className="text-tertiaryText mb-2 opacity-50" />
            <span className="text-sm font-bold text-secondaryText">
              No featured items for this category currently.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {featuredListings.map((item) => {
              const imgObj =
                activeTab === "tiffin"
                  ? item.tiffin_media?.find((m) => m.is_primary) ||
                    item.tiffin_media?.[0]
                  : item.listing_media?.find((m) => m.is_primary) ||
                    item.listing_media?.[0];
              const coverImg = imgObj
                ? imgObj.url.startsWith("http")
                  ? imgObj.url
                  : `${API_BASE}${imgObj.url}`
                : "https://images.unsplash.com/photo-1555854877-bab0e564b8d5?auto=format&fit=crop&w=600&q=80";
              const title = item.title || item.provider_name;
              const linkUrl =
                activeTab === "tiffin"
                  ? `/tiffins/view/${item.id}`
                  : `/accommodations/view/${item.id}`;

              // Determine if this listing is favorited and if it's currently animating
              const isFav = savedFavorites.has(item.id);
              const isAnimating = animatingHeart === item.id;

              return (
                <div
                  key={item.id}
                  className="bg-surface rounded-2xl border border-cardBorder shadow-sm flex flex-col group overflow-hidden hover:shadow-lg transition-shadow"
                >
                  <div className="relative h-48 w-full bg-mainBg overflow-hidden">
                    <img
                      src={coverImg}
                      alt="Cover"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />

                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    {item.badge && renderSchemaBadge(item.badge)}

                    {/* Pop-Animated Favorite Button */}
                    <button
                      onClick={(e) => handleFavoriteClick(e, item.id)}
                      className="absolute top-2 left-2 bg-black/40 backdrop-blur-md hover:bg-black/60 p-1.5 rounded-full transition-colors border border-white/20 shadow-sm z-20"
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

                  <div className="p-4 flex flex-col flex-grow gap-3">
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

                    <p className="text-xs font-medium text-secondaryText flex items-center gap-1.5">
                      <MapPin
                        size={12}
                        className="shrink-0 text-tertiaryText"
                      />{" "}
                      {item.locality}, {item.city}
                    </p>

                    {activeTab !== "tiffin" && (
                      <div className="flex items-center gap-2">
                        {renderGender(item.gender_preference)}
                        <span className="bg-mainBg border border-cardBorder text-tertiaryText px-2 py-0.5 rounded text-[10px] font-bold tracking-wide">
                          {renderOccupant(item.occupant_type)}
                        </span>
                      </div>
                    )}

                    {activeTab === "tiffin" && (
                      <div className="flex flex-wrap gap-2">
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
                        <div className="text-lg font-black text-primaryText leading-none mt-0.5">
                          ₹
                          {activeTab === "tiffin"
                            ? item.price_per_meal_min
                            : item.price_monthly_min}
                          <span className="text-[10px] font-bold text-secondaryText ml-0.5">
                            /{activeTab === "tiffin" ? "meal" : "mo"}
                          </span>
                        </div>
                      </div>
                      <Link
                        to={linkUrl}
                        className="bg-surface border border-cardBorder hover:border-[#5B4EE4] hover:text-[#5B4EE4] text-primaryText font-bold px-4 py-2 rounded-xl transition-colors text-xs shadow-sm"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
