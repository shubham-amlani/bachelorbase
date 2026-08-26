import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  MapPin,
  Star,
  Share2,
  Heart,
  ChevronLeft,
  Wifi,
  Snowflake,
  Utensils,
  Sparkles,
  Bath,
  Tv,
  Droplet,
  Cctv,
  BatteryCharging,
  Bike,
  Car,
  Dumbbell,
  ChefHat,
  CheckCircle2,
  ShieldCheck,
  Info,
  Home,
  Users,
  IndianRupee,
  Loader2,
  ChevronRight,
  X,
  Map,
  Edit3,
  ArrowLeft,
  Armchair,
  Building2,
  Maximize2,
  ShieldAlert,
  Zap,
  User,
  MessageSquare,
  Lock,
  Unlock,
  Send,
} from "lucide-react";
import PhoneVerificationModal from "../../components/auth/PhoneVerificationModal";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

// --- OFFICIAL WHATSAPP SVG ---
const WhatsAppIcon = ({ size = 24, className = "" }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
  </svg>
);

// --- Formatting Helpers ---
const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val);
const formatDeposit = (dep) =>
  !dep || dep === "0"
    ? "No Deposit"
    : isNaN(Number(dep))
    ? dep
    : formatCurrency(dep);
const formatPropertyType = (type) =>
  type === "pg"
    ? "PG"
    : type === "flat"
    ? "Flat"
    : type === "flatmate_spot"
    ? "Flatmate Spot"
    : type;
const formatOccupantType = (type) =>
  type === "both" || type === "students_and_professionals"
    ? "Students & Professionals"
    : type.replace(/_/g, " ");

const getGenderColor = (pref) => {
  if (pref === "male_only") return "bg-blue-50 text-blue-600 border-blue-200";
  if (pref === "female_only") return "bg-pink-50 text-pink-600 border-pink-200";
  return "bg-purple-50 text-purple-600 border-purple-200";
};

// --- VERTICAL TICKET BADGE RENDERER ---
const renderVerticalBadges = (badges) => {
  if (!badges || !Array.isArray(badges) || badges.length === 0) return null;
  return (
    <div className="absolute bottom-4 left-4 bg-white/20 dark:bg-black/20 backdrop-blur-md border border-white/40 dark:border-white/10 p-1.5 rounded-full flex flex-col gap-2 z-20 shadow-[0_8px_16px_rgba(0,0,0,0.2)] pointer-events-none">
      {badges.includes("black") && (
        <div
          className="w-8 h-8 bg-black/90 rounded-full flex items-center justify-center shadow-sm"
          title="Premium Property"
        >
          <Star size={14} className="text-yellow-500 fill-yellow-500" />
        </div>
      )}
      {badges.includes("green") && (
        <div
          className="w-8 h-8 bg-emerald-500/95 rounded-full flex items-center justify-center shadow-sm"
          title="Prime Location"
        >
          <MapPin size={14} className="text-white" />
        </div>
      )}
      {badges.includes("blue") && (
        <div
          className="w-8 h-8 bg-blue-500/95 rounded-full flex items-center justify-center shadow-sm"
          title="Value Pick"
        >
          <ShieldCheck size={14} className="text-white" />
        </div>
      )}
    </div>
  );
};

const getAmenityIcon = (key) => {
  const icons = {
    wifi: <Wifi size={18} />,
    ac: <Snowflake size={18} />,
    food_included: <Utensils size={18} />,
    laundry: <Droplet size={18} />,
    cleaning: <Sparkles size={18} />,
    attached_washroom: <Bath size={18} />,
    refrigerator: <Tv size={18} />,
    ro_water: <Droplet size={18} />,
    cctv_security: <Cctv size={18} />,
    power_backup: <BatteryCharging size={18} />,
    parking_2wheeler: <Bike size={18} />,
    parking_4wheeler: <Car size={18} />,
    gym: <Dumbbell size={18} />,
    self_cooking_allowed: <ChefHat size={18} />,
  };
  return icons[key] || <CheckCircle2 size={18} />;
};

const formatKeyName = (key) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());

const StarRatingInput = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm font-bold text-secondaryText">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none"
        >
          <Star
            size={20}
            className={`${
              star <= value
                ? "text-amber-500 fill-amber-500"
                : "text-cardBorder"
            }`}
          />
        </button>
      ))}
    </div>
  </div>
);

