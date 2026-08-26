import React, { useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import {
  Mail,
  MapPin,
  Send,
  Loader2,
  Building2,
  ArrowRight,
  MessageCircleQuestion,
  CheckCircle2,
} from "lucide-react";

// --- WHITE WHATSAPP LOGO ---
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

// --- OFFICIAL INSTAGRAM LOGO ---
const InstagramIcon = ({ size = 24, className = "" }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={className}
  >
    <rect
      x="2"
      y="2"
      width="20"
      height="20"
      rx="5"
      fill="url(#ig_grad_bento)"
    />
    <path
      d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
    />
    <line
      x1="17.5"
      y1="6.5"
      x2="17.51"
      y2="6.5"
      stroke="white"
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <rect
      x="4"
      y="4"
      width="16"
      height="16"
      rx="4"
      fill="none"
      stroke="white"
      strokeWidth="1.5"
    />
    <defs>
      <linearGradient
        id="ig_grad_bento"
        x1="2"
        y1="22"
        x2="22"
        y2="2"
        gradientUnits="userSpaceOnUse"
      >
        <stop stopColor="#FEDA75" />
        <stop offset="0.3" stopColor="#FA7E1E" />
        <stop offset="0.6" stopColor="#D62976" />
        <stop offset="0.8" stopColor="#962FBF" />
        <stop offset="1" stopColor="#4F5BD5" />
      </linearGradient>
    </defs>
  </svg>
);

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sending real data to Supabase (Ensure 'contact_messages' table exists)
      const { error: dbError } = await supabase
        .from("contact_messages")
        .insert([formData]);

      if (dbError) throw dbError;

      setSuccess(true);
      setFormData({ name: "", email: "", message: "" });
    } catch (err) {
      console.error(err);
      setError("Failed to send message. Please try again or use WhatsApp.");
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = () => {
    const message = encodeURIComponent(
      "Hi BachelorBase Team, I need some help."
    );
    window.open(`https://wa.me/919876543210?text=${message}`, "_blank");
  };

  const openInstagram = () => {
    window.open("https://instagram.com/bachelorbase", "_blank");
  };

  return (
    <div className="w-full min-h-screen bg-mainBg font-sans animate-in fade-in flex flex-col items-center pb-20">
      {/* 1. HERO HEADER */}
      <div className="w-full bg-surface border-b border-cardBorder py-12 md:py-16 px-4 text-center relative overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#5B4EE4]/5 rounded-full blur-[80px] pointer-events-none"></div>
        <div className="max-w-3xl mx-auto relative z-10 flex flex-col items-center">
          <h1 className="text-3xl md:text-5xl font-black text-primaryText tracking-tight leading-tight mb-4">
            Let's connect.
          </h1>
          <p className="text-sm md:text-base font-medium text-secondaryText max-w-xl">
            Whether you're looking for your next home, need help with the
            platform, or want to list a property, we're here for you.
          </p>
        </div>
      </div>

      {/* 2. BENTO GRID */}
      <div className="max-w-[1200px] w-full mx-auto px-4 lg:px-8 mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Left: WhatsApp Support */}
        <div className="bg-surface border border-cardBorder rounded-3xl p-6 sm:p-8 flex flex-col justify-between shadow-sm group hover:border-[#25D366]/50 transition-colors md:col-span-1">
          <div className="flex flex-col gap-3 mb-8">
            <div className="w-12 h-12 bg-[#25D366]/10 text-[#25D366] rounded-2xl flex items-center justify-center">
              <MessageCircleQuestion size={24} />
            </div>
            <h2 className="text-xl font-black text-primaryText leading-tight">
              Need immediate assistance?
            </h2>
            <p className="text-sm font-medium text-secondaryText">
              Skip the email queue. Chat directly with our support team on
              WhatsApp for fast resolutions.
            </p>
          </div>
          <button
            onClick={openWhatsApp}
            className="w-full bg-[#25D366] hover:bg-[#20b858] text-white py-3.5 rounded-xl text-sm font-black transition-all shadow-[0_4px_14px_0_rgba(37,211,102,0.39)] flex items-center justify-center gap-2 active:scale-95"
          >
            <WhatsAppIconWhite size={18} /> Chat on WhatsApp
          </button>
        </div>

        {/* Top Right: List Property (For Owners) */}
        <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row justify-between items-center sm:items-end shadow-sm group relative overflow-hidden md:col-span-2">
          <Building2
            size={180}
            className="absolute -right-10 -bottom-10 text-amber-500/10 transform rotate-12 pointer-events-none"
          />

          <div className="flex flex-col gap-3 relative z-10 w-full sm:w-2/3 mb-6 sm:mb-0 text-center sm:text-left">
            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest bg-amber-500/10 w-fit px-2.5 py-1 rounded-md mx-auto sm:mx-0">
              For Owners & Managers
            </span>
            <h2 className="text-2xl md:text-3xl font-black text-primaryText leading-tight">
              Got a property? <br className="hidden lg:block" /> List it today.
            </h2>
            <p className="text-sm font-medium text-secondaryText">
              Connect directly with a community of verified tenants. No brokers.
              Take full control of your listings.
            </p>
          </div>

          <Link
            to="/list-property"
            className="w-full sm:w-auto relative z-10 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white px-6 py-3.5 rounded-xl text-sm font-black transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95 shrink-0"
          >
            List Property <ArrowRight size={18} />
          </Link>
        </div>

        {/* Bottom Left: Email Form */}
        <div className="bg-surface border border-cardBorder rounded-3xl p-6 sm:p-8 shadow-sm md:col-span-2">
          <div className="flex flex-col gap-1 mb-6">
            <h3 className="text-xl font-black text-primaryText">
              Send us an email
            </h3>
            <p className="text-sm font-medium text-secondaryText">
              For business inquiries, partnerships, or detailed technical
              support.
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 border border-red-200 rounded-xl text-xs font-bold text-center">
              {error}
            </div>
          )}

          {success ? (
            <div className="h-full min-h-[250px] flex flex-col items-center justify-center text-center bg-emerald-50 border border-emerald-100 rounded-2xl p-6">
              <CheckCircle2 size={48} className="text-emerald-500 mb-4" />
              <h3 className="text-xl font-black text-emerald-900 mb-2">
                Message Sent!
              </h3>
              <p className="text-sm font-medium text-emerald-700 max-w-sm">
                Thank you for reaching out. Our team will review your message
                and get back to you shortly.
              </p>
              <button
                onClick={() => setSuccess(false)}
                className="mt-6 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold transition-colors"
              >
                Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-secondaryText uppercase tracking-widest pl-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    placeholder="John Doe"
                    className="w-full bg-mainBg border border-cardBorder rounded-xl p-3.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] transition-colors"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[11px] font-black text-secondaryText uppercase tracking-widest pl-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="john@example.com"
                    className="w-full bg-mainBg border border-cardBorder rounded-xl p-3.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] transition-colors"
                  />
                </div>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-[11px] font-black text-secondaryText uppercase tracking-widest pl-1">
                  Message
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="4"
                  placeholder="How can we help you?"
                  className="w-full bg-mainBg border border-cardBorder rounded-xl p-3.5 text-sm font-bold text-primaryText outline-none focus:border-[#5B4EE4] transition-colors resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="mt-2 w-full sm:w-fit px-8 bg-[#5B4EE4] hover:bg-[#4b40ce] text-white py-3.5 rounded-xl text-sm font-black transition-all flex items-center justify-center gap-2 shadow-md sm:self-end"
              >
                {loading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <>
                    Send Message <Send size={16} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Bottom Right: Community & Address */}
        <div className="flex flex-col gap-6 md:col-span-1">
          {/* Instagram Card with Real Color Icon */}
          <div
            onClick={openInstagram}
            className="bg-surface border border-cardBorder rounded-3xl p-6 flex items-center gap-4 cursor-pointer hover:scale-[1.02] hover:shadow-md transition-all shadow-sm"
          >
            <InstagramIcon size={46} className="shrink-0 drop-shadow-sm" />
            <div className="flex flex-col">
              <span className="text-xs font-black text-pink-600 uppercase tracking-widest">
                Join Community
              </span>
              <span className="text-base font-black text-primaryText">
                @bachelorbase
              </span>
            </div>
          </div>

          {/* Address Card */}
          <div className="bg-surface border border-cardBorder rounded-3xl p-6 flex flex-col gap-4 shadow-sm flex-grow">
            <div className="w-10 h-10 bg-mainBg border border-cardBorder rounded-xl flex items-center justify-center text-tertiaryText">
              <MapPin size={20} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="text-sm font-black text-primaryText">
                Headquarters
              </h3>
              <p className="text-sm font-medium text-secondaryText leading-relaxed">
                St. Xavier's College Campus,
                <br />
                Navrangpura, Ahmedabad,
                <br />
                Gujarat, India - 380009
              </p>
            </div>
            <div className="mt-auto pt-4 flex flex-col gap-1 border-t border-cardBorder">
              <a
                href="mailto:support@bachelorbase.com"
                className="text-sm font-bold text-primaryText hover:text-[#5B4EE4] transition-colors flex items-center gap-2"
              >
                <Mail size={14} className="text-[#5B4EE4]" />{" "}
                support@bachelorbase.com
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
