import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { GoogleMap, useJsApiLoader, Marker } from "@react-google-maps/api";
import {
  Loader2,
  ArrowLeft,
  MapPin,
  Phone,
  MessageCircle,
  ExternalLink,
  BadgeCheck,
  BookOpen,
  GraduationCap,
  Globe,
  ImageOff,
  CheckCircle2,
  Share2,
  Image as ImageIcon,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";
const MAP_LIBRARIES = ["places"];

const getImageUrl = (url) =>
  url ? (url.startsWith("http") ? url : `${API_BASE}${url}`) : null;

const tagColors = [
  "bg-pink-100 text-pink-700 border-pink-200 dark:bg-pink-500/10 dark:text-pink-400 dark:border-pink-500/30",
  "bg-violet-100 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30",
  "bg-cyan-100 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/30",
  "bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
  "bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
];

export default function InstituteView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [institute, setInstitute] = useState(null);
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
    const fetchInstitute = async () => {
      try {
        const { data, error } = await supabase
          .from("institutes_directory")
          .select("*")
          .eq("id", id)
          .single();
        if (error) throw error;
        setInstitute(data);
      } catch (error) {
        console.error("Error fetching institute details:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchInstitute();
  }, [id]);

  const mediaArray = Array.isArray(institute?.media_urls)
    ? institute.media_urls
    : [];
  const coverImage = mediaArray.length > 0 ? getImageUrl(mediaArray[0]) : null;
  const courses = Array.isArray(institute?.courses_offered)
    ? institute.courses_offered
    : [];
  const mapCenter =
    institute?.latitude && institute?.longitude
      ? {
          lat: parseFloat(institute.latitude),
          lng: parseFloat(institute.longitude),
        }
      : null;

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
      const SWIPE_THRESHOLD = 60;

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
        <Loader2 size={40} className="animate-spin text-indigo-500" />
      </div>
    );
  if (!institute)
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-mainBg">
        <h1 className="text-2xl font-black mb-4 text-primaryText">
          Institute Not Found
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="text-indigo-500 font-bold"
        >
          Go Back
        </button>
      </div>
    );

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
            className="absolute top-4 right-4 sm:top-6 sm:right-6 text-white/70 hover:text-indigo-500 z-50 p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all"
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
      <div className="relative w-full h-[35vh] sm:h-[45vh] bg-zinc-900 overflow-hidden border-b border-cardBorder">
        {coverImage ? (
          <img
            src={coverImage}
            alt="Cover"
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-800">
            <GraduationCap size={64} className="text-zinc-600" />
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-mainBg via-mainBg/60 to-transparent"></div>

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

        <div className="absolute bottom-0 left-0 w-full p-4 sm:p-8 max-w-[1200px] mx-auto z-20 translate-y-2">
          <div className="flex flex-wrap items-center gap-2 mb-3">
            <span className="bg-indigo-600/90 backdrop-blur-md border border-indigo-400 px-2.5 py-1 rounded text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1.5">
              <BookOpen size={12} /> {institute.category}
            </span>
            <span className="bg-white/20 backdrop-blur-md border border-white/30 px-2.5 py-1 rounded text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1.5">
              <MapPin size={12} /> {institute.city || "Location TBD"}
            </span>
            {institute.is_verified && (
              <span className="bg-blue-600/90 backdrop-blur-md border border-blue-400 px-2.5 py-1 rounded text-[10px] font-black uppercase text-white shadow-sm flex items-center gap-1">
                <BadgeCheck size={12} /> Verified
              </span>
            )}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black text-primaryText leading-tight drop-shadow-md mb-2 flex items-center gap-3">
            {institute.institute_name}
            {institute.is_verified && (
              <BadgeCheck
                className="text-blue-500 fill-white shrink-0 mt-1"
                size={32}
              />
            )}
          </h1>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-4 sm:px-8 mt-6 flex flex-col lg:grid lg:grid-cols-12 gap-8 relative z-30">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
          {/* --- TOP HIGHLIGHTED GALLERY --- */}
          {mediaArray.length > 0 && (
            <div className="bg-surface border border-cardBorder p-5 sm:p-6 rounded-3xl shadow-sm">
              <h2 className="text-lg font-black text-primaryText mb-4 flex items-center gap-2">
                <ImageIcon size={20} className="text-indigo-500" /> Facility
                Gallery
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

          <div className="bg-surface border border-cardBorder p-5 sm:p-6 rounded-3xl shadow-sm">
            <h2 className="text-sm font-black uppercase tracking-widest text-indigo-500 mb-4 flex items-center gap-2">
              <BookOpen size={18} /> Programs & Courses Offered
            </h2>
            {courses.length > 0 ? (
              <div className="flex flex-wrap gap-2.5">
                {courses.map((course, i) => (
                  <span
                    key={i}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm border ${
                      tagColors[i % tagColors.length]
                    }`}
                  >
                    {course}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-secondaryText italic">
                No courses listed for this institute.
              </span>
            )}
          </div>

          {institute.description && (
            <div className="bg-surface border border-cardBorder p-5 sm:p-6 rounded-3xl shadow-sm">
              <h2 className="text-sm font-black uppercase tracking-widest text-primaryText mb-3 flex items-center gap-2">
                <GraduationCap size={18} className="text-indigo-500" /> About
                Institute
              </h2>
              <p className="text-sm font-medium text-secondaryText leading-relaxed whitespace-pre-wrap">
                {institute.description}
              </p>
            </div>
          )}

          <div className="bg-surface border border-cardBorder p-5 sm:p-6 rounded-3xl shadow-sm flex flex-col gap-4">
            <h2 className="text-sm font-black uppercase tracking-widest text-rose-500 flex items-center gap-2">
              <MapPin size={18} /> Facility Location
            </h2>
            <div className="flex flex-col gap-3">
              <div className="p-4 bg-mainBg border border-cardBorder rounded-xl flex flex-col gap-1">
                <span className="text-sm font-bold text-secondaryText">
                  {institute.address || "Address not provided"}
                </span>
                <span className="text-xs font-black text-indigo-500 mt-1 uppercase tracking-widest">
                  {institute.city}
                </span>
              </div>
            </div>
            {mapCenter && (
              <div className="w-full h-[300px] rounded-xl overflow-hidden border border-cardBorder shadow-inner pointer-events-none mt-2">
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
            )}
            {institute.google_maps_url && (
              <a
                href={institute.google_maps_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 text-xs font-black text-white bg-rose-500 hover:bg-rose-600 transition-colors py-3 rounded-xl w-full shadow-sm mt-2"
              >
                <Globe size={16} /> Open in Google Maps
              </a>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:col-span-4 relative">
          <div className="sticky top-20 flex flex-col gap-4 sm:gap-6">
            <div className="bg-surface border border-cardBorder rounded-3xl p-6 shadow-xl">
              <h3 className="text-sm font-black uppercase tracking-widest text-primaryText mb-4">
                Contact Details
              </h3>
              <div className="flex flex-col gap-2.5 mb-6">
                {institute.contact_phone && (
                  <a
                    href={`tel:${institute.contact_phone}`}
                    className="flex items-center gap-3 p-3.5 bg-mainBg border border-cardBorder rounded-xl text-sm font-bold text-primaryText hover:border-indigo-500 hover:shadow-sm transition-all group"
                  >
                    <div className="bg-indigo-100 dark:bg-indigo-500/20 p-2 rounded-lg group-hover:bg-indigo-500 transition-colors">
                      <Phone
                        size={16}
                        className="text-indigo-600 dark:text-indigo-400 group-hover:text-white"
                      />
                    </div>
                    {institute.contact_phone}
                  </a>
                )}
                {institute.contact_whatsapp && (
                  <a
                    href={`https://wa.me/91${institute.contact_whatsapp.replace(
                      /\D/g,
                      ""
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-3.5 bg-mainBg border border-cardBorder rounded-xl text-sm font-bold text-primaryText hover:border-[#25D366] hover:shadow-sm transition-all group"
                  >
                    <div className="bg-green-100 dark:bg-green-500/20 p-2 rounded-lg group-hover:bg-[#25D366] transition-colors">
                      <MessageCircle
                        size={16}
                        className="text-green-600 dark:text-green-400 group-hover:text-white"
                      />
                    </div>
                    {institute.contact_whatsapp}
                  </a>
                )}
              </div>

              {institute.action_link ? (
                <div className="pt-5 border-t border-cardBorder">
                  <span className="text-[10px] font-black uppercase tracking-widest text-secondaryText mb-3 block">
                    Primary Action
                  </span>
                  <a
                    href={institute.action_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-blue-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 text-white py-4 rounded-xl font-black text-sm transition-all shadow-[0_8px_20px_rgba(99,102,241,0.3)] flex items-center justify-center gap-2 active:scale-95"
                  >
                    Visit Website <ExternalLink size={16} />
                  </a>
                </div>
              ) : (
                <div className="pt-5 border-t border-cardBorder text-center">
                  <span className="text-xs text-tertiaryText italic">
                    No Website Link Provided
                  </span>
                </div>
              )}
            </div>

            <div className="bg-surface border border-cardBorder rounded-3xl p-5 shadow-sm">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-secondaryText mb-3 flex items-center gap-2">
                <CheckCircle2 size={14} className="text-emerald-500" />{" "}
                Verification Status
              </h3>
              <p className="text-xs font-medium text-secondaryText leading-relaxed">
                {institute.is_verified
                  ? "This institute's details and contact information have been verified by our team."
                  : "This listing was submitted but has not yet been verified."}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