export default function PublicAccommodationView() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [listing, setListing] = useState(null);
  const [media, setMedia] = useState([]);
  const [amenities, setAmenities] = useState([]);
  const [landmarks, setLandmarks] = useState([]);
  const [tags, setTags] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [linkedFlatmates, setLinkedFlatmates] = useState([]);

  // --- DOUBLE-BLIND FLATMATE CONNECTION STATES ---
  const [connectionRequest, setConnectionRequest] = useState(null);
  const [isProfileCompleteModalOpen, setIsProfileCompleteModalOpen] =
    useState(false);
  const [isConnectModalOpen, setIsConnectModalOpen] = useState(false);
  const [introMessage, setIntroMessage] = useState("");

  // Gallery & Swipe States
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isFullScreenViewerOpen, setIsFullScreenViewerOpen] = useState(false);
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    cleanliness: 5,
    amenities: 5,
    location: 5,
    owner_behavior: 5,
    value: 5,
    text: "",
  });

  const [loading, setLoading] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [toast, setToast] = useState(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [animatingHeart, setAnimatingHeart] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  const showToast = (msg, type = "success", action = null) => {
    setToast({ msg, type, action });
    setTimeout(() => setToast(null), 3500);
  };

  const logActivity = async (activityType) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      let sessionId = sessionStorage.getItem("bb_session_id");
      if (!sessionId) {
        sessionId = `anon_${Math.random().toString(36).substr(2, 9)}`;
        sessionStorage.setItem("bb_session_id", sessionId);
      }
      await supabase.from("user_activity_logs").insert({
        user_id: session?.user?.id || null,
        session_id: sessionId,
        activity_type: activityType,
        target_entity: "pg_flat_listings",
        target_entity_id: id,
      });
    } catch (err) {}
  };

  useEffect(() => {
    const fetchListing = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("pg_flat_listings")
        .select(
          `*, listing_media(*), listing_amenities(*), listing_landmarks_proximity(*), listing_highlight_tags(highlight_tags(*)), property_reviews(*, user:users(full_name, avatar_url))`
        )
        .eq("id", id)
        .eq("status", "active")
        .single();

      if (data) {
        setListing(data);
        const sortedMedia = (data.listing_media || []).sort(
          (a, b) =>
            b.is_primary - a.is_primary || a.display_order - b.display_order
        );
        setMedia(sortedMedia);
        setLandmarks(data.listing_landmarks_proximity || []);
        if (data.listing_highlight_tags)
          setTags(
            data.listing_highlight_tags
              .map((t) => t.highlight_tags)
              .filter(Boolean)
          );
        if (data.property_reviews)
          setReviews(
            data.property_reviews
              .filter((r) => r.status === "published")
              .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          );

        let parsedAmenities = [];
        const amData = Array.isArray(data.listing_amenities)
          ? data.listing_amenities[0]
          : data.listing_amenities;
        if (amData) {
          const standardAms = Object.entries(amData)
            .filter(
              ([k, v]) =>
                v === true &&
                ![
                  "listing_id",
                  "custom_amenities",
                  "ac_bill_separate",
                  "electricity_bill_separate",
                  "id",
                ].includes(k)
            )
            .map(([k]) => ({ name: formatKeyName(k), iconKey: k }));
          const customAms = (amData.custom_amenities || []).map((name) => ({
            name,
            iconKey: "custom",
          }));
          parsedAmenities = [...standardAms, ...customAms];
          setAmenities(parsedAmenities);
        }

        if (data.listing_type === "flatmate_spot") {
          const { data: linkedData } = await supabase
            .from("listing_linked_flatmates")
            .select("users(id, full_name, avatar_url)")
            .eq("listing_id", data.id);
          if (linkedData)
            setLinkedFlatmates(linkedData.map((l) => l.users).filter(Boolean));
        }

        await supabase.rpc("increment_listing_views", { row_id: data.id });
        logActivity("property_viewed");

        // Auth Checks for favorites & double-blind requests
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (session) {
          const { data: favData } = await supabase
            .from("saved_favorites")
            .select("id")
            .eq("user_id", session.user.id)
            .eq("listing_id", data.id)
            .maybeSingle();
          if (favData) setIsFavorite(true);

          if (data.listing_type === "flatmate_spot") {
            const { data: reqData } = await supabase
              .from("flatmate_requests")
              .select("*")
              .eq("requester_id", session.user.id)
              .eq("listing_id", id)
              .maybeSingle();
            if (reqData) setConnectionRequest(reqData);
          }
        }
      }
      setLoading(false);
    };
    fetchListing();
    window.scrollTo(0, 0);
  }, [id]);

  const requireVerifiedPhone = async (actionCallback) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      sessionStorage.setItem("returnTo", location.pathname);
      showToast("Please login to continue.", "error");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }
    const { data: profile } = await supabase
      .from("users")
      .select("is_phone_verified")
      .eq("id", session.user.id)
      .single();
    if (!(profile?.is_phone_verified || !!session.user.phone)) {
      setPendingAction(() => () => actionCallback(session.user));
      setIsPhoneModalOpen(true);
      return;
    }
    actionCallback(session.user);
  };

  const handleShare = async () => {
    const url = window.location.href;
    const title = listing?.title || "BachelorBase Property";
    const fallbackCopy = async () => {
      try {
        await navigator.clipboard.writeText(url);
        showToast("Link copied to clipboard!");
      } catch (err) {
        showToast("Failed to copy link.", "error");
      }
    };
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch (err) {
        if (err.name !== "AbortError") fallbackCopy();
      }
    } else fallbackCopy();
  };

  const handleFavorite = async () => {
    requireVerifiedPhone(async (user) => {
      setAnimatingHeart(true);
      setTimeout(() => setAnimatingHeart(false), 300);
      if (isFavorite) {
        setIsFavorite(false);
        await supabase
          .from("saved_favorites")
          .delete()
          .match({ user_id: user.id, listing_id: listing.id });
        showToast("Removed from favorites", "success");
      } else {
        setIsFavorite(true);
        await supabase
          .from("saved_favorites")
          .insert({ user_id: user.id, listing_id: listing.id });
        showToast("Added to favorites!", "success", {
          label: "View",
          url: "/favorites",
        });
      }
    });
  };

  // --- DOUBLE BLIND CONNECTION HANDLERS ---
  const handleDoubleBlindClick = () => {
    requireVerifiedPhone(async (user) => {
      if (linkedFlatmates.length === 0) {
        showToast(
          "No user is currently linked to this listing to receive requests.",
          "error"
        );
        return;
      }
      const { data: profile } = await supabase
        .from("flatmate_profiles")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!profile) {
        setIsProfileCompleteModalOpen(true);
      } else {
        setIsConnectModalOpen(true);
      }
    });
  };

  const submitConnectionRequest = async () => {
    setIsConnecting(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const targetUserId = linkedFlatmates[0].id; // Target the primary linked flatmate

      const { error } = await supabase.from("flatmate_requests").insert({
        requester_id: session.user.id,
        listing_id: listing.id,
        target_user_id: targetUserId,
        intro_message: introMessage,
      });

      if (error) throw error;

      showToast("Connection request sent successfully!", "success");
      setConnectionRequest({ status: "pending" });
      setIsConnectModalOpen(false);
    } catch (err) {
      showToast("Failed to send request.", "error");
    } finally {
      setIsConnecting(false);
    }
  };

  // Standard WhatsApp Connection
  const handleConnectClick = async () => {
    requireVerifiedPhone(async (user) => {
      setIsConnecting(true);
      try {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", user.id)
          .single();
        const userName = profile?.full_name || user.email.split("@")[0];
        const userPhone = profile?.phone_number || "Not Provided";
        const message = `Hi, I found your listing "${listing.title}" on BachelorBase. I am interested and would like to know more!`;

        await supabase.from("whatsapp_leads").insert({
          listing_id: listing.id,
          user_id: user.id,
          user_name: userName,
          user_phone: userPhone,
          prefilled_message: message,
        });
        await supabase.rpc("increment_whatsapp_clicks", { row_id: listing.id });
        logActivity("whatsapp_connect_clicked");

        const waLink = `https://wa.me/91${listing.owner_whatsapp.replace(
          /\D/g,
          ""
        )}?text=${encodeURIComponent(message)}`;
        window.open(waLink, "_blank");
      } catch (error) {
        showToast("Something went wrong.", "error");
      } finally {
        setIsConnecting(false);
      }
    });
  };

  const submitReview = async () => {
    requireVerifiedPhone(async (user) => {
      setIsSubmittingReview(true);
      try {
        const overall = (
          (reviewForm.cleanliness +
            reviewForm.amenities +
            reviewForm.location +
            reviewForm.owner_behavior +
            reviewForm.value) /
          5
        ).toFixed(1);
        const payload = {
          listing_id: listing.id,
          user_id: user.id,
          rating_cleanliness: reviewForm.cleanliness,
          rating_amenities: reviewForm.amenities,
          rating_location: reviewForm.location,
          rating_owner_behavior: reviewForm.owner_behavior,
          rating_value: reviewForm.value,
          rating_overall: overall,
          review_text: reviewForm.text,
          status: "published",
        };
        const { data, error } = await supabase
          .from("property_reviews")
          .insert(payload)
          .select("*, user:users(full_name, avatar_url)")
          .single();
        if (error) {
          if (error.code === "23505")
            showToast("You have already reviewed this property.", "error");
          else throw error;
        } else {
          setReviews([data, ...reviews]);
          showToast("Review submitted successfully!");
          setIsReviewOpen(false);
        }
      } catch (err) {
        showToast("Failed to submit review.", "error");
      } finally {
        setIsSubmittingReview(false);
      }
    });
  };

  // --- SWIPE GESTURE LOGIC ---
  const minSwipeDistance = 50;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEndHandler = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance)
      setActivePhotoIndex((prev) => (prev === media.length - 1 ? 0 : prev + 1));
    if (distance < -minSwipeDistance)
      setActivePhotoIndex((prev) => (prev === 0 ? media.length - 1 : prev - 1));
  };

  if (loading)
    return (
      <div className="min-h-screen bg-mainBg flex items-center justify-center">
        <Loader2 size={40} className="animate-spin text-[#5B4EE4]" />
      </div>
    );
  if (!listing)
    return (
      <div className="min-h-screen bg-mainBg flex flex-col items-center justify-center">
        <h1 className="text-xl font-black text-primaryText mb-2">
          Listing Not Found
        </h1>
        <button
          onClick={() => navigate(-1)}
          className="text-[#5B4EE4] font-bold"
        >
          Go Back
        </button>
      </div>
    );

  const isPg = listing.listing_type === "pg";
  const isFlat = listing.listing_type === "flat";
  const isFlatmate = listing.listing_type === "flatmate_spot";
  const rawAmenities = Array.isArray(listing.listing_amenities)
    ? listing.listing_amenities[0]
    : listing.listing_amenities;
  const getImageUrl = (url) =>
    url.startsWith("http") ? url : `${API_BASE}${url}`;

  // State calculations for privacy
  const isDoubleBlindLocked =
    isFlatmate && connectionRequest?.status !== "accepted";
  const displayPhone = isDoubleBlindLocked
    ? "+91 ••••• •••••"
    : listing.owner_phone;
  const displayWa = isDoubleBlindLocked
    ? "+91 ••••• •••••"
    : listing.owner_whatsapp || listing.owner_phone;

  return (
    <div className="w-full min-h-screen bg-mainBg font-sans pb-24 lg:pb-12 animate-in fade-in relative">
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
          className={`fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[500] border shadow-2xl px-6 py-3.5 rounded-full flex items-center gap-2.5 max-w-[90vw] whitespace-nowrap overflow-hidden animate-in slide-in-from-bottom-8 zoom-in-95 duration-300 ease-out ${
            toast.type === "error"
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-emerald-50 border-emerald-200 text-emerald-600"
          }`}
        >
          <Info size={18} className="shrink-0" />
          <span className="text-sm font-black tracking-wide truncate">
            {toast.msg}
          </span>
        </div>
      )}

      {/* --- PRIVACY MODALS --- */}
      {isProfileCompleteModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface border border-cardBorder rounded-3xl p-6 shadow-2xl w-full max-w-sm text-center animate-in zoom-in-95">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-100">
              <User size={32} />
            </div>
            <h3 className="text-xl font-black text-primaryText mb-2">
              Profile Required
            </h3>
            <p className="text-sm font-medium text-secondaryText mb-6">
              To ensure safety and compatibility, you must complete your
              Flatmate Profile before sending connection requests.
            </p>
            <div className="flex flex-col gap-2">
              <button
                onClick={() => navigate("/profile")}
                className="w-full bg-[#5B4EE4] hover:bg-[#4b40ce] text-white py-3.5 rounded-xl font-black transition-all shadow-md"
              >
                Create Flatmate Profile
              </button>
              <button
                onClick={() => setIsProfileCompleteModalOpen(false)}
                className="w-full py-3.5 text-secondaryText font-bold hover:text-primaryText transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {isConnectModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface border border-cardBorder rounded-3xl p-6 shadow-2xl w-full max-w-sm animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-black text-primaryText flex items-center gap-2">
                <ShieldCheck size={20} className="text-[#5B4EE4]" /> Request
                Connection
              </h3>
              <button
                onClick={() => setIsConnectModalOpen(false)}
                className="text-tertiaryText hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <p className="text-xs font-medium text-secondaryText mb-4 leading-relaxed">
              Introduce yourself briefly. If the flatmates find your profile
              compatible, you'll instantly unlock their contact details!
            </p>
            <textarea
              rows="3"
              placeholder="Hi, I'm looking for a flatmate and your place looks great. I am a clean and quiet student..."
              value={introMessage}
              onChange={(e) => setIntroMessage(e.target.value)}
              className="w-full bg-mainBg border border-cardBorder rounded-xl p-4 text-sm font-medium outline-none focus:border-[#5B4EE4] resize-none mb-4"
            />
            <button
              onClick={submitConnectionRequest}
              disabled={isConnecting || !introMessage.trim()}
              className="w-full bg-[#5B4EE4] hover:bg-[#4b40ce] text-white py-3.5 rounded-xl font-black transition-all shadow-md disabled:opacity-50 flex justify-center items-center gap-2"
            >
              {isConnecting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Send size={18} />
              )}{" "}
              Send Request
            </button>
          </div>
        </div>
      )}

      {/* FULL SCREEN LIGHTBOX VIEWER */}
      {isFullScreenViewerOpen && media.length > 0 && (
        <div className="fixed inset-0 z-[999] bg-black/98 backdrop-blur-xl flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between p-4 sm:p-6 shrink-0 absolute top-0 w-full z-50 pointer-events-none">
            <span className="text-white font-bold text-sm bg-white/10 px-4 py-1.5 rounded-full border border-white/20 pointer-events-auto">
              {activePhotoIndex + 1} / {media.length}
            </span>
            <button
              onClick={() => setIsFullScreenViewerOpen(false)}
              className="bg-white/10 border border-white/20 p-2 rounded-full text-white hover:bg-white/20 transition-colors pointer-events-auto"
            >
              <X size={24} />
            </button>
          </div>
          <div
            className="flex-1 flex items-center justify-center relative px-0 sm:px-16 min-h-0 w-full h-full"
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEndHandler}
          >
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIndex((prev) =>
                  prev === 0 ? media.length - 1 : prev - 1
                );
              }}
              className="absolute left-4 sm:left-8 p-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-full transition-colors z-10 hidden sm:block"
            >
              <ChevronLeft size={28} />
            </button>
            <img
              src={getImageUrl(media[activePhotoIndex].url)}
              draggable="false"
              className="w-full h-full object-contain select-none pointer-events-none"
              alt="Gallery View"
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActivePhotoIndex((prev) =>
                  prev === media.length - 1 ? 0 : prev + 1
                );
              }}
              className="absolute right-4 sm:right-8 p-3 bg-white/10 border border-white/20 hover:bg-white/20 text-white rounded-full transition-colors z-10 hidden sm:block"
            >
              <ChevronRight size={28} />
            </button>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface border border-cardBorder rounded-2xl p-5 sm:p-6 shadow-2xl w-full max-w-md animate-in zoom-in-95 flex flex-col gap-5">
            <div className="flex justify-between items-center border-b border-cardBorder pb-3">
              <h3 className="text-lg font-black text-primaryText">
                Write a Review
              </h3>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="text-secondaryText hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <StarRatingInput
                label="Cleanliness"
                value={reviewForm.cleanliness}
                onChange={(v) =>
                  setReviewForm({ ...reviewForm, cleanliness: v })
                }
              />
              <StarRatingInput
                label="Amenities"
                value={reviewForm.amenities}
                onChange={(v) => setReviewForm({ ...reviewForm, amenities: v })}
              />
              <StarRatingInput
                label="Location & Safety"
                value={reviewForm.location}
                onChange={(v) => setReviewForm({ ...reviewForm, location: v })}
              />
              <StarRatingInput
                label="Owner Behavior"
                value={reviewForm.owner_behavior}
                onChange={(v) =>
                  setReviewForm({ ...reviewForm, owner_behavior: v })
                }
              />
              <StarRatingInput
                label="Value for Money"
                value={reviewForm.value}
                onChange={(v) => setReviewForm({ ...reviewForm, value: v })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-bold text-secondaryText">
                Share your experience
              </span>
              <textarea
                rows="3"
                placeholder="Tell us what you loved or what could be better..."
                value={reviewForm.text}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, text: e.target.value })
                }
                className="w-full bg-mainBg border border-cardBorder rounded-xl p-3 text-sm font-medium outline-none focus:border-[#5B4EE4] resize-none"
              />
            </div>
            <button
              onClick={submitReview}
              disabled={isSubmittingReview}
              className="w-full bg-[#5B4EE4] hover:bg-[#4b40ce] text-white py-3 rounded-xl font-bold transition-all flex justify-center items-center gap-2"
            >
              {isSubmittingReview ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Star size={18} fill="currentColor" />
              )}{" "}
              Submit Review
            </button>
          </div>
        </div>
      )}

      {/* TOP NAV (Mobile) */}
      <div className="lg:hidden sticky top-0 z-40 bg-surface/90 backdrop-blur-md border-b border-cardBorder px-4 py-3 flex items-center justify-between shadow-sm">
        <button
          onClick={() => navigate(-1)}
          className="p-2 bg-mainBg border border-cardBorder rounded-full text-primaryText hover:bg-surface transition-colors"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleShare}
            className="p-2 bg-mainBg border border-cardBorder rounded-full text-primaryText transition-colors"
          >
            <Share2 size={16} />
          </button>
          <button
            onClick={handleFavorite}
            className="p-2 bg-mainBg border border-cardBorder rounded-full text-primaryText transition-colors"
          >
            <Heart
              size={16}
              className={`transition-transform duration-300 ease-out ${
                animatingHeart ? "scale-[1.7]" : "scale-100"
              }`}
              fill={isFavorite ? "#FF2E51" : "transparent"}
              color={isFavorite ? "#FF2E51" : "currentColor"}
            />
          </button>
        </div>
      </div>

      <div className="max-w-[1100px] mx-auto px-4 lg:px-8 mt-4 lg:mt-6">
        {/* BREADCRUMBS & DESKTOP NAV */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-secondaryText">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 hover:text-[#5B4EE4] transition-colors"
            >
              <ArrowLeft size={14} /> Back
            </button>
            <span>•</span>
            <span>
              {formatPropertyType(listing.listing_type).toUpperCase()}s in{" "}
              {listing.city}
            </span>
            <span>/</span>
            <span className="text-primaryText truncate">
              {listing.locality}
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-cardBorder rounded-xl text-xs font-bold hover:border-[#5B4EE4] hover:text-[#5B4EE4] transition-colors shadow-sm"
            >
              <Share2 size={14} /> Share
            </button>
            <button
              onClick={handleFavorite}
              className={`flex items-center gap-2 px-4 py-2.5 bg-surface border border-cardBorder rounded-xl text-xs font-bold transition-all shadow-sm ${
                isFavorite
                  ? "border-pink-200 text-pink-500 bg-pink-50/30 dark:bg-pink-500/10"
                  : "hover:border-pink-500 hover:text-pink-500"
              }`}
            >
              <Heart
                size={14}
                className={`transition-transform duration-300 ease-out ${
                  animatingHeart ? "scale-[1.7]" : "scale-100"
                }`}
                fill={isFavorite ? "#FF2E51" : "transparent"}
                color={isFavorite ? "#FF2E51" : "currentColor"}
              />{" "}
              {isFavorite ? "Saved" : "Save"}
            </button>
          </div>
        </div>

        {/* MAIN GRID LAYOUT */}
        <div className="flex flex-col lg:grid lg:grid-cols-12 gap-8 lg:gap-10">
          {/* LEFT COLUMN: Content */}
          <div className="lg:col-span-8 flex flex-col gap-6 sm:gap-8">
            {/* 1. Header Information */}
            <div className="flex flex-col gap-3">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest border shadow-sm ${getGenderColor(
                    listing.gender_preference
                  )}`}
                >
                  {listing.gender_preference === "male_only"
                    ? "Boys Only"
                    : listing.gender_preference === "female_only"
                    ? "Girls Only"
                    : "Unisex"}
                </span>
                <span className="bg-surface border border-cardBorder px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-widest text-secondaryText shadow-sm">
                  {formatPropertyType(listing.listing_type)}
                </span>
                <span className="bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-widest text-amber-600 flex items-center gap-1 shadow-sm">
                  <Star size={10} className="fill-amber-500" />{" "}
                  {Number(listing.rating_overall) > 0
                    ? listing.rating_overall
                    : "New"}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-primaryText leading-snug tracking-tight">
                {listing.title}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="text-sm font-bold text-secondaryText flex items-center gap-1.5">
                  <MapPin size={16} className="text-[#5B4EE4]" />{" "}
                  {listing.locality}, {listing.city}
                </span>
              </div>
            </div>

            {/* 2. INLINE DYNAMIC PHOTO GALLERY */}
            {media.length > 0 ? (
              <div className="flex flex-col gap-3 w-full">
                <div
                  className="w-full aspect-[4/3] sm:aspect-[16/9] rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-cardBorder overflow-hidden relative shadow-sm group"
                  onTouchStart={onTouchStart}
                  onTouchMove={onTouchMove}
                  onTouchEnd={onTouchEndHandler}
                >
                  <img
                    src={getImageUrl(media[activePhotoIndex].url)}
                    alt="Property"
                    draggable="false"
                    className="w-full h-full object-contain pointer-events-none select-none transition-transform duration-500"
                  />
                  {listing.badges?.length > 0 &&
                    renderVerticalBadges(listing.badges)}
                  {media.length > 1 && (
                    <>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex((prev) =>
                            prev === 0 ? media.length - 1 : prev - 1
                          );
                        }}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 shadow-sm hidden sm:block z-10"
                      >
                        <ChevronLeft size={24} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setActivePhotoIndex((prev) =>
                            prev === media.length - 1 ? 0 : prev + 1
                          );
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/20 backdrop-blur-md text-white border border-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/40 shadow-sm hidden sm:block z-10"
                      >
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                  <button
                    onClick={() => setIsFullScreenViewerOpen(true)}
                    className="absolute bottom-4 right-4 p-2.5 bg-black/60 backdrop-blur-md hover:bg-black/80 text-white rounded-xl transition-colors shadow-lg border border-white/20 group-hover:scale-105 z-10"
                  >
                    <Maximize2 size={18} />
                  </button>
                </div>
                {media.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                    {media.map((m, i) => (
                      <button
                        key={i}
                        onClick={() => setActivePhotoIndex(i)}
                        className={`relative w-20 h-16 sm:w-24 sm:h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${
                          activePhotoIndex === i
                            ? "border-[#5B4EE4] shadow-md"
                            : "border-transparent opacity-60 hover:opacity-100"
                        }`}
                      >
                        <img
                          src={getImageUrl(m.url)}
                          alt={`Thumb ${i + 1}`}
                          draggable="false"
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-full aspect-[16/9] rounded-2xl bg-surface border border-cardBorder flex items-center justify-center text-tertiaryText shadow-sm">
                <Building2 size={48} opacity={0.3} />
              </div>
            )}

            <hr className="border-cardBorder" />

            {/* 3. DYNAMIC QUICK STATS GRID */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-surface border border-cardBorder rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                <Building2 size={16} className="text-[#5B4EE4] mb-1" />
                <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                  Type
                </span>
                <span className="text-sm font-black text-primaryText leading-tight">
                  {formatPropertyType(listing.listing_type)}
                </span>
              </div>
              {(isFlat || isFlatmate) && listing.bhk_type && (
                <div className="bg-surface border border-cardBorder rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                  <Home size={16} className="text-[#5B4EE4] mb-1" />
                  <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                    Config
                  </span>
                  <span className="text-sm font-black text-primaryText leading-tight">
                    {listing.bhk_type}
                  </span>
                </div>
              )}
              {(isFlat || isFlatmate) && listing.furnishing_status && (
                <div className="bg-surface border border-cardBorder rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                  <Armchair size={16} className="text-[#5B4EE4] mb-1" />
                  <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                    Furnishing
                  </span>
                  <span className="text-sm font-black text-primaryText capitalize leading-tight">
                    {listing.furnishing_status.replace("_", " ")}
                  </span>
                </div>
              )}
              {isPg && (
                <>
                  <div className="bg-surface border border-cardBorder rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                    <Users size={16} className="text-[#5B4EE4] mb-1" />
                    <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                      Occupant
                    </span>
                    <span className="text-sm font-black text-primaryText capitalize leading-tight">
                      {formatOccupantType(listing.occupant_type)}
                    </span>
                  </div>
                  {listing.hall_capacity > 0 && (
                    <div className="bg-surface border border-cardBorder rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                      <Home size={16} className="text-[#5B4EE4] mb-1" />
                      <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                        Hall Config
                      </span>
                      <span className="text-sm font-black text-primaryText leading-tight">
                        {listing.hall_capacity} People
                      </span>
                    </div>
                  )}
                </>
              )}
              {isFlat && listing.carpet_area_sqft && (
                <div className="bg-surface border border-cardBorder rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                  <Maximize2 size={16} className="text-[#5B4EE4] mb-1" />
                  <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                    Area
                  </span>
                  <span className="text-sm font-black text-primaryText leading-tight">
                    {listing.carpet_area_sqft} sq ft
                  </span>
                </div>
              )}
              {isFlatmate && (
                <div className="bg-surface border border-cardBorder rounded-2xl p-4 flex flex-col gap-1 shadow-sm">
                  <Users size={16} className="text-[#5B4EE4] mb-1" />
                  <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                    Currently Living
                  </span>
                  <span className="text-sm font-black text-primaryText leading-tight">
                    {listing.current_occupants_count} People
                  </span>
                </div>
              )}
            </div>

            <hr className="border-cardBorder" />

            {/* 4. Amenities Matrix */}
            <div className="flex flex-col gap-4 mt-2">
              <h2 className="text-lg font-black text-primaryText">
                What this place offers
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-y-5 gap-x-4">
                {amenities.length > 0 ? (
                  amenities.map((am, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 text-sm font-bold text-primaryText"
                    >
                      <div className="p-2 bg-surface border border-cardBorder rounded-lg text-secondaryText shadow-sm shrink-0">
                        {getAmenityIcon(am.iconKey)}
                      </div>
                      <span className="leading-snug mt-1.5">{am.name}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-sm text-secondaryText italic col-span-3">
                    No amenities listed by owner.
                  </span>
                )}
              </div>
            </div>

            <hr className="border-cardBorder" />

            {/* 5. Highlights & Landmarks */}
            {(tags.length > 0 || landmarks.length > 0) && (
              <div className="flex flex-col gap-6">
                {tags.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h2 className="text-lg font-black text-primaryText">
                      Property Highlights
                    </h2>
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag, i) => (
                        <span
                          key={i}
                          className="bg-[#5B4EE4]/10 text-[#5B4EE4] border border-[#5B4EE4]/20 px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider shadow-sm"
                        >
                          {tag.tag_name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {landmarks.length > 0 && (
                  <div className="flex flex-col gap-4 mt-2">
                    <h2 className="text-lg font-black text-primaryText">
                      Proximity & Landmarks
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {landmarks.map((lm) => (
                        <div
                          key={lm.id}
                          className="flex items-center gap-4 bg-surface border border-cardBorder p-4 rounded-2xl shadow-sm hover:border-[#5B4EE4]/30 transition-colors"
                        >
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100 flex items-center justify-center shrink-0">
                            <Map size={18} />
                          </div>
                          <div className="flex flex-col min-w-0">
                            <span className="text-sm font-black text-primaryText truncate">
                              {lm.landmark_name}
                            </span>
                            <span className="text-xs font-bold text-secondaryText mt-0.5">
                              {lm.walking_time_mins} mins walk •{" "}
                              {lm.distance_meters}m
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <hr className="border-cardBorder mt-2" />
              </div>
            )}

            {/* 6. MOBILE PRICING & TERMS */}
            <div className="lg:hidden bg-surface p-6 rounded-3xl border border-cardBorder shadow-md mb-2 flex flex-col gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest mb-1">
                  {isPg ? "Rent Starts From" : "Monthly Rent"}
                </span>
                <div className="flex items-end gap-1 flex-wrap">
                  <span className="text-2xl font-black text-primaryText leading-none">
                    {formatCurrency(listing.price_monthly_min)}
                  </span>
                  {listing.price_monthly_max > listing.price_monthly_min && (
                    <span className="text-lg font-bold text-secondaryText mb-[2px]">
                      {" "}
                      - {formatCurrency(listing.price_monthly_max)}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-secondaryText">Security Deposit</span>
                  <span className="text-primaryText capitalize">
                    {formatDeposit(listing.deposit_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-secondaryText">Notice Period</span>
                  <span className="text-primaryText capitalize">
                    {listing.notice_period_days} Days
                  </span>
                </div>
                {isPg && listing.sharing_types.length > 0 && (
                  <div className="pt-3 mt-1 border-t border-cardBorder">
                    <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest block mb-2">
                      Available Sharing Types
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.sharing_types.map((type) => (
                        <span
                          key={type}
                          className="bg-mainBg border border-cardBorder text-tertiaryText px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PRIVACY SHIELD MOBILE BUTTONS */}
              {isDoubleBlindLocked ? (
                <button
                  onClick={
                    connectionRequest?.status === "pending"
                      ? null
                      : handleDoubleBlindClick
                  }
                  disabled={connectionRequest?.status === "pending"}
                  className={`w-full py-3.5 rounded-xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                    connectionRequest?.status === "pending"
                      ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
                      : "bg-[#5B4EE4] text-white hover:bg-[#4b40ce] active:scale-95"
                  }`}
                >
                  {connectionRequest?.status === "pending" ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Lock size={20} />
                  )}
                  {connectionRequest?.status === "pending"
                    ? "Request Pending..."
                    : "Request to Connect"}
                </button>
              ) : (
                <button
                  onClick={handleConnectClick}
                  disabled={isConnecting}
                  className="w-full bg-[#25D366] hover:bg-[#20b858] text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                >
                  {isConnecting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <WhatsAppIcon size={20} />
                  )}{" "}
                  Connect on WhatsApp
                </button>
              )}
            </div>
            <hr className="lg:hidden border-cardBorder" />

            {/* 7. Rules & Utilities Block */}
            <div className="bg-surface p-5 sm:p-6 rounded-2xl border border-cardBorder shadow-sm">
              <h2 className="text-sm font-black text-primaryText mb-4 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={18} className="text-indigo-500" /> Rules &
                Utilities
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-mainBg p-3 rounded-xl border border-cardBorder flex items-center gap-3">
                  <div className="p-2 bg-indigo-500/10 text-indigo-600 rounded-lg">
                    <ChefHat size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-secondaryText uppercase tracking-wider">
                      Food Rule
                    </span>
                    <span className="text-xs font-black text-primaryText truncate capitalize">
                      {(
                        listing.food_preference_rule || "Not Specified"
                      ).replace(/_/g, " ")}
                    </span>
                  </div>
                </div>
                <div className="bg-mainBg p-3 rounded-xl border border-cardBorder flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      rawAmenities?.ac_bill_separate
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    <Zap size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-secondaryText uppercase tracking-wider">
                      AC Bill
                    </span>
                    <span className="text-xs font-black text-primaryText truncate">
                      {rawAmenities?.ac_bill_separate
                        ? "Paid Separately"
                        : "Included in Rent"}
                    </span>
                  </div>
                </div>
                <div className="bg-mainBg p-3 rounded-xl border border-cardBorder flex items-center gap-3">
                  <div
                    className={`p-2 rounded-lg ${
                      rawAmenities?.electricity_bill_separate
                        ? "bg-amber-500/10 text-amber-600"
                        : "bg-emerald-500/10 text-emerald-600"
                    }`}
                  >
                    <Zap size={16} />
                  </div>
                  <div className="flex flex-col min-w-0">
                    <span className="text-[10px] font-bold text-secondaryText uppercase tracking-wider">
                      Electricity
                    </span>
                    <span className="text-xs font-black text-primaryText truncate">
                      {rawAmenities?.electricity_bill_separate
                        ? "Paid Separately"
                        : "Included in Rent"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <hr className="border-cardBorder" />

            {/* 8. Description */}
            <div className="flex flex-col gap-3">
              <h2 className="text-lg font-black text-primaryText">
                About this property
              </h2>
              <p className="text-sm font-medium text-secondaryText leading-relaxed whitespace-pre-wrap">
                {listing.description}
              </p>
            </div>

            <hr className="border-cardBorder" />

            {/* Linked Flatmates UI (Public Read-Only) */}
            {isFlatmate && linkedFlatmates.length > 0 && (
              <>
                <div className="bg-[#5B4EE4]/5 border border-[#5B4EE4]/20 p-5 sm:p-6 rounded-2xl flex flex-col gap-4">
                  <h2 className="text-sm font-black text-primaryText uppercase tracking-wider flex items-center gap-2">
                    <Users size={18} className="text-[#5B4EE4]" /> Meet Your
                    Potential Flatmates
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {linkedFlatmates.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 bg-surface border border-cardBorder shadow-sm rounded-xl"
                      >
                        <div className="w-10 h-10 rounded-full bg-mainBg text-[#5B4EE4] flex items-center justify-center font-bold text-sm shrink-0 overflow-hidden border border-cardBorder">
                          {user.avatar_url ? (
                            <img
                              src={user.avatar_url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={18} className="text-secondaryText" />
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-black text-primaryText truncate">
                            {user.full_name}
                          </span>
                          <span className="text-[10px] font-bold text-secondaryText uppercase tracking-widest mt-0.5">
                            Verified User
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <hr className="border-cardBorder mt-2" />
              </>
            )}

            {/* 9. Reviews Section */}
            <div className="flex flex-col gap-6">
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-black text-primaryText">
                    Guest Reviews
                  </h2>
                  <div className="flex items-center gap-1.5 text-base font-black text-primaryText">
                    <Star size={18} className="text-amber-500 fill-amber-500" />{" "}
                    {Number(listing.rating_overall) > 0
                      ? listing.rating_overall
                      : "New"}
                  </div>
                </div>
                <button
                  onClick={() => setIsReviewOpen(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-surface border border-cardBorder rounded-xl text-xs font-bold hover:text-[#5B4EE4] hover:border-[#5B4EE4]/50 transition-colors shadow-sm"
                >
                  <Edit3 size={14} /> Write Review
                </button>
              </div>

              {reviews.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-surface border border-cardBorder p-5 rounded-2xl flex flex-col gap-3 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-full bg-mainBg border border-cardBorder flex items-center justify-center shrink-0 overflow-hidden">
                            {rev.user?.avatar_url ? (
                              <img
                                src={rev.user.avatar_url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={14} className="text-secondaryText" />
                            )}
                          </div>
                          <span className="text-sm font-bold text-primaryText truncate">
                            {rev.user?.full_name || "Anonymous User"}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded text-xs font-black text-amber-600 shadow-sm">
                          <Star size={10} className="fill-amber-500" />{" "}
                          {rev.rating_overall}
                        </div>
                      </div>
                      <p className="text-sm text-secondaryText font-medium leading-relaxed italic">
                        "{rev.review_text}"
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 bg-surface border border-cardBorder rounded-2xl text-center flex flex-col items-center shadow-sm">
                  <Star
                    size={28}
                    className="text-tertiaryText mb-2 opacity-50"
                  />
                  <span className="text-sm font-bold text-secondaryText">
                    No reviews yet. Be the first to share your experience!
                  </span>
                </div>
              )}
            </div>

            <div className="h-4 lg:h-10"></div>
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: Sticky Desktop Pricing & Shield        */}
          {/* ==================================================== */}
          <div className="hidden lg:block lg:col-span-4 relative">
            <div className="sticky top-28 bg-surface border border-cardBorder rounded-3xl p-6 shadow-xl flex flex-col gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest mb-1">
                  {isPg ? "Rent Starts From" : "Monthly Rent"}
                </span>
                <div className="flex items-end gap-1 flex-wrap">
                  <span className="text-2xl xl:text-3xl font-black text-primaryText leading-none">
                    {formatCurrency(listing.price_monthly_min)}
                  </span>
                  {listing.price_monthly_max > listing.price_monthly_min && (
                    <span className="text-lg font-bold text-secondaryText mb-[2px]">
                      {" "}
                      - {formatCurrency(listing.price_monthly_max)}
                    </span>
                  )}
                </div>
                {isPg && (
                  <span className="text-[10px] font-bold text-tertiaryText mt-2">
                    *Prices vary based on sharing type.
                  </span>
                )}
              </div>

              <hr className="border-cardBorder" />

              {/* MASKED CONTACT BLOCK */}
              <div className="flex flex-col gap-2">
                <span className="text-[10px] text-secondaryText uppercase font-bold tracking-wider">
                  Host Contact
                </span>
                <p className="font-mono text-sm font-black text-primaryText">
                  {displayPhone}{" "}
                  <span className="text-tertiaryText mx-1">|</span> {displayWa}
                </p>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-secondaryText">Security Deposit</span>
                  <span className="text-primaryText capitalize">
                    {formatDeposit(listing.deposit_amount)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm font-bold">
                  <span className="text-secondaryText">Notice Period</span>
                  <span className="text-primaryText capitalize">
                    {listing.notice_period_days} Days
                  </span>
                </div>
                {isPg && listing.sharing_types.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-cardBorder">
                    <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest block mb-2">
                      Available Sharing Types
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {listing.sharing_types.map((type) => (
                        <span
                          key={type}
                          className="bg-mainBg border border-cardBorder text-tertiaryText px-2 py-1 rounded text-[10px] font-bold uppercase tracking-widest"
                        >
                          {type}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PRIVACY SHIELD DESKTOP BUTTONS */}
              {isDoubleBlindLocked ? (
                <button
                  onClick={
                    connectionRequest?.status === "pending"
                      ? null
                      : handleDoubleBlindClick
                  }
                  disabled={connectionRequest?.status === "pending"}
                  className={`w-full py-3.5 rounded-xl font-black text-sm transition-all shadow-md flex items-center justify-center gap-2 ${
                    connectionRequest?.status === "pending"
                      ? "bg-zinc-200 text-zinc-500 dark:bg-zinc-800"
                      : "bg-[#5B4EE4] text-white hover:bg-[#4b40ce] active:scale-95"
                  }`}
                >
                  {connectionRequest?.status === "pending" ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Lock size={20} />
                  )}
                  {connectionRequest?.status === "pending"
                    ? "Request Pending..."
                    : "Request to Connect"}
                </button>
              ) : (
                <button
                  onClick={handleConnectClick}
                  disabled={isConnecting}
                  className="w-full bg-[#25D366] hover:bg-[#20b858] text-white py-3.5 rounded-xl font-black text-sm transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70"
                >
                  {isConnecting ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <WhatsAppIcon size={20} />
                  )}{" "}
                  Connect on WhatsApp
                </button>
              )}

              {/* Dynamic Info Alert */}
              <div
                className={`p-4 border rounded-xl flex gap-3 items-start shadow-sm ${
                  isDoubleBlindLocked
                    ? "bg-[#5B4EE4]/5 border-[#5B4EE4]/20"
                    : "bg-emerald-500/5 border-emerald-500/20"
                }`}
              >
                {isDoubleBlindLocked ? (
                  <>
                    <ShieldCheck
                      size={18}
                      className="text-[#5B4EE4] shrink-0 mt-0.5"
                    />
                    <p className="text-[10px] font-bold text-secondaryText leading-relaxed">
                      <span className="text-[#5B4EE4]">Privacy Protected.</span>{" "}
                      Contact numbers are masked for security. Send a connection
                      request to unlock the host's details.
                    </p>
                  </>
                ) : (
                  <>
                    <Unlock
                      size={18}
                      className="text-emerald-500 shrink-0 mt-0.5"
                    />
                    <p className="text-[10px] font-bold text-secondaryText leading-relaxed">
                      <span className="text-emerald-500">
                        Contact Unlocked.
                      </span>{" "}
                      The host has accepted your request or this is an open
                      listing. Feel free to connect directly.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
