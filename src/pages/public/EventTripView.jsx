import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Calendar,
  IndianRupee,
  Clock,
  Users,
  CheckCircle2,
  XCircle,
  Navigation,
  Compass,
  ExternalLink,
  Phone,
  MessageCircle,
  Share2,
  Map as MapIcon,
  Ticket,
  Camera,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const MAP_LIBRARIES = ["places"];

const formatCurrency = (amount) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);

const formatDate = (dateString) => {
  if (!dateString) return "TBD";
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatTime = (timeString) => {
  if (!timeString) return "";
  const [hour, minute] = timeString.split(":");
  const h = parseInt(hour, 10);
  const ampm = h >= 12 ? "PM" : "AM";
  const formattedHour = h % 12 || 12;
  return `${formattedHour}:${minute} ${ampm}`;
};

const getImageUrl = (url) =>
  url ? (url.startsWith("http") ? url : `${API_BASE}${url}`) : null;

export default function EventTripView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState(null);
  const [loading, setLoading] = useState(true);

  // --- NATIVE SWIPE LIGHTBOX STATE ---
  const [lightboxIndex, setLightboxIndex] = useState(null);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchCurrentX, setTouchCurrentX] = useState(null);
  const [isSwiping, setIsSwiping] = useState(false);

  const { isLoaded } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
    libraries: MAP_LIBRARIES,
  });

  useEffect(() => {
    const fetchListing = async () => {
      try {
        const { data, error } = await supabase
          .from("events_and_trips")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        setListing(data);
      } catch (error) {
        console.error("Error fetching details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchListing();
  }, [id]);

  const isTrip = listing?.listing_class === "trip";
  const mediaArray = Array.isArray(listing?.media_urls)
    ? listing.media_urls
    : [];
  const coverImage =
    mediaArray.length > 0
      ? getImageUrl(mediaArray[0])
      : "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?auto=format&fit=crop&w=1920&q=80";

  // --- TOUCH & MOUSE SWIPE LOGIC ---
  const openLightbox = (index) => setLightboxIndex(index);
  const closeLightbox = () => {
    setLightboxIndex(null);
    setIsSwiping(false);
  };

  const handlePointerDown = (clientX) => {
    setTouchStartX(clientX);
    setTouchCurrentX(clientX);
    setIsSwiping(true);
  };

  const handlePointerMove = (clientX) => {
    if (!isSwiping) return;
    setTouchCurrentX(clientX);
  };

  const handlePointerEnd = () => {
    if (!isSwiping) return;
    if (touchStartX !== null && touchCurrentX !== null) {
      const diff = touchStartX - touchCurrentX;
      const SWIPE_THRESHOLD = 60; // Pixels required to trigger slide change

      if (diff > SWIPE_THRESHOLD && lightboxIndex < mediaArray.length - 1) {
        setLightboxIndex((prev) => prev + 1);
      } else if (diff < -SWIPE_THRESHOLD && lightboxIndex > 0) {
        setLightboxIndex((prev) => prev - 1);
      }
    }
    setIsSwiping(false);
    setTouchStartX(null);
    setTouchCurrentX(null);
  };

  const nextImage = (e) => {
    e.stopPropagation();
    if (lightboxIndex < mediaArray.length - 1)
      setLightboxIndex((prev) => prev + 1);
  };
  const prevImage = (e) => {
    e.stopPropagation();
    if (lightboxIndex > 0) setLightboxIndex((prev) => prev - 1);
  };

  const dragOffset =
    isSwiping && touchCurrentX !== null && touchStartX !== null
      ? touchCurrentX - touchStartX
      : 0;

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (lightboxIndex === null) return;
      if (e.key === "Escape") closeLightbox();
      if (e.key === "ArrowRight" && lightboxIndex < mediaArray.length - 1)
        setLightboxIndex((prev) => prev + 1);
      if (e.key === "ArrowLeft" && lightboxIndex > 0)
        setLightboxIndex((prev) => prev - 1);
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [lightboxIndex, mediaArray.length]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-mainBg">
        <Loader2 size={40} className="animate-spin text-[#5B4EE4]" />
      </div>
    );
  if (!listing)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-mainBg">
        <h1 className="text-2xl font-black mb-4">Listing Not Found</h1>
        <button
          onClick={() => navigate(-1)}
          className="text-[#5B4EE4] font-bold"
        >
          Go Back
        </button>
      </div>
    );

  const inclusions = listing.inclusions_exclusions?.inclusions || [];
  const exclusions = listing.inclusions_exclusions?.exclusions || [];
  const itinerary = listing.itinerary || [];
  const routeStops = listing.route_stops || [];
  const mapCenter =
    listing.latitude && listing.longitude
      ? {
          lat: parseFloat(listing.latitude),
          lng: parseFloat(listing.longitude),
        }
      : null;

  return (
    <div className="w-full min-h-screen bg-mainBg font-sans pb-24 lg:pb-12 animate-in fade-in">
      {/* --- FULLSCREEN SWIPEABLE LIGHTBOX --- */}
      {lightboxIndex !== null && (
        <div
          className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-200 overflow-hidden"
          onClick={closeLightbox}
        >
          <button
            onClick={closeLightbox}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-rose-500 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
          >
            <X size={28} />
          </button>

          {mediaArray.length > 1 && lightboxIndex > 0 && (
            <button
              onClick={prevImage}
              className="hidden sm:flex absolute left-6 text-white/50 hover:text-white z-50 p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm transition-all"
            >
              <ChevronLeft size={36} />
            </button>
          )}
          {mediaArray.length > 1 && lightboxIndex < mediaArray.length - 1 && (
            <button
              onClick={nextImage}
              className="hidden sm:flex absolute right-6 text-white/50 hover:text-white z-50 p-3 bg-white/5 hover:bg-white/10 rounded-full backdrop-blur-sm transition-all"
            >
              <ChevronRightIcon size={36} />
            </button>
          )}

          {/* 1:1 Touch-Tracking Image Track */}
          <div
            className="w-full h-full flex items-center cursor-grab active:cursor-grabbing"
            style={{
              transform: `translateX(calc(-${
                lightboxIndex * 100
              }vw + ${dragOffset}px))`,
              transition: isSwiping
                ? "none"
                : "transform 0.4s cubic-bezier(0.25, 1, 0.5, 1)",
            }}
            onClick={(e) => e.stopPropagation()}
            onTouchStart={(e) => handlePointerDown(e.touches[0].clientX)}
            onTouchMove={(e) => handlePointerMove(e.touches[0].clientX)}
            onTouchEnd={handlePointerEnd}
            onMouseDown={(e) => handlePointerDown(e.clientX)}
            onMouseMove={(e) => handlePointerMove(e.clientX)}
            onMouseUp={handlePointerEnd}
            onMouseLeave={handlePointerEnd}
          >
            {mediaArray.map((url, i) => (
              <div
                key={i}
                className="w-[100vw] h-full flex-shrink-0 flex items-center justify-center p-2 sm:p-12 select-none"
              >
                <img
                  src={getImageUrl(url)}
                  className="max-w-full max-h-full object-contain drop-shadow-2xl rounded-xl pointer-events-none select-none"
                  alt={`Gallery image ${i + 1}`}
                  draggable={false}
                />
              </div>
            ))}
          </div>

          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 text-white text-sm font-bold tracking-widest bg-white/10 border border-white/20 backdrop-blur-md px-5 py-2 rounded-full z-50 pointer-events-none">
            {lightboxIndex + 1} / {mediaArray.length}
          </div>
        </div>
      )}

      {/* IMMERSIVE HERO */}
      <div className="relative w-full h-[40vh] sm:h-[50vh] md:h-[60vh] bg-black overflow-hidden border-b border-cardBorder">
        <img
          src={coverImage}
          alt="Cover"
          className="absolute inset-0 w-full h-full object-cover opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-mainBg via-mainBg/80 to-transparent"></div>

        <div className="absolute top-0 left-0 w-full p-4 sm:p-6 flex justify-between items-center z-20">
          <button
            onClick={() => navigate(-1)}
            className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors shadow-sm"
          >
            <ArrowLeft size={20} />
          </button>
          <button className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-xl text-white hover:bg-white/20 transition-colors shadow-sm">
            <Share2 size={20} />
          </button>
        </div>

        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-8 max-w-[1200px] mx-auto z-20 translate-y-4">
          <div className="flex flex-wrap gap-2 mb-3">
            <span
              className={`bg-${
                isTrip ? "sky" : "pink"
              }-500/90 backdrop-blur-md px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1.5 border border-white/20`}
            >
              {isTrip ? <MapIcon size={12} /> : <Ticket size={12} />}{" "}
              {listing.category}
            </span>
            <span className="bg-white/20 backdrop-blur-md border border-white/30 px-3 py-1 rounded-lg text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1.5">
              <MapPin size={12} /> {listing.location_city}
            </span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black text-primaryText leading-tight drop-shadow-md mb-2">
            {listing.title}
          </h1>
          {listing.tagline && (
            <p className="text-base sm:text-lg font-bold text-secondaryText drop-shadow-sm max-w-2xl">
              {listing.tagline}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 mt-8 flex flex-col lg:grid lg:grid-cols-12 gap-8 relative z-30">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
          {/* --- TOP HIGHLIGHTED GALLERY --- */}
          {mediaArray.length > 0 && (
            <div className="bg-surface border border-cardBorder p-5 sm:p-6 rounded-3xl shadow-sm">
              <h2 className="text-lg font-black text-primaryText mb-4 flex items-center gap-2">
                <ImageIcon
                  size={20}
                  className={isTrip ? "text-sky-500" : "text-pink-500"}
                />{" "}
                Experience Gallery
              </h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {mediaArray.map((url, i) => (
                  <div
                    key={i}
                    onClick={() => openLightbox(i)}
                    className={`relative w-full rounded-2xl overflow-hidden border border-cardBorder cursor-pointer group shadow-sm ${
                      i === 0 && mediaArray.length % 2 !== 0
                        ? "col-span-2 sm:col-span-3 aspect-video"
                        : "aspect-[4/3]"
                    }`}
                  >
                    <img
                      src={getImageUrl(url)}
                      alt={`Gallery ${i}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center backdrop-blur-[1px] opacity-0 group-hover:opacity-100">
                      <span className="text-white font-black tracking-widest uppercase text-[10px] bg-black/50 px-4 py-2 rounded-xl shadow-lg border border-white/20 scale-90 group-hover:scale-100 transition-transform">
                        View Full
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-surface border border-cardBorder p-4 rounded-2xl shadow-sm flex flex-col gap-1">
              <Calendar size={18} className="text-[#5B4EE4] mb-1" />
              <span className="text-[10px] font-black text-secondaryText uppercase tracking-widest">
                Date
              </span>
              <span className="text-sm font-bold text-primaryText">
                {formatDate(listing.start_date || listing.event_date)}
              </span>
            </div>
            {isTrip ? (
              <div className="bg-surface border border-cardBorder p-4 rounded-2xl shadow-sm flex flex-col gap-1">
                <Clock size={18} className="text-rose-500 mb-1" />
                <span className="text-[10px] font-black text-secondaryText uppercase tracking-widest">
                  Duration
                </span>
                <span className="text-sm font-bold text-primaryText">
                  {listing.duration_days}D / {listing.duration_nights}N
                </span>
              </div>
            ) : (
              <div className="bg-surface border border-cardBorder p-4 rounded-2xl shadow-sm flex flex-col gap-1">
                <Clock size={18} className="text-rose-500 mb-1" />
                <span className="text-[10px] font-black text-secondaryText uppercase tracking-widest">
                  Time
                </span>
                <span className="text-sm font-bold text-primaryText">
                  {formatTime(listing.start_time)} -{" "}
                  {formatTime(listing.end_time)}
                </span>
              </div>
            )}
            <div className="bg-surface border border-cardBorder p-4 rounded-2xl shadow-sm flex flex-col gap-1">
              <Users size={18} className="text-amber-500 mb-1" />
              <span className="text-[10px] font-black text-secondaryText uppercase tracking-widest">
                Capacity
              </span>
              <span className="text-sm font-bold text-primaryText">
                {listing.total_spots || "Limited"} Spots
              </span>
            </div>
            <div className="bg-surface border border-cardBorder p-4 rounded-2xl shadow-sm flex flex-col gap-1">
              <Navigation size={18} className="text-emerald-500 mb-1" />
              <span className="text-[10px] font-black text-secondaryText uppercase tracking-widest">
                Location
              </span>
              <span className="text-sm font-bold text-primaryText truncate">
                {listing.location_city}
              </span>
            </div>
          </div>

          <div className="bg-surface border border-cardBorder p-6 sm:p-8 rounded-3xl shadow-sm">
            <h2 className="text-lg font-black text-primaryText mb-4">
              About this {isTrip ? "Trip" : "Event"}
            </h2>
            <p className="text-sm font-medium text-secondaryText leading-relaxed whitespace-pre-wrap">
              {listing.description}
            </p>
          </div>

          <div className="bg-surface border border-cardBorder p-6 sm:p-8 rounded-3xl shadow-sm">
            <h2 className="text-lg font-black text-primaryText mb-4 flex items-center gap-2">
              <MapPin size={20} className="text-rose-500" />{" "}
              {isTrip ? "Route Summary" : "Venue Details"}
            </h2>
            {isTrip && routeStops.length > 0 ? (
              <div className="flex flex-wrap items-center gap-3">
                {routeStops.map((stop, i) => (
                  <React.Fragment key={i}>
                    <span className="bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-500/30 px-3 py-1.5 rounded-lg text-sm font-bold shadow-sm">
                      {stop}
                    </span>
                    {i < routeStops.length - 1 && (
                      <ArrowLeft
                        size={16}
                        className="text-rose-300 dark:text-rose-500/50 rotate-180"
                      />
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : !isTrip ? (
              <div className="flex flex-col gap-2">
                <span className="text-base font-bold text-primaryText">
                  {listing.venue_name}
                </span>
                <span className="text-sm text-secondaryText">
                  {listing.address}
                </span>
              </div>
            ) : (
              <span className="text-sm text-secondaryText italic">
                No route specified.
              </span>
            )}
          </div>

          {isTrip && itinerary.length > 0 && (
            <div className="bg-surface border border-cardBorder p-6 sm:p-8 rounded-3xl shadow-sm">
              <h2 className="text-lg font-black text-primaryText mb-6 flex items-center gap-2">
                <Compass size={20} className="text-sky-500" /> Day-by-Day
                Itinerary
              </h2>
              <div className="flex flex-col gap-6">
                {itinerary.map((day, i) => (
                  <div key={i} className="flex gap-4 relative">
                    {i < itinerary.length - 1 && (
                      <div className="absolute top-10 left-5 w-px h-full bg-cardBorder -z-10"></div>
                    )}
                    <div className="w-10 h-10 bg-sky-50 dark:bg-sky-500/10 text-sky-600 dark:text-sky-400 rounded-full flex items-center justify-center font-black text-sm shrink-0 border border-sky-200 dark:border-sky-500/30 z-10 shadow-sm">
                      D{day.day}
                    </div>
                    <div className="flex flex-col gap-1 pb-4">
                      <h3 className="text-base font-bold text-primaryText">
                        {day.title}
                      </h3>
                      <p className="text-sm text-secondaryText leading-relaxed">
                        {day.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(inclusions.length > 0 || exclusions.length > 0) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {inclusions.length > 0 && (
                <div className="bg-surface border border-cardBorder p-6 rounded-3xl shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-widest text-emerald-500 mb-4">
                    What's Included
                  </h2>
                  <div className="flex flex-col gap-3">
                    {inclusions.map((inc, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-sm font-bold text-primaryText"
                      >
                        <CheckCircle2
                          size={18}
                          className="text-emerald-500 shrink-0"
                        />{" "}
                        {inc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {exclusions.length > 0 && (
                <div className="bg-surface border border-cardBorder p-6 rounded-3xl shadow-sm">
                  <h2 className="text-sm font-black uppercase tracking-widest text-red-500 mb-4">
                    What's Excluded
                  </h2>
                  <div className="flex flex-col gap-3">
                    {exclusions.map((exc, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2.5 text-sm font-bold text-primaryText"
                      >
                        <XCircle size={18} className="text-red-500 shrink-0" />{" "}
                        {exc}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {mapCenter && (
            <div className="bg-surface border border-cardBorder p-6 sm:p-8 rounded-3xl shadow-sm">
              <h2 className="text-lg font-black text-primaryText mb-4 flex items-center gap-2">
                <MapPin size={20} className="text-rose-500" /> Location Map
              </h2>
              <div className="w-full h-[300px] rounded-2xl overflow-hidden border border-cardBorder shadow-inner">
                {isLoaded ? (
                  <GoogleMap
                    mapContainerStyle={{ width: "100%", height: "100%" }}
                    center={mapCenter}
                    zoom={15}
                    options={{
                      streetViewControl: false,
                      mapTypeControl: false,
                    }}
                  >
                    <Marker position={mapCenter} />
                  </GoogleMap>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-mainBg text-secondaryText text-sm">
                    Loading Map...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-24 flex flex-col gap-6">
            <div className="bg-surface border border-cardBorder rounded-3xl p-6 sm:p-8 shadow-xl">
              <div className="flex flex-col gap-1 mb-6">
                <span className="text-[10px] font-black text-secondaryText uppercase tracking-widest">
                  {isTrip ? "Price Per Person" : "Starting Ticket Price"}
                </span>
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-black text-emerald-600 dark:text-emerald-400 leading-none">
                    {listing.price_min > 0
                      ? formatCurrency(listing.price_min)
                      : "Free"}
                  </span>
                  {listing.price_max > listing.price_min && (
                    <span className="text-lg font-bold text-secondaryText mb-1 line-through opacity-60">
                      {formatCurrency(listing.price_max)}
                    </span>
                  )}
                </div>
                {listing.advance_amount > 0 && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/30 px-2 py-1 rounded w-fit mt-2">
                    Advance: {formatCurrency(listing.advance_amount)} required
                  </span>
                )}
              </div>

              <a
                href={
                  listing.action_cta_url ||
                  `https://wa.me/91${listing.contact_whatsapp?.replace(
                    /\D/g,
                    ""
                  )}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className={`w-full bg-${isTrip ? "sky" : "pink"}-500 hover:bg-${
                  isTrip ? "sky" : "pink"
                }-600 text-white py-4 rounded-2xl font-black text-sm transition-all shadow-[0_8px_20px_rgba(0,0,0,0.2)] flex items-center justify-center gap-2 active:scale-95`}
              >
                {listing.action_cta_label || "Book Now"}{" "}
                <ExternalLink size={16} />
              </a>

              <p className="text-[10px] text-tertiaryText text-center mt-4 font-bold uppercase tracking-widest">
                Listing ID: {listing.id.split("-")[0]}
              </p>
            </div>

            <div className="bg-surface border border-cardBorder rounded-3xl p-6 shadow-sm">
              <h3 className="text-sm font-black uppercase tracking-widest text-primaryText mb-4">
                Organizer
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-mainBg border border-cardBorder rounded-full flex items-center justify-center text-[#5B4EE4] font-black text-lg">
                    {listing.organizer_name.charAt(0)}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-primaryText">
                      {listing.organizer_name}
                    </span>
                    <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-4 border-t border-cardBorder">
                  {listing.contact_phone && (
                    <a
                      href={`tel:${listing.contact_phone}`}
                      className="flex items-center gap-3 p-3 bg-mainBg border border-cardBorder rounded-xl text-sm font-bold text-primaryText hover:border-[#5B4EE4] transition-colors"
                    >
                      <Phone size={16} className="text-[#5B4EE4]" />{" "}
                      {listing.contact_phone}
                    </a>
                  )}
                  {listing.contact_whatsapp && (
                    <a
                      href={`https://wa.me/91${listing.contact_whatsapp.replace(
                        /\D/g,
                        ""
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-mainBg border border-cardBorder rounded-xl text-sm font-bold text-primaryText hover:border-[#25D366] transition-colors"
                    >
                      <MessageCircle size={16} className="text-[#25D366]" />{" "}
                      WhatsApp
                    </a>
                  )}
                  {listing.instagram_url && (
                    <a
                      href={listing.instagram_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 p-3 bg-mainBg border border-cardBorder rounded-xl text-sm font-bold text-primaryText hover:border-pink-500 transition-colors"
                    >
                      <Camera size={16} className="text-pink-500" /> Instagram
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
