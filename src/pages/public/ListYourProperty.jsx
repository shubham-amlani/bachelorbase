import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  CheckCircle2,
  Building2,
  ShieldCheck,
  User,
  Phone,
  MapPin,
  Home,
  Send,
  Loader2,
  ChefHat,
  Sparkles,
} from "lucide-react";

export default function ListYourProperty() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    ownerName: "",
    phone: "",
    propertyType: "pg",
    propertyName: "",
    location: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { error: dbError } = await supabase
        .from("property_listing_requests")
        .insert([
          {
            owner_name: formData.ownerName,
            phone_number: formData.phone,
            property_type: formData.propertyType,
            property_name: formData.propertyName,
            location: formData.location,
          },
        ]);

      if (dbError) throw dbError;

      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError(
        "Failed to submit request. Please try again or contact support."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    // FIX: Added `overflow-x-hidden` to strictly contain the background glow effects on mobile
    <div className="w-full min-h-screen bg-mainBg font-sans animate-in fade-in flex flex-col items-center overflow-x-hidden">
      {/* HERO & FORM SECTION (Split Layout) */}
      <div className="w-full max-w-[1440px] mx-auto px-4 lg:px-8 pt-10 md:pt-16 pb-12 grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative">
        {/* Background Glow */}
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-[#5B4EE4]/10 rounded-full blur-[120px] pointer-events-none"></div>

        {/* Left: Value Proposition */}
        <div className="flex flex-col relative z-10 lg:pr-8">
          <div className="w-fit bg-[#5B4EE4]/10 text-[#5B4EE4] border border-[#5B4EE4]/20 px-3 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 shadow-sm">
            <Sparkles size={14} /> For Owners & Managers
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primaryText tracking-tight leading-[1.1] mb-6">
            Maximize Your Yield. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B4EE4] to-purple-500">
              Zero Brokerage.*
            </span>
          </h1>

          <p className="text-base md:text-lg font-medium text-secondaryText leading-relaxed mb-4 max-w-lg">
            List your PG, Independent Flat, or Tiffin service on BachelorBase.
            Connect directly with a community of verified students and working
            professionals in your area, saving heavily on traditional brokerage
            fees.
          </p>

          <Link
            to="/terms"
            className="inline-flex items-center text-sm font-bold text-secondaryText hover:text-[#5B4EE4] transition-colors mb-8"
          >
            * Listing subscription plans apply. Read our Terms of Service.
          </Link>

          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <span className="text-sm font-bold text-primaryText">
                Get verified leads directly on your WhatsApp.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <span className="text-sm font-bold text-primaryText">
                You decide the rent, rules, and terms.
              </span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center shrink-0">
                <CheckCircle2 size={16} className="text-emerald-500" />
              </div>
              <span className="text-sm font-bold text-primaryText">
                Dedicated onboarding support from our team.
              </span>
            </div>
          </div>
        </div>

        {/* Right: Lead Generation Form */}
        <div className="relative z-10 w-full max-w-md mx-auto lg:max-w-none lg:ml-auto">
          <div className="bg-surface border border-cardBorder rounded-[2rem] p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            {/* Top accent line */}
            <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#5B4EE4] to-purple-500"></div>

            {success ? (
              <div className="flex flex-col items-center justify-center text-center py-12 px-4 h-[400px]">
                <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100 shadow-sm">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-black text-primaryText mb-3">
                  Request Received!
                </h3>
                <p className="text-sm font-medium text-secondaryText max-w-sm">
                  Thank you for your interest. Our onboarding team will contact
                  you on your WhatsApp/Phone shortly to verify and list your
                  property.
                </p>
                <button
                  onClick={() => {
                    setSuccess(false);
                    setFormData({
                      ownerName: "",
                      phone: "",
                      propertyType: "pg",
                      propertyName: "",
                      location: "",
                    });
                  }}
                  className="mt-8 text-[#5B4EE4] text-sm font-bold hover:underline"
                >
                  Submit another property
                </button>
              </div>
            ) : (
              <>
                <div className="mb-8">
                  <h3 className="text-2xl font-black text-primaryText tracking-tight mb-2">
                    Request a Listing
                  </h3>
                  <p className="text-xs font-medium text-secondaryText">
                    Fill out the basic details below and we'll reach out to get
                    you onboarded.
                  </p>
                </div>

                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold text-center">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  {/* Property Type Selector */}
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {[
                      { id: "pg", label: "PG", icon: <Building2 size={16} /> },
                      { id: "flat", label: "Flat", icon: <Home size={16} /> },
                      {
                        id: "tiffin",
                        label: "Tiffin",
                        icon: <ChefHat size={16} />,
                      },
                    ].map((type) => (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() =>
                          setFormData({ ...formData, propertyType: type.id })
                        }
                        className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all ${
                          formData.propertyType === type.id
                            ? "bg-[#5B4EE4]/10 border-[#5B4EE4] text-[#5B4EE4]"
                            : "bg-mainBg border-cardBorder text-secondaryText hover:bg-surface"
                        }`}
                      >
                        {type.icon}
                        <span className="text-[10px] font-black uppercase tracking-wider">
                          {type.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Owner Name */}
                  <div className="relative flex items-center">
                    <User
                      size={18}
                      className="absolute left-4 text-tertiaryText pointer-events-none"
                    />
                    <input
                      type="text"
                      name="ownerName"
                      required
                      value={formData.ownerName}
                      onChange={handleChange}
                      placeholder="Owner / Manager Name"
                      className="w-full bg-mainBg border border-cardBorder rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] transition-colors"
                    />
                  </div>

                  {/* Phone / WhatsApp */}
                  <div className="relative flex items-center">
                    <Phone
                      size={18}
                      className="absolute left-4 text-tertiaryText pointer-events-none"
                    />
                    <input
                      type="tel"
                      name="phone"
                      required
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="WhatsApp / Phone Number"
                      className="w-full bg-mainBg border border-cardBorder rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] transition-colors"
                    />
                  </div>

                  {/* Property Name */}
                  <div className="relative flex items-center">
                    <Building2
                      size={18}
                      className="absolute left-4 text-tertiaryText pointer-events-none"
                    />
                    <input
                      type="text"
                      name="propertyName"
                      required
                      value={formData.propertyName}
                      onChange={handleChange}
                      placeholder={
                        formData.propertyType === "tiffin"
                          ? "Tiffin Service Name"
                          : "Property / Society Name"
                      }
                      className="w-full bg-mainBg border border-cardBorder rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] transition-colors"
                    />
                  </div>

                  {/* Location */}
                  <div className="relative flex items-center">
                    <MapPin
                      size={18}
                      className="absolute left-4 text-tertiaryText pointer-events-none"
                    />
                    <input
                      type="text"
                      name="location"
                      required
                      value={formData.location}
                      onChange={handleChange}
                      placeholder="City & Locality (e.g., Navrangpura)"
                      className="w-full bg-mainBg border border-cardBorder rounded-xl pl-11 pr-4 py-3.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="mt-4 w-full bg-[#5B4EE4] hover:bg-[#4b40ce] text-white py-4 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-[#5B4EE4]/25 active:scale-[0.98]"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : (
                      <>
                        Request Callback <Send size={16} />
                      </>
                    )}
                  </button>
                  <p className="text-[11px] font-medium text-center text-tertiaryText mt-2">
                    By submitting, you agree to BachelorBase's{" "}
                    <Link
                      to="/terms"
                      className="text-[#5B4EE4] hover:underline"
                    >
                      Terms
                    </Link>
                    .
                  </p>
                </form>
              </>
            )}
          </div>
        </div>
      </div>

      {/* TRUST PILLARS (Bento Row) */}
      <div className="max-w-[1200px] mx-auto px-4 lg:px-8 py-8 w-full grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            icon: <ShieldCheck size={28} />,
            title: "100% Verified Tenants",
            desc: "Every user on our platform is phone-verified via OTP, ensuring you only deal with genuine, serious inquiries.",
          },
          {
            icon: <Building2 size={28} />,
            title: "Premium Visibility",
            desc: "Our intelligent badging system highlights high-quality properties, giving you the exposure and click-throughs you deserve.",
          },
          {
            icon: <CheckCircle2 size={28} />,
            title: "Complete Control",
            desc: "No middlemen. You set your own rules, negotiate rent directly, and manage your property completely on your terms.",
          },
        ].map((feature, i) => (
          <div
            key={i}
            className="bg-surface border border-cardBorder p-8 rounded-3xl flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow group"
          >
            <div className="w-14 h-14 bg-mainBg border border-cardBorder text-[#5B4EE4] rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-[#5B4EE4]/10 transition-all">
              {feature.icon}
            </div>
            <h3 className="text-lg font-black text-primaryText mb-2">
              {feature.title}
            </h3>
            <p className="text-sm font-medium text-secondaryText leading-relaxed">
              {feature.desc}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
