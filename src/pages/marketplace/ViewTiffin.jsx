import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation, Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  MapPin,
  Star,
  ChefHat,
  Truck,
  Leaf,
  Info,
  Clock,
  Heart,
  MessageCircle,
  Share2,
  ChevronLeft,
  ChevronRight,
  Loader2,
  CheckCircle2,
  AlertCircle,
  User,
  X,
  Edit3,
  Trash2,
  ImageIcon,
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

const formatRent = (min, max) =>
  min === max
    ? formatCurrency(min)
    : `${formatCurrency(min)} - ${formatCurrency(max)}`;

// Official WhatsApp Icon SVG
const WhatsAppIconWhite = ({ size = 24, className = "" }) => (
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

// Interactive Star Input Component
const StarRatingInput = ({ label, value, onChange }) => (
  <div className="flex items-center justify-between py-2 border-b border-cardBorder last:border-0">
    <span className="text-sm font-bold text-secondaryText">{label}</span>
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          className="focus:outline-none transition-transform hover:scale-110"
        >
          <Star
            size={20}
            className={
              star <= value
                ? "text-amber-500 fill-amber-500"
                : "text-cardBorder"
            }
          />
        </button>
      ))}
    </div>
  </div>
);

export default function ViewTiffin() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [tiffin, setTiffin] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery States
  const [activeImage, setActiveImage] = useState(0);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Security & Auth States
  const [user, setUser] = useState(null);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [pendingAction, setPendingAction] = useState(null);

  // Interaction States
  const [isFav, setIsFav] = useState(false);
  const [animatingHeart, setAnimatingHeart] = useState(false);
  const [toast, setToast] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);

  // Review Architecture States
  const [reviews, setReviews] = useState([]);
  const [myReview, setMyReview] = useState(null);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  const defaultReviewForm = {
    rating_food: 0,
    rating_portion: 0,
    rating_packaging: 0,
    rating_delivery: 0,
    rating_value: 0,
    review_text: "",
  };
  const [reviewForm, setReviewForm] = useState(defaultReviewForm);

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchTiffinData();
  }, [id]);

  const fetchTiffinData = async () => {
    setLoading(true);
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const currentUser = session?.user || null;
      setUser(currentUser);

      // Fetch Core Tiffin Details
      const { data: tiffinData, error: tiffinError } = await supabase
        .from("tiffin_services")
        .select(`*, tiffin_media(url, is_primary)`)
        .eq("id", id)
        .single();

      if (tiffinError) throw tiffinError;
      setTiffin(tiffinData);

      // Check Favorites
      if (currentUser) {
        const { data: favData } = await supabase
          .from("saved_favorites")
          .select("id")
          .eq("user_id", currentUser.id)
          .eq("tiffin_id", id)
          .maybeSingle();
        if (favData) setIsFav(true);
      }

      // Fetch All Published Reviews
      const { data: reviewData } = await supabase
        .from("tiffin_reviews")
        .select(`*, users(full_name, avatar_url)`)
        .eq("tiffin_id", id)
        .eq("status", "published")
        .order("created_at", { ascending: false });

      let publicReviews = reviewData || [];

      // If user is logged in, extract their personal review (even if it's archived/hidden)
      if (currentUser) {
        const { data: myRevData } = await supabase
          .from("tiffin_reviews")
          .select(`*, users(full_name, avatar_url)`)
          .eq("tiffin_id", id)
          .eq("user_id", currentUser.id)
          .maybeSingle();

        if (myRevData) {
          setMyReview(myRevData);
          // Remove my review from the general public pool to avoid duplicates
          publicReviews = publicReviews.filter((r) => r.id !== myRevData.id);
        }
      }

      setReviews(publicReviews);
    } catch (err) {
      console.error(err);
      navigate("/tiffins");
    } finally {
      setLoading(false);
    }
  };

  // --- SECURITY WRAPPER ---
  const requireVerifiedPhone = async (actionCallback) => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      sessionStorage.setItem("returnTo", location.pathname);
      showToast("Please log in to continue.", "error");
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
    actionCallback(session.user);
  };

  // --- ACTIONS ---
  const handleFavorite = () => {
    requireVerifiedPhone(async (verifiedUser) => {
      setAnimatingHeart(true);
      setTimeout(() => setAnimatingHeart(false), 300);

      if (isFav) {
        setIsFav(false);
        const { error } = await supabase
          .from("saved_favorites")
          .delete()
          .match({ user_id: verifiedUser.id, tiffin_id: id });
        if (error) showToast("Failed to remove.", "error");
        else showToast("Removed from favorites", "success");
      } else {
        setIsFav(true);
        const { error } = await supabase
          .from("saved_favorites")
          .insert({ user_id: verifiedUser.id, tiffin_id: id });
        if (error && error.code !== "23505")
          showToast("Failed to save.", "error");
        else showToast("Added to favorites!", "success");
      }
    });
  };

  const handleWhatsAppConnect = () => {
    requireVerifiedPhone(async (verifiedUser) => {
      setIsConnecting(true);
      try {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", verifiedUser.id)
          .single();
        const userName = profile?.full_name || verifiedUser.email.split("@")[0];
        const userPhone = profile?.phone_number || "Not Provided";

        const message = `Hi ${tiffin.provider_name}, I saw your tiffin service on BachelorBase and wanted to inquire about your meal plans.`;

        await supabase.from("whatsapp_leads").insert({
          listing_id: id,
          user_id: verifiedUser.id,
          user_name: userName,
          user_phone: userPhone,
          prefilled_message: message,
        });

        const waLink = `https://wa.me/91${tiffin.whatsapp_number.replace(
          /\D/g,
          ""
        )}?text=${encodeURIComponent(message)}`;
        window.open(waLink, "_blank");
      } catch (error) {
        showToast("Failed to connect. Please try again.", "error");
      } finally {
        setIsConnecting(false);
      }
    });
  };

  // --- REVIEW ARCHITECTURE ---
  const openReviewModalForEdit = () => {
    if (myReview) {
      setReviewForm({
        rating_food: myReview.rating_food,
        rating_portion: myReview.rating_portion,
        rating_packaging: myReview.rating_packaging,
        rating_delivery: myReview.rating_delivery,
        rating_value: myReview.rating_value,
        review_text: myReview.review_text || "",
      });
    } else {
      setReviewForm(defaultReviewForm);
    }
    setIsReviewOpen(true);
  };

  const submitReview = () => {
    requireVerifiedPhone(async (verifiedUser) => {
      const {
        rating_food,
        rating_portion,
        rating_packaging,
        rating_delivery,
        rating_value,
        review_text,
      } = reviewForm;

      if (
        !rating_food ||
        !rating_portion ||
        !rating_packaging ||
        !rating_delivery ||
        !rating_value
      ) {
        showToast("Please provide a star rating for all categories.", "error");
        return;
      }

      setReviewSubmitting(true);
      const overall = parseFloat(
        (
          (rating_food +
            rating_portion +
            rating_packaging +
            rating_delivery +
            rating_value) /
          5
        ).toFixed(2)
      );

      const payload = {
        tiffin_id: id,
        user_id: verifiedUser.id,
        rating_overall: overall,
        rating_food,
        rating_portion,
        rating_packaging,
        rating_delivery,
        rating_value,
        review_text,
        status: "published",
      };

      try {
        if (myReview) {
          const { data, error } = await supabase
            .from("tiffin_reviews")
            .update(payload)
            .eq("id", myReview.id)
            .select("*, users(full_name, avatar_url)")
            .single();
          if (error) throw error;
          setMyReview(data);
          showToast("Review updated successfully!", "success");
        } else {
          const { data, error } = await supabase
            .from("tiffin_reviews")
            .insert(payload)
            .select("*, users(full_name, avatar_url)")
            .single();
          if (error) throw error;
          setMyReview(data);
          showToast("Review submitted successfully!", "success");
        }
        setIsReviewOpen(false);
      } catch (error) {
        showToast("Failed to process review.", "error");
      } finally {
        setReviewSubmitting(false);
      }
    });
  };

  const deleteReview = () => {
    requireVerifiedPhone(async () => {
      if (!myReview) return;
      if (!window.confirm("Are you sure you want to delete your review?"))
        return;

      try {
        const { error } = await supabase
          .from("tiffin_reviews")
          .update({ status: "archived" })
          .eq("id", myReview.id);
        if (error) throw error;

        setMyReview({ ...myReview, status: "archived" });
        showToast("Review removed successfully.", "success");
      } catch (error) {
        showToast("Failed to delete review.", "error");
      }
    });
  };

  // --- RENDERERS ---
  if (loading) {
    return (
      <div className="w-full min-h-screen bg-mainBg flex flex-col animate-in fade-in">
        <div className="max-w-[1200px] w-full mx-auto px-4 py-6 flex flex-col gap-6 animate-pulse">
          <div className="w-full h-[40vh] md:h-[60vh] bg-surface border border-cardBorder rounded-3xl"></div>
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-2/3 flex flex-col gap-4">
              <div className="h-10 w-3/4 bg-surface rounded-xl"></div>
              <div className="h-6 w-1/2 bg-surface rounded-lg"></div>
              <div className="h-32 w-full bg-surface rounded-2xl mt-4"></div>
            </div>
            <div className="w-full md:w-1/3 h-64 bg-surface rounded-3xl border border-cardBorder"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!tiffin) return null;

  const media = tiffin.tiffin_media || [];
  const images =
    media.length > 0
      ? media.map((m) =>
          m.url.startsWith("http") ? m.url : `${API_BASE}${m.url}`
        )
      : [
          "https://images.unsplash.com/photo-1543362906-acfc16c67564?auto=format&fit=crop&w=1200&q=80",
        ];

  return (
    <div className="w-full min-h-screen bg-mainBg font-sans animate-in fade-in pb-28 lg:pb-12">
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
          className={`fixed bottom-24 lg:bottom-10 left-1/2 -translate-x-1/2 z-[500] border shadow-2xl px-6 py-3.5 rounded-full flex items-center gap-2.5 whitespace-nowrap overflow-hidden animate-in slide-in-from-bottom-8 ${
            toast.type === "error"
              ? "bg-red-50 text-red-600 border-red-200"
              : "bg-emerald-50 border-emerald-200 text-emerald-600"
          }`}
        >
          {toast.type === "error" ? (
            <AlertCircle size={18} />
          ) : (
            <CheckCircle2 size={18} />
          )}
          <span className="text-sm font-black tracking-wide truncate">
            {toast.msg}
          </span>
        </div>
      )}

      {/* FULL-SCREEN LIGHTBOX GALLERY */}
      {isViewerOpen && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex flex-col animate-in fade-in">
          <div className="flex items-center justify-between p-4 sm:p-6 shrink-0">
            <span className="text-white font-bold text-sm bg-white/10 px-4 py-1.5 rounded-full">
              {activeImage + 1} / {images.length}
            </span>
            <button
              onClick={() => setIsViewerOpen(false)}
              className="bg-white/10 p-2 rounded-full text-white hover:bg-white/20 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex-1 flex items-center justify-center relative px-4 sm:px-16 min-h-0">
            <button
              onClick={() =>
                setActiveImage((prev) =>
                  prev === 0 ? images.length - 1 : prev - 1
                )
              }
              className="absolute left-4 sm:left-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
            >
              <ChevronLeft size={28} />
            </button>
            <img
              src={images[activeImage]}
              className="w-full h-full object-contain"
              alt="Gallery View"
            />
            <button
              onClick={() =>
                setActiveImage((prev) =>
                  prev === images.length - 1 ? 0 : prev + 1
                )
              }
              className="absolute right-4 sm:right-6 p-3 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors z-10"
            >
              <ChevronRight size={28} />
            </button>
          </div>
          <div className="p-4 sm:p-6 flex justify-center gap-2 overflow-x-auto no-scrollbar shrink-0">
            {images.map((img, i) => (
              <img
                key={i}
                onClick={() => setActiveImage(i)}
                src={img}
                className={`w-16 h-16 object-cover rounded-lg cursor-pointer border-2 transition-all shrink-0 ${
                  activeImage === i
                    ? "border-white opacity-100"
                    : "border-transparent opacity-40 hover:opacity-100"
                }`}
                alt="Thumb"
              />
            ))}
          </div>
        </div>
      )}

      {/* Write Review Modal */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-surface border border-cardBorder rounded-2xl p-5 sm:p-6 shadow-2xl w-full max-w-md flex flex-col gap-5 relative overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between items-center border-b border-cardBorder pb-3">
              <h3 className="text-lg font-black text-primaryText">
                {myReview && myReview.status === "published"
                  ? "Edit Your Review"
                  : "Write a Review"}
              </h3>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="text-secondaryText hover:text-red-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <div className="flex flex-col gap-2">
              <StarRatingInput
                label="Food Quality & Taste"
                value={reviewForm.rating_food}
                onChange={(v) =>
                  setReviewForm({ ...reviewForm, rating_food: v })
                }
              />
              <StarRatingInput
                label="Portion Size"
                value={reviewForm.rating_portion}
                onChange={(v) =>
                  setReviewForm({ ...reviewForm, rating_portion: v })
                }
              />
              <StarRatingInput
                label="Packaging & Hygiene"
                value={reviewForm.rating_packaging}
                onChange={(v) =>
                  setReviewForm({ ...reviewForm, rating_packaging: v })
                }
              />
              <StarRatingInput
                label="Delivery / Timeliness"
                value={reviewForm.rating_delivery}
                onChange={(v) =>
                  setReviewForm({ ...reviewForm, rating_delivery: v })
                }
              />
              <StarRatingInput
                label="Value for Money"
                value={reviewForm.rating_value}
                onChange={(v) =>
                  setReviewForm({ ...reviewForm, rating_value: v })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <span className="text-[11px] font-black text-secondaryText uppercase tracking-widest">
                Written Feedback (Optional)
              </span>
              <textarea
                rows="3"
                placeholder="Share details about the taste, menu variety, or delivery experience..."
                value={reviewForm.review_text}
                onChange={(e) =>
                  setReviewForm({ ...reviewForm, review_text: e.target.value })
                }
                className="w-full bg-mainBg border border-cardBorder rounded-xl p-3 text-sm font-medium outline-none focus:border-[#5B4EE4] resize-none"
              />
            </div>
            <button
              onClick={submitReview}
              disabled={reviewSubmitting}
              className="w-full bg-[#5B4EE4] hover:bg-[#4b40ce] text-white py-3.5 rounded-xl font-black transition-all flex justify-center items-center gap-2"
            >
              {reviewSubmitting ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Star size={18} fill="currentColor" />
              )}{" "}
              {myReview && myReview.status === "published"
                ? "Update Review"
                : "Submit Review"}
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
          <ChevronLeft size={18} />
        </button>
        <div className="flex gap-2">
          <button
            onClick={handleFavorite}
            className="p-2 bg-mainBg border border-cardBorder rounded-full text-primaryText transition-colors"
          >
            <Heart
              size={16}
              className={`transition-transform duration-300 ease-out ${
                animatingHeart ? "scale-[1.7]" : "scale-100"
              }`}
              fill={isFav ? "#FF2E51" : "transparent"}
              color={isFav ? "#FF2E51" : "currentColor"}
            />
          </button>
        </div>
      </div>

      <div className="max-w-[1200px] w-full mx-auto px-4 lg:px-8 mt-4 lg:mt-6">
        {/* BREADCRUMBS & DESKTOP NAV */}
        <div className="hidden lg:flex items-center justify-between mb-6">
          <div className="flex items-center gap-2 text-xs font-bold text-secondaryText">
            <button
              onClick={() => navigate(-1)}
              className="flex items-center gap-1 hover:text-[#5B4EE4] transition-colors"
            >
              <ChevronLeft size={14} /> Back
            </button>
            <span>•</span>
            <span>Tiffins in {tiffin.city}</span>
            <span>/</span>
            <span className="text-primaryText truncate">{tiffin.locality}</span>
          </div>
          <button
            onClick={handleFavorite}
            className={`flex items-center gap-2 px-4 py-2 bg-surface border rounded-xl text-xs font-bold transition-all shadow-sm ${
              isFav
                ? "border-pink-200 text-pink-500 bg-pink-50/50"
                : "border-cardBorder hover:border-pink-500 hover:text-pink-500"
            }`}
          >
            <Heart
              size={14}
              className={`transition-transform duration-300 ease-out ${
                animatingHeart ? "scale-[1.7]" : "scale-100"
              }`}
              fill={isFav ? "#ec4899" : "none"}
              color={isFav ? "#ec4899" : "currentColor"}
            />
            {isFav ? "Saved to Favorites" : "Save Service"}
          </button>
        </div>

        {/* Dynamic Image Gallery */}
        <div className="w-full h-[35vh] md:h-[50vh] flex gap-2 md:gap-4 rounded-3xl overflow-hidden mb-8 shadow-sm">
          <div
            className="w-full md:w-2/3 h-full relative cursor-pointer group"
            onClick={() => {
              setActiveImage(0);
              setIsViewerOpen(true);
            }}
          >
            <img
              src={images[0]}
              alt="Primary"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors"></div>
            {images.length > 1 && (
              <div className="md:hidden absolute bottom-3 right-3 bg-white/90 backdrop-blur-md text-zinc-900 font-bold px-3 py-1.5 rounded-lg shadow-lg text-[10px] flex items-center gap-1.5">
                <ImageIcon size={12} /> {images.length} Photos
              </div>
            )}
          </div>
          <div className="hidden md:flex flex-col w-1/3 h-full gap-4">
            {images.slice(1, 3).map((img, idx) => (
              <div
                key={idx}
                className="w-full h-1/2 relative cursor-pointer group overflow-hidden rounded-2xl"
                onClick={() => {
                  setActiveImage(idx + 1);
                  setIsViewerOpen(true);
                }}
              >
                <img
                  src={img}
                  alt={`Gallery ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"></div>
                {idx === 1 && images.length > 3 && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white font-black text-lg">
                    +{images.length - 3} More
                  </div>
                )}
              </div>
            ))}
            {images.length === 1 && (
              <div className="w-full h-full flex flex-col items-center justify-center bg-surface border border-cardBorder rounded-2xl text-tertiaryText">
                <ChefHat size={32} className="opacity-30 mb-2" />
                <span className="text-xs font-bold uppercase tracking-widest opacity-50">
                  No more images
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Content Split Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 relative">
          {/* Left Column: Details */}
          <div className="w-full lg:w-[65%] flex flex-col gap-8">
            {/* Title & Badges */}
            <div className="flex flex-col gap-3 pb-8 border-b border-cardBorder">
              <div className="flex flex-wrap gap-2 items-center mb-1">
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black tracking-wide uppercase flex items-center gap-1 shadow-sm ${
                    tiffin.food_type === "pure_veg"
                      ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                      : "bg-red-50 text-red-600 border border-red-200"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      tiffin.food_type === "pure_veg"
                        ? "bg-emerald-500"
                        : "bg-red-500"
                    }`}
                  ></span>
                  {(tiffin.food_type || "pure_veg").replace(/_/g, " ")}
                </span>
                {tiffin.jain_available && (
                  <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2.5 py-1 rounded-md text-[10px] font-black tracking-wide uppercase flex items-center gap-1 shadow-sm">
                    <Leaf size={10} /> Jain Available
                  </span>
                )}
              </div>
              <h1 className="text-3xl md:text-4xl font-black text-primaryText tracking-tight leading-tight">
                {tiffin.provider_name}
              </h1>
              <p className="text-sm font-bold text-secondaryText flex items-center gap-1.5 mt-1">
                <MapPin size={16} className="text-[#5B4EE4]" /> {tiffin.address}
                , {tiffin.locality}, {tiffin.city}
              </p>
            </div>

            {/* SLEEK QUICK STATS ROW */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1.5 p-4 bg-surface border border-cardBorder rounded-2xl shadow-sm">
                <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-500 flex items-center justify-center border border-amber-100 mb-1">
                  <Star size={16} className="fill-amber-500" />
                </div>
                <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                  Rating
                </span>
                <span className="text-sm font-black text-primaryText leading-none">
                  {Number(tiffin.rating_overall) > 0
                    ? tiffin.rating_overall
                    : "New"}{" "}
                  <span className="text-xs font-bold text-tertiaryText ml-1">
                    ({tiffin.total_reviews})
                  </span>
                </span>
              </div>

              <div className="flex flex-col gap-1.5 p-4 bg-surface border border-cardBorder rounded-2xl shadow-sm">
                <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center border border-emerald-100 mb-1">
                  <Truck size={16} />
                </div>
                <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                  Delivery
                </span>
                <span className="text-sm font-black text-primaryText leading-none truncate">
                  {tiffin.delivery_available
                    ? tiffin.delivery_charges === 0
                      ? "Free Delivery"
                      : `₹${tiffin.delivery_charges}/day`
                    : "Pickup Only"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 p-4 bg-surface border border-cardBorder rounded-2xl shadow-sm">
                <div className="w-8 h-8 rounded-full bg-[#5B4EE4]/10 text-[#5B4EE4] flex items-center justify-center border border-[#5B4EE4]/20 mb-1">
                  <Clock size={16} />
                </div>
                <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                  Availability
                </span>
                <span className="text-sm font-black text-primaryText leading-none">
                  {tiffin.occasional_meals_allowed
                    ? "Daily & Monthly"
                    : "Monthly Only"}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 p-4 bg-surface border border-cardBorder rounded-2xl shadow-sm">
                <div className="w-8 h-8 rounded-full bg-pink-50 text-pink-500 flex items-center justify-center border border-pink-100 mb-1">
                  <ChefHat size={16} />
                </div>
                <span className="text-[10px] font-extrabold text-secondaryText uppercase tracking-widest">
                  Meal Type
                </span>
                <span className="text-sm font-black text-primaryText leading-none capitalize truncate">
                  {(tiffin.food_type || "Pure Veg").replace(/_/g, " ")}
                </span>
              </div>
            </div>

            {/* ==================================================== */}
            {/* MOBILE PRICING & TERMS (Visible only on lg:hidden)   */}
            {/* ==================================================== */}
            <div className="lg:hidden mt-2 bg-surface border border-cardBorder rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col gap-5">
              <div className="flex flex-col gap-1 border-b border-cardBorder pb-5">
                <span className="text-[10px] font-black text-[#5B4EE4] uppercase tracking-widest">
                  Subscription Plans
                </span>
                <div className="flex items-end gap-2 mt-2 flex-wrap">
                  <span className="text-2xl sm:text-3xl font-black text-primaryText leading-none">
                    {tiffin.price_monthly_min
                      ? formatRent(
                          tiffin.price_monthly_min,
                          tiffin.price_monthly_max
                        )
                      : "N/A"}
                  </span>
                  <span className="text-sm font-bold text-secondaryText mb-[2px]">
                    / month
                  </span>
                </div>
                {tiffin.price_per_meal_min && (
                  <p className="text-sm font-bold text-secondaryText mt-2">
                    Or pay{" "}
                    <span className="text-primaryText">
                      {formatRent(
                        tiffin.price_per_meal_min,
                        tiffin.price_per_meal_max
                      )}
                    </span>{" "}
                    per meal.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-primaryText">
                    Hygienic Home-cooked Meals
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-primaryText">
                    Customizable Menu
                  </span>
                </div>
                {tiffin.delivery_available && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-primaryText">
                      Doorstep Delivery ({tiffin.delivery_radius_km}km)
                    </span>
                  </div>
                )}
              </div>
            </div>

            <hr className="lg:hidden border-cardBorder" />

            {/* Description */}
            <div className="flex flex-col gap-4 pt-4">
              <h2 className="text-xl font-black text-primaryText">
                About this Service
              </h2>
              <div className="text-sm font-medium text-secondaryText leading-relaxed whitespace-pre-wrap">
                {tiffin.description ||
                  "The provider has not added a detailed description yet."}
              </div>
            </div>

            {/* REVIEWS ARCHITECTURE */}
            <div className="flex flex-col gap-6 pt-8 border-t border-cardBorder">
              <div className="flex items-end justify-between">
                <div className="flex flex-col gap-1">
                  <h2 className="text-xl font-black text-primaryText">
                    Community Reviews
                  </h2>
                  <div className="flex items-center gap-1.5 text-base font-black text-primaryText">
                    <Star size={18} className="text-amber-500 fill-amber-500" />{" "}
                    {Number(tiffin.rating_overall) > 0
                      ? tiffin.rating_overall
                      : "New"}
                  </div>
                </div>
                {(!myReview || myReview.status !== "published") && (
                  <button
                    onClick={openReviewModalForEdit}
                    className="flex items-center gap-2 px-4 py-2 bg-surface border border-cardBorder rounded-xl text-xs font-bold hover:text-[#5B4EE4] hover:border-[#5B4EE4]/50 transition-colors shadow-sm"
                  >
                    <Edit3 size={14} /> Write Review
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-4 mt-2">
                {/* 1. Show My Own Review if it's published */}
                {myReview && myReview.status === "published" && (
                  <div className="bg-[#5B4EE4]/5 border border-[#5B4EE4]/20 p-5 sm:p-6 rounded-3xl shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#5B4EE4]"></div>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-surface border border-cardBorder rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                          {myReview.users?.avatar_url ? (
                            <img
                              src={myReview.users.avatar_url}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User size={20} className="text-[#5B4EE4]" />
                          )}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-black text-primaryText">
                              Your Review
                            </span>
                            <span className="bg-[#5B4EE4]/10 text-[#5B4EE4] px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-widest">
                              You
                            </span>
                          </div>
                          <span className="text-[10px] font-bold text-secondaryText uppercase tracking-widest mt-0.5">
                            {new Date(myReview.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg border border-amber-100">
                          <span className="text-sm font-black leading-none">
                            {myReview.rating_overall}
                          </span>
                          <Star size={14} className="fill-amber-500" />
                        </div>
                        <button
                          onClick={openReviewModalForEdit}
                          className="p-2 text-secondaryText hover:text-[#5B4EE4] hover:bg-mainBg rounded-lg transition-colors"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={deleteReview}
                          className="p-2 text-secondaryText hover:text-red-500 hover:bg-mainBg rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    {myReview.review_text && (
                      <p className="text-sm font-medium text-secondaryText leading-relaxed italic">
                        "{myReview.review_text}"
                      </p>
                    )}
                  </div>
                )}

                {/* 2. Show Public Reviews */}
                {reviews.length === 0 &&
                (!myReview || myReview.status !== "published") ? (
                  <div className="flex flex-col items-center text-center py-12 bg-surface border border-cardBorder rounded-3xl">
                    <MessageCircle
                      size={32}
                      className="text-tertiaryText mb-3 opacity-50"
                    />
                    <span className="text-sm font-bold text-secondaryText">
                      No community reviews yet. Be the first to share your
                      experience!
                    </span>
                  </div>
                ) : (
                  reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="bg-surface border border-cardBorder p-5 sm:p-6 rounded-3xl shadow-sm"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-mainBg border border-cardBorder rounded-full overflow-hidden shrink-0 flex items-center justify-center">
                            {rev.users?.avatar_url ? (
                              <img
                                src={rev.users.avatar_url}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <User size={20} className="text-tertiaryText" />
                            )}
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-primaryText">
                              {rev.users?.full_name || "BachelorBase User"}
                            </span>
                            <span className="text-[10px] font-bold text-secondaryText uppercase tracking-widest mt-0.5">
                              {new Date(rev.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1 bg-amber-50 text-amber-600 px-2.5 py-1 rounded-lg border border-amber-100">
                          <span className="text-sm font-black leading-none">
                            {rev.rating_overall}
                          </span>
                          <Star size={14} className="fill-amber-500" />
                        </div>
                      </div>
                      {rev.review_text && (
                        <p className="text-sm font-medium text-secondaryText leading-relaxed">
                          "{rev.review_text}"
                        </p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="h-4 lg:h-10"></div>
          </div>

          {/* ==================================================== */}
          {/* RIGHT COLUMN: Sticky Pricing (Desktop Only)          */}
          {/* ==================================================== */}
          <div className="hidden lg:block lg:col-span-4 relative">
            <div className="sticky top-28 bg-surface border border-cardBorder rounded-[2rem] p-6 sm:p-8 shadow-xl flex flex-col gap-6">
              <div className="flex flex-col gap-1 border-b border-cardBorder pb-6">
                <span className="text-xs font-black text-[#5B4EE4] uppercase tracking-widest">
                  Subscription Plans
                </span>
                <div className="flex items-end gap-2 mt-2 flex-wrap">
                  <span className="text-4xl font-black text-primaryText leading-none">
                    {tiffin.price_monthly_min
                      ? formatRent(
                          tiffin.price_monthly_min,
                          tiffin.price_monthly_max
                        )
                      : "N/A"}
                  </span>
                  <span className="text-sm font-bold text-secondaryText mb-1">
                    / month
                  </span>
                </div>
                {tiffin.price_per_meal_min && (
                  <p className="text-sm font-bold text-secondaryText mt-2">
                    Or pay{" "}
                    <span className="text-primaryText">
                      {formatRent(
                        tiffin.price_per_meal_min,
                        tiffin.price_per_meal_max
                      )}
                    </span>{" "}
                    per meal.
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-primaryText">
                    Hygienic Home-cooked Meals
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={14} className="text-emerald-500" />
                  </div>
                  <span className="text-sm font-medium text-primaryText">
                    Customizable Menu
                  </span>
                </div>
                {tiffin.delivery_available && (
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                      <CheckCircle2 size={14} className="text-emerald-500" />
                    </div>
                    <span className="text-sm font-medium text-primaryText">
                      Doorstep Delivery ({tiffin.delivery_radius_km}km)
                    </span>
                  </div>
                )}
              </div>

              {/* Desktop CTA */}
              <button
                onClick={handleWhatsAppConnect}
                disabled={isConnecting}
                className="hidden lg:flex w-full bg-[#25D366] hover:bg-[#20b858] text-white py-4 rounded-xl text-sm font-black transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] items-center justify-center gap-2 active:scale-95 mt-4 disabled:opacity-70"
              >
                {isConnecting ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <WhatsAppIconWhite size={18} />
                )}{" "}
                Connect on WhatsApp
              </button>

              <p className="hidden lg:block text-[10px] font-bold text-center text-tertiaryText uppercase tracking-widest mt-2">
                Fastest Response Time
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* MOBILE STICKY BOTTOM ACTION BAR */}
      <div className="lg:hidden fixed bottom-0 left-0 w-full bg-surface/95 backdrop-blur-xl border-t border-cardBorder p-4 pb-safe flex items-center justify-between shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-40">
        <div className="flex flex-col min-w-0 pr-4">
          <span className="text-[9px] font-extrabold text-secondaryText uppercase tracking-widest mb-0.5">
            Monthly Plan
          </span>
          <span className="text-xl font-black text-primaryText truncate">
            {formatRent(tiffin.price_monthly_min, tiffin.price_monthly_max)}
          </span>
        </div>
        <button
          onClick={handleWhatsAppConnect}
          disabled={isConnecting}
          className="bg-[#25D366] active:scale-95 text-white px-6 py-3.5 rounded-xl text-sm font-black transition-all shadow-md flex items-center justify-center gap-2 disabled:opacity-70 shrink-0"
        >
          {isConnecting ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <WhatsAppIconWhite size={18} />
          )}{" "}
          Connect
        </button>
      </div>
    </div>
  );
}
