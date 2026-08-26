import React from "react";
import { Link } from "react-router-dom";
import {
  Building2,
  Users,
  Utensils,
  ShieldCheck,
  MapPin,
  ArrowRight,
  Sparkles,
  HeartHandshake,
  CheckCircle2,
} from "lucide-react";

export default function About() {
  return (
    <div className="w-full min-h-screen bg-mainBg font-sans animate-in fade-in flex flex-col items-center pb-20">
      {/* 1. HERO HEADER */}
      <div className="w-full bg-surface border-b border-cardBorder py-16 md:py-24 px-4 text-center relative overflow-hidden">
        {/* Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-[#5B4EE4]/5 rounded-full blur-[100px] pointer-events-none"></div>

        <div className="max-w-4xl mx-auto relative z-10 flex flex-col items-center">
          <div className="w-fit bg-[#5B4EE4]/10 text-[#5B4EE4] border border-[#5B4EE4]/20 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-2 shadow-sm">
            <Sparkles size={14} /> Our Mission
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-primaryText tracking-tight leading-[1.1] mb-6">
            The smartest way to <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#5B4EE4] to-purple-500">
              live, share, and eat.
            </span>
          </h1>

          <p className="text-base md:text-lg font-medium text-secondaryText leading-relaxed max-w-2xl mx-auto mb-8">
            BachelorBase is a highly interactive marketplace tailored
            specifically for students and working professionals looking for
            accommodations, shared spaces, and food services. We are building a
            spam-free ecosystem where finding your next home is seamless and
            secure.
          </p>

          <Link
            to="/"
            className="bg-[#5B4EE4] hover:bg-[#4b40ce] text-white px-8 py-4 rounded-xl text-sm font-black transition-all shadow-xl shadow-[#5B4EE4]/20 flex items-center gap-2 active:scale-95"
          >
            Explore the Directory <ArrowRight size={18} />
          </Link>
        </div>
      </div>

      {/* 2. THE THREE PILLARS (Bento Grid) */}
      <div className="max-w-[1200px] w-full mx-auto px-4 lg:px-8 mt-16 flex flex-col gap-6">
        <div className="text-center mb-4">
          <h2 className="text-2xl md:text-3xl font-black text-primaryText tracking-tight">
            Everything you need in one place.
          </h2>
          <p className="text-sm font-medium text-secondaryText mt-2">
            Designed from the ground up to solve the three biggest problems for
            bachelors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1: Accommodations */}
          <div className="bg-surface border border-cardBorder rounded-3xl p-8 flex flex-col shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-[#5B4EE4]/5 transform rotate-12 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-6">
              <Building2 size={160} />
            </div>
            <div className="w-14 h-14 bg-[#5B4EE4]/10 text-[#5B4EE4] border border-[#5B4EE4]/20 rounded-2xl flex items-center justify-center mb-6 relative z-10">
              <MapPin size={24} />
            </div>
            <h3 className="text-xl font-black text-primaryText mb-3 relative z-10">
              Verified Accommodations
            </h3>
            <p className="text-sm font-medium text-secondaryText leading-relaxed relative z-10">
              Discover PGs and independent flats through powerful location-based
              discovery. We provide advanced filtering by price range, sharing
              type, and specific amenities so you find exactly what fits your
              lifestyle.
            </p>
          </div>

          {/* Pillar 2: Flatmate Spots */}
          <div className="bg-surface border border-cardBorder rounded-3xl p-8 flex flex-col shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-pink-500/5 transform rotate-12 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-6">
              <Users size={160} />
            </div>
            <div className="w-14 h-14 bg-pink-500/10 text-pink-600 border border-pink-500/20 rounded-2xl flex items-center justify-center mb-6 relative z-10">
              <HeartHandshake size={24} />
            </div>
            <h3 className="text-xl font-black text-primaryText mb-3 relative z-10">
              Pre-Occupied Flatmate Spots
            </h3>
            <p className="text-sm font-medium text-secondaryText leading-relaxed relative z-10">
              Already have a flat and need someone to share the rent? Our
              platform allows tenants to list available spots in their
              pre-occupied flats. Seekers can browse these listings and contact
              you directly via WhatsApp to fill the vacancy fast.
            </p>
          </div>

          {/* Pillar 3: Tiffins */}
          <div className="bg-surface border border-cardBorder rounded-3xl p-8 flex flex-col shadow-sm hover:shadow-md transition-shadow group relative overflow-hidden">
            <div className="absolute -right-6 -top-6 text-orange-500/5 transform rotate-12 pointer-events-none transition-transform group-hover:scale-110 group-hover:rotate-6">
              <Utensils size={160} />
            </div>
            <div className="w-14 h-14 bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-2xl flex items-center justify-center mb-6 relative z-10">
              <Utensils size={24} />
            </div>
            <h3 className="text-xl font-black text-primaryText mb-3 relative z-10">
              Daily Tiffin Directory
            </h3>
            <p className="text-sm font-medium text-secondaryText leading-relaxed relative z-10">
              A seamless directory connecting you with local daily food
              providers. Filter by Veg/Non-Veg, delivery options, and pricing
              plans, all backed by detailed community reviews for food quality
              and punctuality.
            </p>
          </div>
        </div>
      </div>

      {/* 3. PLATFORM TRUST SECTION */}
      <div className="max-w-[1200px] w-full mx-auto px-4 lg:px-8 mt-16">
        {/* Intentionally dark section for visual contrast */}
        <div className="bg-[#111113] rounded-[2.5rem] p-8 md:p-12 lg:p-16 flex flex-col md:flex-row items-center justify-between gap-12 relative overflow-hidden shadow-2xl border border-[#2a2a2e]">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#5B4EE4]/20 rounded-full blur-[120px] pointer-events-none transform translate-x-1/3 -translate-y-1/3"></div>

          <div className="flex flex-col relative z-10 md:w-1/2">
            <span className="text-xs font-black text-[#5B4EE4] uppercase tracking-widest mb-4">
              Platform Integrity
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white tracking-tight leading-tight mb-6">
              Built on trust. <br /> Curated for quality.
            </h2>
            <p className="text-[#a1a1aa] font-medium leading-relaxed mb-8">
              We act as the sole gatekeeper for property data, ensuring
              high-quality, spam-free listings. Unlike traditional classifieds,
              we don't just let anyone post anything without verification.
            </p>

            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#5B4EE4] shrink-0" />
                <span className="text-sm font-bold text-[#e4e4e7]">
                  Secure user authentication & encrypted data.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#5B4EE4] shrink-0" />
                <span className="text-sm font-bold text-[#e4e4e7]">
                  Direct WhatsApp connections to owners without public number
                  exposure.
                </span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 size={20} className="text-[#5B4EE4] shrink-0" />
                <span className="text-sm font-bold text-[#e4e4e7]">
                  Intelligent badging system to highlight premium and prime
                  properties.
                </span>
              </div>
            </div>
          </div>

          <div className="relative z-10 md:w-1/2 flex justify-center lg:justify-end w-full">
            <div className="bg-white dark:bg-surface border border-gray-200 dark:border-cardBorder rounded-3xl p-6 sm:p-8 flex flex-col gap-6 shadow-xl max-w-sm w-full">
              <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20 mb-2">
                <ShieldCheck size={24} />
              </div>
              <h3 className="text-xl font-black text-gray-900 dark:text-primaryText leading-tight">
                Ready to join the ecosystem?
              </h3>
              <p className="text-sm font-medium text-gray-600 dark:text-secondaryText">
                Create your profile today to save favorites, review properties,
                and connect directly with verified listings.
              </p>
              <Link
                to="/register"
                className="w-full bg-[#5B4EE4] text-white text-center py-3.5 rounded-xl font-black text-sm hover:bg-[#4b40ce] transition-colors shadow-md mt-2"
              >
                Create Free Account
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
